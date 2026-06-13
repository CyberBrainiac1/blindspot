//
//  RecordRideViewModel.swift
//  Blind Spot
//
//  Drives the Record screen. For the FOUNDATION milestone everything is
//  SIMULATED — no CoreLocation/CoreMotion. A 1Hz timer increments elapsed time,
//  distance, and speed with plausible values, and lays down fake `RidePoint`s so
//  the saved ride has a real polyline for the recap.
//
//  The crash-SOS flow is a UI shell: a countdown that ends in a MOCK
//  "SOS sent" confirmation. Nothing is actually sent.
//
//  Marked `@MainActor` because it mutates observable UI state from timers.
//

import Foundation
import Observation
import CoreLocation

@MainActor
@Observable
final class RecordRideViewModel {

    /// Where we are in the record lifecycle.
    enum Phase {
        case idle        // showing START RIDE
        case recording   // active ride with live telemetry
    }

    // MARK: - Live (simulated) telemetry

    private(set) var phase: Phase = .idle
    private(set) var elapsedSeconds: Int = 0
    private(set) var distanceMeters: Double = 0
    private(set) var currentSpeed: Double = 0      // meters/second

    /// Events flagged during this ride (manual flags, simulated crash, etc.).
    private(set) var events: [RideEvent] = []

    /// A short-lived confirmation string shown after a flag (e.g. "Pothole flagged").
    private(set) var flagConfirmation: String?

    // MARK: - Crash SOS shell

    private(set) var sosActive = false
    private(set) var sosCountdown = 15
    /// Set true when the countdown expires (shows the mock "SOS sent" screen).
    private(set) var sosSent = false

    // MARK: - Private simulation state

    private var rideStart: Date?
    private var points: [RidePoint] = []
    private var timer: Timer?
    private var sosTimer: Timer?

    // Simulated current position; starts at San Jose and drifts each tick.
    private var simLat = SampleData.sanJose.latitude
    private var simLng = SampleData.sanJose.longitude

    // MARK: - Lifecycle

    /// Begin a simulated ride.
    func start() {
        guard phase == .idle else { return }
        phase = .recording
        rideStart = Date()
        elapsedSeconds = 0
        distanceMeters = 0
        currentSpeed = 0
        events = []
        points = []
        simLat = SampleData.sanJose.latitude
        simLng = SampleData.sanJose.longitude

        // 1Hz simulation tick.
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            // Hop back to the main actor to mutate observable state.
            Task { @MainActor in self?.tick() }
        }
    }

    /// One simulated second: advance time, distance, speed, and drop a point.
    private func tick() {
        elapsedSeconds += 1

        // A wandering speed around ~6 m/s (~22 km/h) using a smooth sine, so the
        // readout looks alive without real randomness.
        let t = Double(elapsedSeconds)
        currentSpeed = max(0, 6.0 + sin(t * 0.25) * 2.0)

        // Distance covered this second = speed (m/s) * 1s.
        distanceMeters += currentSpeed

        // Drift the simulated coordinate roughly north-east by the distance moved.
        let metersPerDegLat = 111_320.0
        let metersPerDegLng = 111_320.0 * cos(simLat * .pi / 180)
        simLat += (currentSpeed * 0.7) / metersPerDegLat
        simLng += (currentSpeed * 0.7) / metersPerDegLng

        points.append(RidePoint(
            lat: simLat,
            lng: simLng,
            speed: currentSpeed,
            recordedAt: Date()
        ))
    }

    /// Flag a hazard at the current simulated location.
    func flag(_ hazardType: HazardType) {
        let event = RideEvent(
            type: .manualFlag,
            hazardType: hazardType,
            lat: simLat,
            lng: simLng,
            occurredAt: Date(),
            detected: false   // a manual flag is not ML-detected
        )
        events.append(event)

        // Brief confirmation; clear after a moment.
        flagConfirmation = "\(hazardType.displayName) flagged"
        Task { [weak self] in
            try? await Task.sleep(for: .seconds(2))
            self?.flagConfirmation = nil
        }
    }

    /// Stop the ride, build the summary, persist it, and return the new ride id
    /// so the view can navigate to its recap. Resets back to idle.
    func stop(using repository: RideRepository) async -> UUID? {
        timer?.invalidate()
        timer = nil

        guard let start = rideStart else {
            phase = .idle
            return nil
        }

        let duration = Double(elapsedSeconds)
        let avgSpeed = duration > 0 ? distanceMeters / duration : 0

        let ride = Ride(
            startedAt: start,
            endedAt: Date(),
            distanceMeters: distanceMeters,
            durationSeconds: duration,
            avgSpeed: avgSpeed,
            // A simple mock safety score: fewer events = higher score.
            safetyScore: max(40, 95 - events.count * 8),
            rating: nil
        )

        // Snapshot detail before resetting.
        let savedPoints = points
        let savedEvents = events

        try? await repository.saveRide(ride, points: savedPoints, events: savedEvents)

        reset()
        return ride.id
    }

    /// Return to the idle (START RIDE) state.
    private func reset() {
        phase = .idle
        elapsedSeconds = 0
        distanceMeters = 0
        currentSpeed = 0
        events = []
        points = []
        rideStart = nil
    }

    // MARK: - Crash SOS (mock)

    /// Trigger the crash-SOS countdown overlay (debug button / future auto-detect).
    func simulateCrash() {
        guard !sosActive else { return }

        // Record the crash as an event on the ride if one is in progress.
        if phase == .recording {
            events.append(RideEvent(
                type: .crash,
                lat: simLat,
                lng: simLng,
                imuMagnitude: 6.4,
                occurredAt: Date(),
                detected: true   // pretend the (future) detector caught it
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
            // Countdown finished → mock "SOS sent".
            sosTimer?.invalidate()
            sosTimer = nil
            sosSent = true
            return
        }
        sosCountdown -= 1
    }

    /// Rider cancelled the SOS (the "I'm OK" / Dismiss action).
    func dismissSOS() {
        sosTimer?.invalidate()
        sosTimer = nil
        sosActive = false
        sosSent = false
        sosCountdown = 15
    }
}
