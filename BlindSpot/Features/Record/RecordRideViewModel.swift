//
//  RecordRideViewModel.swift
//  Blind Spot
//
//  Drives the Record screen with REAL sensor data:
//   - Speed + position come from CoreLocation (`LocationService`). Speed is the
//     GPS Doppler speed (accurate), shown in mph.
//   - Distance is accumulated from successive GPS fixes (CLLocation.distance).
//   - The device IMU (`MotionService`, CoreMotion) is sampled continuously; large
//     acceleration spikes log `impact` events and a very large spike auto-triggers
//     the crash-SOS countdown. (A debug button also triggers it.)
//
//  The crash-SOS flow itself is still a UI shell — it shows a mock "SOS sent"
//  confirmation; nothing is actually transmitted yet.
//
//  `@MainActor` because it publishes UI state from timers + sensor callbacks.
//

import Foundation
import Observation
import CoreLocation

@MainActor
@Observable
final class RecordRideViewModel {

    enum Phase {
        case idle
        case recording
    }

    // MARK: - Live telemetry (real)

    private(set) var phase: Phase = .idle
    private(set) var elapsedSeconds: Int = 0
    private(set) var distanceMeters: Double = 0
    private(set) var currentSpeedMPS: Double = 0
    /// Peak IMU magnitude (g) seen this ride — surfaced as a telemetry stat.
    private(set) var peakIMU: Double = 0

    private(set) var events: [RideEvent] = []
    private(set) var flagConfirmation: String?
    /// Set if saving the ride to the backend failed (so it's not silent).
    private(set) var saveError: String?

    // MARK: - Crash SOS shell

    private(set) var sosActive = false
    private(set) var sosCountdown = 15
    private(set) var sosSent = false

    // MARK: - Tuning

    /// User-acceleration magnitude (g) that logs an `impact` event.
    static let impactThreshold = 2.2
    /// Magnitude (g) that auto-triggers the crash-SOS countdown.
    static let crashThreshold = 3.5

    // MARK: - Private

    private var rideStart: Date?
    private var points: [RidePoint] = []
    private var lastFix: CLLocation?
    private var timer: Timer?
    private var sosTimer: Timer?
    private var lastImpactAt: Date?

    // Services are owned by AppEnvironment; held weakly for the active ride.
    private weak var location: LocationService?
    private weak var motion: MotionService?
    // HazardRepository isn't class-constrained, so hold it strongly (no cycle —
    // the repo doesn't reference the VM).
    private var hazards: HazardRepository?

    // MARK: - Lifecycle

    func start(location: LocationService, motion: MotionService, hazards: HazardRepository) {
        guard phase == .idle else { return }
        self.location = location
        self.motion = motion
        self.hazards = hazards

        phase = .recording
        rideStart = Date()
        elapsedSeconds = 0
        distanceMeters = 0
        currentSpeedMPS = 0
        peakIMU = 0
        events = []
        points = []
        lastFix = nil
        saveError = nil

        location.startTracking()
        motion.start { [weak self] magnitude in
            Task { @MainActor in self?.handleMotion(magnitude) }
        }

        // 1 Hz sampler for elapsed time + telemetry from the latest GPS fix.
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tick() }
        }
    }

    private func tick() {
        elapsedSeconds += 1
        currentSpeedMPS = location?.currentSpeedMPS ?? 0

        guard let fix = location?.currentLocation else { return }
        if let last = lastFix {
            let delta = fix.distance(from: last)
            // Ignore GPS jitter (<2 m) and implausible jumps (>200 m in 1 s).
            if delta >= 2 && delta < 200 {
                distanceMeters += delta
                appendPoint(fix)
            }
        } else {
            appendPoint(fix)
        }
    }

    private func appendPoint(_ fix: CLLocation) {
        points.append(RidePoint(
            lat: fix.coordinate.latitude,
            lng: fix.coordinate.longitude,
            speed: max(0, fix.speed),
            recordedAt: Date()
        ))
        lastFix = fix
    }

    // MARK: - IMU

    private func handleMotion(_ magnitude: Double) {
        peakIMU = max(peakIMU, magnitude)
        guard magnitude >= Self.impactThreshold else { return }

        // Debounce so one bump doesn't spam events.
        let now = Date()
        let cooled = lastImpactAt.map { now.timeIntervalSince($0) > 3 } ?? true
        guard cooled else { return }
        lastImpactAt = now

        let coord = location?.currentLocation?.coordinate
        events.append(RideEvent(
            type: .impact,
            lat: coord?.latitude ?? 0,
            lng: coord?.longitude ?? 0,
            imuMagnitude: magnitude,
            occurredAt: now,
            detected: true
        ))

        if magnitude >= Self.crashThreshold {
            triggerCrashSOS(magnitude: magnitude, detected: true)
        }
    }

    // MARK: - Flagging

    func flag(_ hazardType: HazardType) {
        let coord = location?.currentLocation?.coordinate
        let lat = coord?.latitude ?? 0
        let lng = coord?.longitude ?? 0

        events.append(RideEvent(
            type: .manualFlag,
            hazardType: hazardType,
            lat: lat,
            lng: lng,
            imuMagnitude: peakIMU > 0 ? peakIMU : nil,
            occurredAt: Date(),
            detected: false
        ))

        // Also publish it to the crowd-sourced hazard map (fire-and-forget).
        // Quick-flags default to moderate severity; a severity picker can come later.
        if let hazards, coord != nil {
            let hazard = Hazard(lat: lat, lng: lng, type: hazardType,
                                severity: .moderate, status: .reported,
                                firstReportedAt: Date())
            Task { try? await hazards.reportHazard(hazard) }
        }

        flagConfirmation = "\(hazardType.displayName) flagged"
        Task { [weak self] in
            try? await Task.sleep(for: .seconds(2))
            self?.flagConfirmation = nil
        }
    }

    // MARK: - Stop / save

    func stop(using repository: RideRepository) async -> UUID? {
        timer?.invalidate()
        timer = nil
        location?.stopTracking()
        motion?.stop()

        guard let start = rideStart else {
            phase = .idle
            return nil
        }

        let duration = Double(elapsedSeconds)
        let avgSpeed = duration > 0 ? distanceMeters / duration : 0

        // Simple mock safety score: fewer auto-detected events = higher score.
        let detectedCount = events.filter { $0.type != .manualFlag }.count
        let ride = Ride(
            startedAt: start,
            endedAt: Date(),
            distanceMeters: distanceMeters,
            durationSeconds: duration,
            avgSpeed: avgSpeed,
            safetyScore: max(40, 95 - detectedCount * 8),
            rating: nil
        )

        let savedPoints = points
        let savedEvents = events
        do {
            try await repository.saveRide(ride, points: savedPoints, events: savedEvents)
        } catch {
            // Surface instead of silently dropping the ride.
            saveError = "Couldn't save your ride. Check your connection and try again."
            return nil
        }

        reset()
        return ride.id
    }

    private func reset() {
        phase = .idle
        elapsedSeconds = 0
        distanceMeters = 0
        currentSpeedMPS = 0
        peakIMU = 0
        events = []
        points = []
        rideStart = nil
        lastFix = nil
    }

    // MARK: - Crash SOS

    /// Debug button entry point.
    func simulateCrash() {
        triggerCrashSOS(magnitude: 6.4, detected: false)
    }

    private func triggerCrashSOS(magnitude: Double, detected: Bool) {
        guard !sosActive else { return }

        if phase == .recording {
            let coord = location?.currentLocation?.coordinate
            events.append(RideEvent(
                type: .crash,
                lat: coord?.latitude ?? 0,
                lng: coord?.longitude ?? 0,
                imuMagnitude: magnitude,
                occurredAt: Date(),
                detected: detected
            ))
        }

        sosActive = true
        sosSent = false
        sosCountdown = 15
        sosTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.sosTick() }
        }
    }

    private func sosTick() {
        guard sosCountdown > 0 else {
            sosTimer?.invalidate()
            sosTimer = nil
            sosSent = true
            return
        }
        sosCountdown -= 1
    }

    func dismissSOS() {
        sosTimer?.invalidate()
        sosTimer = nil
        sosActive = false
        sosSent = false
        sosCountdown = 15
    }
}
