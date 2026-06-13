//
//  Formatters.swift
//  Blind Spot
//
//  Small, shared formatting helpers so telemetry reads consistently everywhere
//  (km, km/h, mm:ss, dates). Kept pure + dependency-free.
//
//  Note: we display metric (km, km/h). Switching to imperial later is a localized
//  concern we can layer on; for the foundation we keep it simple and consistent.
//

import Foundation

enum Format {

    /// Meters → kilometers string, 1 decimal place. e.g. 2540 -> "2.5".
    static func km(_ meters: Double) -> String {
        String(format: "%.1f", meters / 1000)
    }

    /// meters/second → km/h, rounded to a whole number. e.g. 6.1 -> "22".
    static func kmh(_ metersPerSecond: Double) -> String {
        String(format: "%.0f", metersPerSecond * 3.6)
    }

    /// Seconds → "M:SS" or "H:MM:SS". e.g. 642 -> "10:42".
    static func duration(_ seconds: Double) -> String {
        let total = Int(seconds.rounded())
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        if h > 0 {
            return String(format: "%d:%02d:%02d", h, m, s)
        }
        return String(format: "%d:%02d", m, s)
    }

    /// A short, friendly date for ride rows / recaps. e.g. "Jun 11, 2:30 PM".
    static func rideDate(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "MMM d, h:mm a"
        return f.string(from: date)
    }

    /// A coordinate pair, monospace-friendly. e.g. "37.3382, -121.8863".
    static func coord(lat: Double, lng: Double) -> String {
        String(format: "%.4f, %.4f", lat, lng)
    }
}
