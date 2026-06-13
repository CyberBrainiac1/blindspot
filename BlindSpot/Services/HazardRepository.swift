//
//  HazardRepository.swift
//  Blind Spot
//
//  The abstraction (the "seam") between the UI and wherever hazards come from.
//  Today: an in-memory mock. Later: Supabase/SQL — by writing a new conformer
//  and swapping it in `AppEnvironment`. Views/view models never change.
//
//  Methods are `async throws` so the mock and the future networked impl share
//  one signature.
//

import Foundation

protocol HazardRepository {
    /// All known hazards (the map reads these).
    func fetchHazards() async throws -> [Hazard]
}
