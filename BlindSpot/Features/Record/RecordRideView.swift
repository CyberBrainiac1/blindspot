//
//  RecordRideView.swift
//  Blind Spot
//
//  The Record tab. Two states:
//   - IDLE: a big "START RIDE" call to action.
//   - RECORDING: live (simulated) telemetry as StatTiles, the big FlagButton,
//     a STOP button, and a debug "Simulate crash" button.
//
//  On STOP the ride is saved via the repository and we navigate to its recap.
//  The crash-SOS overlay sits on top of everything when active.
//

import SwiftUI

struct RecordRideView: View {

    @Environment(AppEnvironment.self) private var environment
    @State private var viewModel = RecordRideViewModel()

    // Navigation path for pushing the recap after a ride is saved.
    @State private var path: [UUID] = []

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                Color.bsBlack.ignoresSafeArea()

                switch viewModel.phase {
                case .idle:      idleState
                case .recording: recordingState
                }
            }
            .navigationTitle("Record")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.bsCharcoal, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .navigationDestination(for: UUID.self) { rideId in
                RideRecapView(rideId: rideId)
            }
            // Crash-SOS overlay floats above the whole screen when active.
            .overlay {
                if viewModel.sosActive {
                    CrashSOSOverlay(
                        countdown: viewModel.sosCountdown,
                        sent: viewModel.sosSent,
                        emergencyContact: environment.profile?.emergencyContact,
                        onDismiss: { viewModel.dismissSOS() }
                    )
                }
            }
            // Haptic each time an event is flagged (count goes up). iOS 17 API.
            .sensoryFeedback(.success, trigger: viewModel.events.count)
            .animation(.easeInOut, value: viewModel.sosActive)
            // Ask for location up front so the first ride has GPS immediately.
            .task { environment.locationService.requestAuthorization() }
        }
    }

    // MARK: - Idle

    private var idleState: some View {
        VStack(spacing: 28) {
            Spacer()

            // The big, central, tap-to-start control.
            BigStartButton {
                viewModel.start(
                    location: environment.locationService,
                    motion: environment.motionService,
                    hazards: environment.hazardRepository
                )
            }

            Text("Tap to start your ride")
                .font(.bsBody)
                .foregroundStyle(Color.bsWhite.opacity(0.6))

            // Hint if location is denied — GPS is required for a real ride.
            if environment.locationService.authorizationStatus == .denied {
                Text("Location is off. Enable it in Settings to record rides.")
                    .font(.bsCaption)
                    .foregroundStyle(Color.bsModerate)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Spacer()
        }
    }

    // MARK: - Recording

    private var recordingState: some View {
        VStack(spacing: 24) {
            // Live telemetry grid.
            BSCard {
                VStack(spacing: 20) {
                    HStack(spacing: 12) {
                        StatTile(value: Format.mph(viewModel.currentSpeedMPS),
                                 label: "Speed", unit: "mph")
                        StatTile(value: Format.duration(Double(viewModel.elapsedSeconds)),
                                 label: "Time")
                    }
                    HStack(spacing: 12) {
                        StatTile(value: Format.miles(viewModel.distanceMeters),
                                 label: "Distance", unit: "mi")
                        // Peak IMU magnitude this ride — proves the accelerometer is live.
                        StatTile(value: String(format: "%.1f", viewModel.peakIMU),
                                 label: "Peak G", unit: "g")
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(.top, 16)

            Spacer()

            // The big hi-vis flag button + transient confirmation.
            ZStack {
                FlagButton {
                    // Default flag type for the quick-tap; a type picker can come later.
                    viewModel.flag(.pothole)
                }
                if let confirmation = viewModel.flagConfirmation {
                    Text(confirmation)
                        .font(.bsCaption)
                        .foregroundStyle(Color.bsBlack)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.bsPrimaryBright)
                        .clipShape(Capsule())
                        .offset(y: 100)
                        .transition(.opacity)
                }
            }
            .animation(.easeInOut, value: viewModel.flagConfirmation)

            Spacer()

            // Surface a save failure instead of dropping the ride silently.
            if let saveError = viewModel.saveError {
                Text(saveError)
                    .font(.bsCaption)
                    .foregroundStyle(Color.bsSevere)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }

            // Stop + debug crash controls.
            VStack(spacing: 12) {
                Button {
                    Task {
                        if let rideId = await viewModel.stop(using: environment.rideRepository) {
                            path.append(rideId)   // navigate to recap
                        }
                    }
                } label: {
                    Text("STOP")
                        .font(.bsButton)
                        .foregroundStyle(Color.bsWhite)
                        .frame(maxWidth: .infinity, minHeight: 56)
                        .background(Color.bsGraphite)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(Color.bsSevere, lineWidth: 2)
                        )
                }

                // Debug-only affordance to exercise the crash-SOS flow.
                Button {
                    viewModel.simulateCrash()
                } label: {
                    Label("Simulate crash", systemImage: "exclamationmark.triangle.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.bsWhite.opacity(0.5))
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
    }
}

// MARK: - Big start button

/// The large, central orange circle that starts a ride. Big tap target,
/// pressed state darkens + scales.
private struct BigStartButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: "figure.outdoor.cycle")
                    .font(.system(size: 64, weight: .heavy))
                Text("START")
                    .font(.custom(BSFont.monoBold, size: 22))
                    .tracking(3)
            }
            .foregroundStyle(Color.bsBlack)
            .frame(width: 240, height: 240)
        }
        .buttonStyle(BigStartButtonStyle())
        .accessibilityLabel("Start ride")
    }
}

private struct BigStartButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(
                Circle().fill(configuration.isPressed ? Color.bsPrimaryDeep : Color.bsPrimary)
            )
            // Soft halo so it reads as the focal point.
            .overlay(
                Circle().stroke(Color.bsPrimaryBright.opacity(0.4), lineWidth: 6)
            )
            .shadow(color: Color.bsPrimary.opacity(0.5), radius: 24)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

#Preview {
    RecordRideView()
        .environment(AppEnvironment.preview)
        .preferredColorScheme(.dark)
}
