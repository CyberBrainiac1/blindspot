//
//  MapScreen.swift
//  Blind Spot
//
//  The hazard map: a SwiftUI `Map` centered on San Jose with an `Annotation`
//  per mock hazard (rendered via `HazardBadge` pins), plus a small severity
//  legend. Reads hazards through the repository (via the app environment).
//

import SwiftUI
import MapKit
import CoreLocation

struct MapScreen: View {

    // The dependency container; gives us the hazard repository.
    @Environment(AppEnvironment.self) private var environment

    @State private var viewModel = MapViewModel()

    // Initial camera centered on downtown San Jose with a city-block zoom.
    @State private var cameraPosition: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: SampleData.sanJose,
            span: MKCoordinateSpan(latitudeDelta: 0.045, longitudeDelta: 0.045)
        )
    )

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomLeading) {

                // MARK: Map with hazard annotations
                Map(position: $cameraPosition) {
                    ForEach(viewModel.hazards) { hazard in
                        Annotation(
                            hazard.type.displayName,
                            coordinate: CLLocationCoordinate2D(latitude: hazard.lat, longitude: hazard.lng)
                        ) {
                            HazardBadge(type: hazard.type, severity: hazard.severity, style: .pin)
                        }
                    }
                }
                .mapStyle(.standard(elevation: .flat))
                .ignoresSafeArea(edges: .top)

                // MARK: Legend (color is paired with icon + label — never color-only)
                legend
                    .padding(16)
            }
            .navigationTitle("Hazard Map")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.bsCharcoal, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            // Kick off the fetch when the screen appears.
            .task {
                await viewModel.load(using: environment.hazardRepository)
            }
            .overlay {
                if viewModel.isLoading && viewModel.hazards.isEmpty {
                    ProgressView().tint(.bsPrimary)
                }
            }
        }
    }

    // MARK: - Legend

    private var legend: some View {
        BSCard(padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                Text("SEVERITY")
                    .font(.bsCaption)
                    .tracking(1.2)
                    .foregroundStyle(Color.bsWhite.opacity(0.6))

                ForEach(Severity.allCases) { severity in
                    HStack(spacing: 8) {
                        Image(systemName: severity.symbolName)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(severity.color)
                            .frame(width: 16)
                        Text(severity.displayName)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color.bsWhite)
                    }
                }
            }
        }
        // Keep the legend compact in the corner.
        .frame(width: 150)
    }
}

#Preview {
    MapScreen()
        .environment(AppEnvironment(
            hazardRepository: MockHazardRepository(),
            rideRepository: MockRideRepository()
        ))
        .preferredColorScheme(.dark)
}
