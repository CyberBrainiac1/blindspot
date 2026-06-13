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
                        emergencyContact: environment.profile.emergencyContact,
                        onDismiss: { viewModel.dismissSOS() }
                    )
                }
            }
            // Haptic each time an event is flagged (count goes up). iOS 17 API.
            .sensoryFeedback(.success, trigger: viewModel.events.count)
            .animation(.easeInOut, value: viewModel.sosActive)
        }
    }

    // MARK: - Idle

    private var idleState: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "bicycle")
                .font(.system(size: 64, weight: .bold))
                .foregroundStyle(Color.bsPrimary)
            Text("Ready to ride")
                .font(.bsTitle)
                .foregroundStyle(Color.bsWhite)
            Text("Mount your phone and start recording. Telemetry is simulated in this build.")
                .font(.bsBody)
                .multilineTextAlignment(.center)
                .foregroundStyle(Color.bsWhite.opacity(0.6))
                .padding(.horizontal, 32)
            Spacer()
            PrimaryButton(title: "START RIDE", systemImage: "record.circle") {
                viewModel.start()
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
    }

    // MARK: - Recording

    private var recordingState: some View {
        VStack(spacing: 24) {
            // Live telemetry grid.
            BSCard {
                VStack(spacing: 20) {
                    HStack(spacing: 12) {
                        StatTile(value: Format.duration(Double(viewModel.elapsedSeconds)),
                                 label: "Time")
                        StatTile(value: Format.km(viewModel.distanceMeters),
                                 label: "Distance", unit: "km")
                    }
                    HStack(spacing: 12) {
                        StatTile(value: Format.kmh(viewModel.currentSpeed),
                                 label: "Speed", unit: "km/h")
                        StatTile(value: "\(viewModel.events.count)",
                                 label: "Flags")
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

#Preview {
    RecordRideView()
        .environment(AppEnvironment(
            hazardRepository: MockHazardRepository(),
            rideRepository: MockRideRepository()
        ))
        .preferredColorScheme(.dark)
}
