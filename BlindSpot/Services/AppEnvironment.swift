//
//  AppEnvironment.swift
//  Blind Spot
//
//  The dependency container — THE single seam for the future data layer.
//
//  It holds the repositories as their PROTOCOL types (`HazardRepository`,
//  `RideRepository`), so the concrete implementation is invisible to the rest of
//  the app. Today they're the mocks; later they become Supabase-backed. Swapping
//  is a one-line change in `BlindSpotApp` — no view or view-model edits.
//
//  It also holds the local rider `profile` and the `hasCompletedOnboarding`
//  flag, both LIGHTLY persisted to UserDefaults so the app remembers the rider
//  across launches. (Real server-side persistence + auth arrive later; this is
//  just enough to not re-run onboarding every launch.)
//
//  It is `@Observable` and injected via `.environment(...)`, so any view reads it
//  with `@Environment(AppEnvironment.self) var environment`.
//

import Foundation
import Observation

@Observable
final class AppEnvironment {

    /// Source of crowd-sourced hazards (Map screen).
    let hazardRepository: HazardRepository

    /// Source of ride summaries + detail (Rides, Recap, Record screens).
    let rideRepository: RideRepository

    /// The local rider profile. Mutations are persisted to UserDefaults via
    /// `didSet` so they survive relaunch.
    var profile: Profile {
        didSet { persistProfile() }
    }

    /// Whether the rider has finished the onboarding flow. Drives the root view.
    var hasCompletedOnboarding: Bool {
        didSet {
            UserDefaults.standard.set(hasCompletedOnboarding, forKey: Keys.onboarded)
        }
    }

    init(
        hazardRepository: HazardRepository,
        rideRepository: RideRepository
    ) {
        self.hazardRepository = hazardRepository
        self.rideRepository = rideRepository

        // Restore persisted state (if any) so we resume where the rider left off.
        self.profile = AppEnvironment.loadProfile() ?? Profile()
        self.hasCompletedOnboarding = UserDefaults.standard.bool(forKey: Keys.onboarded)
    }

    // MARK: - Local persistence (UserDefaults)
    //
    // NOTE: This is intentionally minimal. When the data layer lands, profile
    // storage moves server-side and these helpers go away.

    private enum Keys {
        static let profile = "bs.profile"
        static let onboarded = "bs.hasCompletedOnboarding"
    }

    private func persistProfile() {
        if let data = try? JSONEncoder().encode(profile) {
            UserDefaults.standard.set(data, forKey: Keys.profile)
        }
    }

    private static func loadProfile() -> Profile? {
        guard let data = UserDefaults.standard.data(forKey: Keys.profile) else { return nil }
        return try? JSONDecoder().decode(Profile.self, from: data)
    }
}
