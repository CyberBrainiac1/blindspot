//
//  RideRecapView.swift
//  Blind Spot
//
//  Post-ride recap: the route drawn as a `MapPolyline`, summary `StatTile`s,
//  an editable star rating (persisted via `setRating`), and a photos placeholder.
//
//  Loads the full ride detail (summary + points + events) from the repository
//  by id, so it works equally for seeded rides and ones just saved by Record.
//

import SwiftUI
import MapKit
import CoreLocation
import Observation

// MARK: - View model

@MainActor
@Observable
final class RideRecapViewModel {

    private(set) var ride: Ride?
    private(set) var points: [RidePoint] = []
    private(set) var events: [RideEvent] = []
    private(set) var isLoading = false

    /// The route as map coordinates (derived from points).
    var routeCoordinates: [CLLocationCoordinate2D] {
        points.map { CLLocationCoordinate2D(latitude: $0.lat, longitude: $0.lng) }
    }

    /// Number of hazard flags / events on this ride (shown as a stat).
    var hazardCount: Int { events.count }

    func load(rideId: UUID, using repository: RideRepository) async {
        isLoading = true
        if let detail = try? await repository.fetchRide(id: rideId) {
            ride = detail.0
            points = detail.1
            events = detail.2
        }
        isLoading = false
    }

    /// Persist a new rating and update local state so the stars reflect it.
    func setRating(_ rating: Int, using repository: RideRepository) async {
        guard let rideId = ride?.id else { return }
        try? await repository.setRating(rideId: rideId, rating: rating)
        ride?.rating = rating
    }
}

// MARK: - View

struct RideRecapView: View {
    let rideId: UUID

    @Environment(AppEnvironment.self) private var environment
    @State private var viewModel = RideRecapViewModel()

    var body: some View {
        ZStack {
            Color.bsBlack.ignoresSafeArea()

            if let ride = viewModel.ride {
                ScrollView {
                    VStack(spacing: 16) {
                        routeMap
                        statsGrid(for: ride)
                        ratingCard(for: ride)
                        photosPlaceholder
                    }
                    .padding(16)
                }
            } else if viewModel.isLoading {
                ProgressView().tint(.bsPrimary)
            } else {
                Text("Ride not found.")
                    .font(.bsBody)
                    .foregroundStyle(Color.bsWhite.opacity(0.6))
            }
        }
        .navigationTitle("Recap")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Color.bsCharcoal, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .task {
            await viewModel.load(rideId: rideId, using: environment.rideRepository)
        }
    }

    // MARK: Route map (polyline + event markers)

    private var routeMap: some View {
        Map(initialPosition: cameraPosition) {
            // The ride route as a bright yellow polyline.
            MapPolyline(coordinates: viewModel.routeCoordinates)
                .stroke(Color.bsPrimary, lineWidth: 5)

            // A marker per event along the route.
            ForEach(viewModel.events) { event in
                Annotation(
                    event.type.displayName,
                    coordinate: CLLocationCoordinate2D(latitude: event.lat, longitude: event.lng)
                ) {
                    Image(systemName: event.type.symbolName)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color.bsBlack)
                        .padding(7)
                        .background(Circle().fill(Color.bsPrimaryBright))
                        .overlay(Circle().stroke(Color.bsBlack, lineWidth: 1.5))
                }
            }
        }
        .mapStyle(.standard(elevation: .flat))
        .frame(height: 260)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .allowsHitTesting(false)   // recap map is for viewing, not panning
    }

    // Frame the camera on the route's bounding region.
    private var cameraPosition: MapCameraPosition {
        let coords = viewModel.routeCoordinates
        guard let first = coords.first else {
            return .region(MKCoordinateRegion(
                center: SampleData.sanJose,
                span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.02)
            ))
        }

        // Compute min/max bounds, then pad a little.
        var minLat = first.latitude, maxLat = first.latitude
        var minLng = first.longitude, maxLng = first.longitude
        for c in coords {
            minLat = min(minLat, c.latitude);  maxLat = max(maxLat, c.latitude)
            minLng = min(minLng, c.longitude); maxLng = max(maxLng, c.longitude)
        }
        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2
        )
        let span = MKCoordinateSpan(
            latitudeDelta: max(0.005, (maxLat - minLat) * 1.5),
            longitudeDelta: max(0.005, (maxLng - minLng) * 1.5)
        )
        return .region(MKCoordinateRegion(center: center, span: span))
    }

    // MARK: Stats grid

    private func statsGrid(for ride: Ride) -> some View {
        BSCard {
            VStack(spacing: 20) {
                HStack(spacing: 12) {
                    StatTile(value: Format.miles(ride.distanceMeters), label: "Distance", unit: "mi")
                    StatTile(value: Format.duration(ride.durationSeconds), label: "Duration")
                }
                HStack(spacing: 12) {
                    StatTile(value: Format.mph(ride.avgSpeed), label: "Avg Speed", unit: "mph")
                    StatTile(value: "\(viewModel.hazardCount)", label: "Hazards")
                }
                HStack(spacing: 12) {
                    StatTile(
                        value: ride.safetyScore.map(String.init) ?? "—",
                        label: "Safety Score"
                    )
                    // Spacer tile to keep the grid balanced.
                    Color.clear.frame(maxWidth: .infinity)
                }
            }
        }
    }

    // MARK: Editable rating

    private func ratingCard(for ride: Ride) -> some View {
        BSCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("RATE THIS RIDE")
                    .font(.bsCaption)
                    .tracking(1.2)
                    .foregroundStyle(Color.bsWhite.opacity(0.6))

                HStack(spacing: 10) {
                    ForEach(1...5, id: \.self) { star in
                        let filled = (ride.rating ?? 0) >= star
                        Image(systemName: filled ? "star.fill" : "star")
                            .font(.system(size: 30, weight: .bold))
                            .foregroundStyle(filled ? Color.bsPrimary : Color.bsWhite.opacity(0.3))
                            .onTapGesture {
                                // Persist via the repo; VM updates local state.
                                Task {
                                    await viewModel.setRating(star, using: environment.rideRepository)
                                }
                            }
                            .accessibilityLabel("\(star) star\(star == 1 ? "" : "s")")
                    }
                }
            }
        }
    }

    // MARK: Photos placeholder

    private var photosPlaceholder: some View {
        BSCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("PHOTOS")
                    .font(.bsCaption)
                    .tracking(1.2)
                    .foregroundStyle(Color.bsWhite.opacity(0.6))

                HStack(spacing: 12) {
                    ForEach(0..<3, id: \.self) { _ in
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Color.bsCharcoal)
                            .frame(height: 80)
                            .overlay(
                                Image(systemName: "photo")
                                    .font(.system(size: 22))
                                    .foregroundStyle(Color.bsWhite.opacity(0.3))
                            )
                    }
                }

                Text("Ride photos arrive with the data layer.")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.bsWhite.opacity(0.4))
            }
        }
    }
}

#Preview {
    // Preview with the first seeded ride (single expression — no `return`, so it
    // stays valid inside the #Preview ViewBuilder closure).
    NavigationStack {
        RideRecapView(rideId: SampleData.makeRides()[0].ride.id)
    }
    .environment(AppEnvironment.preview)
    .preferredColorScheme(.dark)
}
