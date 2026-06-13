//
//  BlindSpotApp.swift
//  Blind Spot
//
//  App entry point.
//
//  Responsibilities for the FOUNDATION milestone:
//   - Construct the single `AppEnvironment` (our dependency container) using the
//     in-memory MOCK repositories.
//   - Inject it into the SwiftUI environment so every screen / view model can
//     read it via `@Environment(AppEnvironment.self)`.
//   - Force dark mode app-wide (this is a hi-vis, instrument-panel safety product).
//
//  When the real data layer (Supabase/SQL) arrives in a later prompt, the ONLY
//  thing that changes here is which repositories `AppEnvironment` is built with.
//  No views or view models change.
//

import SwiftUI

@main
struct BlindSpotApp: App {

    // The dependency container. `@State` keeps a single instance alive for the
    // whole app lifetime. It is an `@Observable` object (see AppEnvironment.swift).
    //
    // NOTE: This is the seam for the future backend. Today we hand it the mock
    // repositories. Later, swap these for SupabaseHazardRepository(), etc. — and
    // nothing else in the app needs to change.
    @State private var environment = AppEnvironment(
        hazardRepository: MockHazardRepository(),
        rideRepository: MockRideRepository()
    )

    var body: some Scene {
        WindowGroup {
            // RootView shows onboarding on first launch, then the main tab bar.
            RootView()
                // Inject the dependency container into the environment.
                .environment(environment)
                // Force dark mode everywhere — the design system is dark-first.
                .preferredColorScheme(.dark)
        }
    }
}
