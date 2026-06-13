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

                // MARK: Map with hazard annotations + the rider's live location
                Map(position: $cameraPosition) {
                    // The blue user-location dot (requires location permission).
                    UserAnnotation()

                    ForEach(viewModel.hazards) { hazard in
                        Annotation(
                            hazard.type.displayName,
                            coordinate: CLLocationCoordinate2D(latitude: hazard.lat, longitude: hazard.lng)
                        ) {
                            HazardBadge(type: hazard.type, style: .pin)
                        }
                    }
                }
                .mapStyle(.standard(elevation: .flat))
                .mapControls {
                    MapUserLocationButton()   // recenter on the rider
                    MapCompass()
                }
                .ignoresSafeArea(edges: .top)
            }
            .navigationTitle("Hazard Map")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.bsCharcoal, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            // Kick off the fetch + ask for location so the user dot can show.
            .task {
                environment.locationService.requestAuthorization()
                await viewModel.load(using: environment.hazardRepository)
            }
            .overlay {
                if viewModel.isLoading && viewModel.hazards.isEmpty {
                    ProgressView().tint(.bsPrimary)
                }
            }
        }
    }

}

#Preview {
    MapScreen()
        .environment(AppEnvironment.preview)
        .preferredColorScheme(.dark)
}
