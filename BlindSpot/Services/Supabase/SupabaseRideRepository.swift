//
//  SupabaseRideRepository.swift
//  Blind Spot
//
//  `RideRepository` backed by Supabase Postgres. A ride is stored across three
//  tables — `rides` (summary), `ride_points` (GPS polyline), `ride_events`
//  (flags/impacts/crashes) — all owned by the signed-in user (RLS by Firebase
//  UID). Rides persist across sign-out/in because they live server-side.
//
//  Dates are written/read as ISO-8601 strings (see SupabaseDate) so Postgres
//  `timestamptz` columns accept them.
//

import Foundation
import Supabase

final class SupabaseRideRepository: RideRepository {

    private let client: SupabaseClient
    /// Returns the current Firebase UID (the row owner). Provided by the
    /// composition root so this type stays free of Firebase imports.
    private let userId: @Sendable () -> String?

    init(client: SupabaseClient, userId: @escaping @Sendable () -> String?) {
        self.client = client
        self.userId = userId
    }

    // MARK: - Fetch

    func fetchRides() async throws -> [Ride] {
        // RLS limits this to the signed-in user's rows automatically.
        let rows: [RideRow] = try await client
            .from("rides")
            .select()
            .order("started_at", ascending: false)
            .execute()
            .value
        return rows.map { $0.toDomain() }
    }

    func fetchRide(id: UUID) async throws -> (Ride, [RidePoint], [RideEvent])? {
        let rideRows: [RideRow] = try await client
            .from("rides").select().eq("id", value: id.uuidString).limit(1)
            .execute().value
        guard let ride = rideRows.first?.toDomain() else { return nil }

        let pointRows: [PointRow] = try await client
            .from("ride_points").select().eq("ride_id", value: id.uuidString)
            .order("recorded_at", ascending: true)
            .execute().value

        let eventRows: [EventRow] = try await client
            .from("ride_events").select().eq("ride_id", value: id.uuidString)
            .order("occurred_at", ascending: true)
            .execute().value

        return (ride, pointRows.map { $0.toDomain() }, eventRows.map { $0.toDomain() })
    }

    // MARK: - Save / delete

    func saveRide(_ ride: Ride, points: [RidePoint], events: [RideEvent]) async throws {
        let uid = userId() ?? ""

        try await client.from("rides").upsert(RideRow(ride, userId: uid)).execute()

        if !points.isEmpty {
            let rows = points.map { PointRow($0, rideId: ride.id, userId: uid) }
            try await client.from("ride_points").insert(rows).execute()
        }
        if !events.isEmpty {
            let rows = events.map { EventRow($0, rideId: ride.id, userId: uid) }
            try await client.from("ride_events").insert(rows).execute()
        }
    }

    func setRating(rideId: UUID, rating: Int) async throws {
        try await client
            .from("rides")
            .update(["rating": rating])
            .eq("id", value: rideId.uuidString)
            .execute()
    }

    func setFavorite(rideId: UUID, favorite: Bool) async throws {
        try await client
            .from("rides")
            .update(["favorite": favorite])
            .eq("id", value: rideId.uuidString)
            .execute()
    }

    func deleteRide(id: UUID) async throws {
        // points/events are removed automatically via ON DELETE CASCADE.
        try await client.from("rides").delete().eq("id", value: id.uuidString).execute()
    }

    // MARK: - DB rows (snake_case ↔ domain; dates as ISO strings)

    private struct RideRow: Codable {
        let id: UUID
        let user_id: String
        let started_at: String
        let ended_at: String?
        let distance_meters: Double
        let duration_seconds: Double
        let avg_speed: Double
        let safety_score: Int?
        let rating: Int?
        let favorite: Bool?

        init(_ r: Ride, userId: String) {
            id = r.id; user_id = userId
            started_at = SupabaseDate.string(from: r.startedAt)
            ended_at = r.endedAt.map(SupabaseDate.string(from:))
            distance_meters = r.distanceMeters; duration_seconds = r.durationSeconds
            avg_speed = r.avgSpeed; safety_score = r.safetyScore; rating = r.rating
            favorite = r.favorite
        }

        func toDomain() -> Ride {
            Ride(id: id,
                 startedAt: SupabaseDate.date(from: started_at) ?? Date(),
                 endedAt: ended_at.flatMap(SupabaseDate.date(from:)),
                 distanceMeters: distance_meters, durationSeconds: duration_seconds,
                 avgSpeed: avg_speed, safetyScore: safety_score, rating: rating,
                 favorite: favorite ?? false)
        }
    }

    private struct PointRow: Codable {
        let id: UUID
        let ride_id: UUID
        let user_id: String
        let lat: Double
        let lng: Double
        let speed: Double?
        let recorded_at: String

        init(_ p: RidePoint, rideId: UUID, userId: String) {
            id = p.id; ride_id = rideId; user_id = userId
            lat = p.lat; lng = p.lng; speed = p.speed
            recorded_at = SupabaseDate.string(from: p.recordedAt)
        }

        func toDomain() -> RidePoint {
            RidePoint(id: id, lat: lat, lng: lng, speed: speed,
                      recordedAt: SupabaseDate.date(from: recorded_at) ?? Date())
        }
    }

    private struct EventRow: Codable {
        let id: UUID
        let ride_id: UUID
        let user_id: String
        let type: String
        let hazard_type: String?
        let lat: Double
        let lng: Double
        let imu_magnitude: Double?
        let occurred_at: String
        let detected: Bool

        init(_ e: RideEvent, rideId: UUID, userId: String) {
            id = e.id; ride_id = rideId; user_id = userId
            type = e.type.rawValue; hazard_type = e.hazardType?.rawValue
            lat = e.lat; lng = e.lng; imu_magnitude = e.imuMagnitude
            occurred_at = SupabaseDate.string(from: e.occurredAt); detected = e.detected
        }

        func toDomain() -> RideEvent {
            RideEvent(
                id: id,
                type: EventType(rawValue: type) ?? .manualFlag,
                hazardType: hazard_type.flatMap(HazardType.init(rawValue:)),
                lat: lat, lng: lng, imuMagnitude: imu_magnitude,
                occurredAt: SupabaseDate.date(from: occurred_at) ?? Date(),
                detected: detected
            )
        }
    }
}
