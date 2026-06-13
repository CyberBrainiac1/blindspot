//
//  RootView.swift
//  Blind Spot
//
//  Decides what the rider sees at launch: the onboarding flow until it's
//  completed, then the main tab bar. Reads `hasCompletedOnboarding` from the
//  app environment (persisted in UserDefaults), so onboarding only shows once.
//

import SwiftUI

struct RootView: View {

    @Environment(AppEnvironment.self) private var environment

    var body: some View {
        Group {
            if environment.hasCompletedOnboarding {
                RootTabView()
            } else {
                OnboardingView()
            }
        }
        // Smooth cross-fade when onboarding completes.
        .animation(.easeInOut, value: environment.hasCompletedOnboarding)
    }
}

#Preview {
    RootView()
        .environment(AppEnvironment(
            hazardRepository: MockHazardRepository(),
            rideRepository: MockRideRepository()
        ))
        .preferredColorScheme(.dark)
}
