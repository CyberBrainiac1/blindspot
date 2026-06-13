//
//  HazardBadge.swift
//  Blind Spot
//
//  Renders a hazard consistently everywhere: severity COLOR + SF SYMBOL + TEXT.
//  Severity is never color-only (safety-critical + colorblind-safe), so all
//  three signals are always present.
//
//  Two styles:
//   - `.pin`     — compact circular marker for the map (icon only, colored ring).
//   - `.full`    — color dot + hazard icon + "Type · Severity" text label.
//

import SwiftUI

struct HazardBadge: View {
    let type: HazardType
    let severity: Severity
    var style: Style = .full

    enum Style {
        case pin
        case full
    }

    var body: some View {
        switch style {
        case .pin:  pin
        case .full: full
        }
    }

    // MARK: - Map pin (icon inside a severity-colored disc)

    private var pin: some View {
        ZStack {
            Circle()
                .fill(severity.color)
                .frame(width: 34, height: 34)
                .overlay(Circle().stroke(Color.bsBlack, lineWidth: 2))
                .shadow(radius: 3)
            Image(systemName: type.symbolName)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(Color.bsBlack)   // dark icon on the bright disc
        }
        // VoiceOver: announce the full meaning, not just an icon.
        .accessibilityElement()
        .accessibilityLabel("\(severity.displayName) \(type.displayName)")
    }

    // MARK: - Full inline badge (color + icon + text)

    private var full: some View {
        HStack(spacing: 8) {
            Image(systemName: type.symbolName)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(severity.color)
            Text(type.displayName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.bsWhite)
            Text("· \(severity.displayName)")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(severity.color)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.bsCharcoal)
        .clipShape(Capsule())
        .accessibilityElement()
        .accessibilityLabel("\(severity.displayName) \(type.displayName)")
    }
}

#Preview {
    ZStack {
        Color.bsBlack.ignoresSafeArea()
        VStack(spacing: 20) {
            HStack(spacing: 16) {
                HazardBadge(type: .pothole, severity: .severe, style: .pin)
                HazardBadge(type: .glass, severity: .moderate, style: .pin)
                HazardBadge(type: .debris, severity: .minor, style: .pin)
            }
            HazardBadge(type: .pothole, severity: .severe)
            HazardBadge(type: .water, severity: .moderate)
            HazardBadge(type: .construction, severity: .minor)
        }
        .padding()
    }
    .preferredColorScheme(.dark)
}
