//
//  RidesViewModel.swift
//  Blind Spot
//
//  Backs the Rides list. Loads ride summaries from the injected `RideRepository`.
//

import Foundation
import Observation

@MainActor
@Observable
final class RidesViewModel {

    private(set) var rides: [Ride] = []
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    func load(using repository: RideRepository) async {
        isLoading = true
        errorMessage = nil
        do {
            rides = try await repository.fetchRides()
        } catch {
            errorMessage = "Couldn't load rides."
        }
        isLoading = false
    }
}
