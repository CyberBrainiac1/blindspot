//
//  RideListView.swift
//  Blind Spot
//
//  Lists recorded rides (date, distance, duration, safety-score badge). Tapping
//  a row pushes the ride recap.
//

import SwiftUI

struct RideListView: View {

    @Environment(AppEnvironment.self) private var environment
    @State private var viewModel = RidesViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Color.bsBlack.ignoresSafeArea()

                if viewModel.rides.isEmpty && !viewModel.isLoading {
                    emptyState
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(viewModel.rides) { ride in
                                NavigationLink(value: ride.id) {
                                    RideRow(ride: ride)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(16)
                    }
                }
            }
            .navigationTitle("Rides")
            .toolbarBackground(Color.bsCharcoal, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            // Push the recap, keyed by ride id (the recap re-fetches detail).
            .navigationDestination(for: UUID.self) { rideId in
                RideRecapView(rideId: rideId)
            }
            // Reload each time the list appears so a freshly saved ride shows up.
            .task {
                await viewModel.load(using: environment.rideRepository)
            }
            .refreshable {
                await viewModel.load(using: environment.rideRepository)
            }
            .overlay {
                if viewModel.isLoading && viewModel.rides.isEmpty {
                    ProgressView().tint(.bsPrimary)
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "bicycle")
                .font(.system(size: 48, weight: .bold))
                .foregroundStyle(Color.bsWhite.opacity(0.4))
            Text("No rides yet")
                .font(.bsHeadline)
                .foregroundStyle(Color.bsWhite)
            Text("Start a ride from the Record tab.")
                .font(.bsBody)
                .foregroundStyle(Color.bsWhite.opacity(0.6))
        }
        .padding()
    }
}

// MARK: - Ride row

/// One row in the rides list.
private struct RideRow: View {
    let ride: Ride

    var body: some View {
        BSCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(Format.rideDate(ride.startedAt))
                        .font(.bsHeadline)
                        .foregroundStyle(Color.bsWhite)
                    Spacer()
                    SafetyScoreBadge(score: ride.safetyScore)
                }

                HStack(spacing: 24) {
                    rowStat(value: Format.km(ride.distanceMeters), unit: "km", label: "Distance")
                    rowStat(value: Format.duration(ride.durationSeconds), unit: nil, label: "Duration")
                    rowStat(value: Format.kmh(ride.avgSpeed), unit: "km/h", label: "Avg")
                }

                // Show the rider's star rating if present.
                if let rating = ride.rating {
                    HStack(spacing: 2) {
                        ForEach(1...5, id: \.self) { star in
                            Image(systemName: star <= rating ? "star.fill" : "star")
                                .font(.system(size: 12))
                                .foregroundStyle(star <= rating ? Color.bsPrimary : Color.bsWhite.opacity(0.3))
                        }
                    }
                }
            }
        }
    }

    // A compact monospaced stat for the row (smaller than the full StatTile).
    private func rowStat(value: String, unit: String?, label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(value)
                    .font(.bsStatMedium)
                    .foregroundStyle(Color.bsWhite)
                if let unit {
                    Text(unit)
                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                        .foregroundStyle(Color.bsWhite.opacity(0.5))
                }
            }
            Text(label.uppercased())
                .font(.system(size: 10, weight: .semibold))
                .tracking(1.0)
                .foregroundStyle(Color.bsWhite.opacity(0.5))
        }
    }
}

// MARK: - Safety score badge

/// A small pill showing 0–100 safety score, colored by band (data viz only,
/// paired with the number + a shield icon so it's never color-only).
struct SafetyScoreBadge: View {
    let score: Int?

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: "shield.lefthalf.filled")
                .font(.system(size: 12, weight: .bold))
            Text(score.map(String.init) ?? "—")
                .font(.system(size: 14, weight: .heavy, design: .monospaced))
        }
        .foregroundStyle(Color.bsBlack)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(color)
        .clipShape(Capsule())
        .accessibilityLabel(score.map { "Safety score \($0)" } ?? "No safety score")
    }

    // Band the score into the semantic colors (data viz).
    private var color: Color {
        guard let score else { return .bsWhite.opacity(0.3) }
        switch score {
        case 80...:  return .bsGood
        case 60..<80: return .bsModerate
        default:      return .bsSevere
        }
    }
}

#Preview {
    RideListView()
        .environment(AppEnvironment(
            hazardRepository: MockHazardRepository(),
            rideRepository: MockRideRepository()
        ))
        .preferredColorScheme(.dark)
}
