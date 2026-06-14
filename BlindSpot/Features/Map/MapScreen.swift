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
    @State private var showReportPicker = false
    @State private var reportError: String?

    // Follow the rider's real location; fall back to San Jose until it's available.
    @State private var cameraPosition: MapCameraPosition = .userLocation(
        fallback: .region(
            MKCoordinateRegion(
                center: SampleData.sanJose,
                span: MKCoordinateSpan(latitudeDelta: 0.045, longitudeDelta: 0.045)
            )
        )
    )

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {

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

                // Report a hazard at the rider's current location.
                reportButton
                    .padding(.trailing, 16)
                    .padding(.bottom, 24)
            }
            .navigationTitle("Hazard Map")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.bsCharcoal, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            // Ask for location + start foreground updates so the blue dot shows,
            // the camera can follow the rider, and "report here" knows the location.
            .task {
                environment.locationService.requestAuthorization()
                environment.locationService.startUpdates()
                await viewModel.load(using: environment.hazardRepository)
            }
            .onDisappear { environment.locationService.stopUpdates() }
            .overlay {
                if viewModel.isLoading && viewModel.hazards.isEmpty {
                    ProgressView().tint(.bsPrimary)
                }
            }
            // Pick the hazard type to drop at the current location.
            .confirmationDialog("Report a hazard here", isPresented: $showReportPicker,
                                titleVisibility: .visible) {
                ForEach(HazardType.allCases) { type in
                    Button(type.displayName) { reportHazard(type) }
                }
                Button("Cancel", role: .cancel) {}
            }
            .alert("Location unavailable",
                   isPresented: Binding(get: { reportError != nil },
                                        set: { if !$0 { reportError = nil } })) {
                Button("OK", role: .cancel) { reportError = nil }
            } message: {
                Text(reportError ?? "")
            }
        }
    }

    // MARK: Report button

    private var reportButton: some View {
        Button {
            showReportPicker = true
        } label: {
            Image(systemName: "flag.fill")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Color.bsBlack)
                .frame(width: 60, height: 60)
                .background(Circle().fill(Color.bsPrimary))
                .overlay(Circle().stroke(Color.bsBlack.opacity(0.25), lineWidth: 1))
                .shadow(radius: 6)
        }
        .accessibilityLabel("Report a hazard at my location")
    }

    /// Report a hazard of `type` at the rider's current GPS location.
    private func reportHazard(_ type: HazardType) {
        guard let loc = environment.locationService.currentLocation else {
            reportError = "Waiting for your location — try again in a moment."
            return
        }
        let hazard = Hazard(
            lat: loc.coordinate.latitude, lng: loc.coordinate.longitude,
            type: type, severity: .moderate, status: .reported,
            firstReportedAt: Date()
        )
        Task {
            try? await environment.hazardRepository.reportHazard(hazard)
            await viewModel.load(using: environment.hazardRepository)
        }
    }
}

#Preview {
    MapScreen()
        .environment(AppEnvironment.preview)
        .preferredColorScheme(.dark)
}
