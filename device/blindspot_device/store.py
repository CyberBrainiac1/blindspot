from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
import sqlite3
from uuid import uuid4

from .gps import GpsFix


@dataclass(frozen=True)
class EventRecord:
    id: str
    ride_id: str
    type: str
    lat: float
    lng: float
    occurred_at: str
    imu_magnitude: float | None = None
    photo_path: str | None = None


class LocalStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(self.db_path)
        self._conn.row_factory = sqlite3.Row
        self._migrate()

    def _migrate(self) -> None:
        self._conn.executescript(
            """
            create table if not exists rides (
              id text primary key,
              device_id text not null,
              started_at text not null,
              ended_at text
            );
            create table if not exists ride_points (
              id text primary key,
              ride_id text not null,
              lat real not null,
              lng real not null,
              speed_mps real,
              elevation_m real,
              recorded_at text not null
            );
            create table if not exists events (
              id text primary key,
              ride_id text not null,
              type text not null,
              lat real not null,
              lng real not null,
              imu_magnitude real,
              photo_path text,
              occurred_at text not null
            );
            create table if not exists sync_queue (
              id text primary key,
              kind text not null,
              payload_json text not null,
              created_at text not null,
              synced_at text
            );
            """
        )
        self._conn.commit()

    def start_ride(self, device_id: str) -> str:
        ride_id = uuid4().hex
        self._conn.execute(
            "insert into rides (id, device_id, started_at) values (?, ?, ?)",
            (ride_id, device_id, datetime.now(timezone.utc).isoformat()),
        )
        self._queue("ride_started", {"ride_id": ride_id, "device_id": device_id})
        self._conn.commit()
        return ride_id

    def end_ride(self, ride_id: str) -> None:
        ended_at = datetime.now(timezone.utc).isoformat()
        self._conn.execute("update rides set ended_at = ? where id = ?", (ended_at, ride_id))
        self._queue("ride_ended", {"ride_id": ride_id, "ended_at": ended_at})
        self._conn.commit()

    def add_ride_point(self, ride_id: str, fix: GpsFix) -> str:
        point_id = uuid4().hex
        self._conn.execute(
            """
            insert into ride_points
              (id, ride_id, lat, lng, speed_mps, elevation_m, recorded_at)
            values (?, ?, ?, ?, ?, ?, ?)
            """,
            (point_id, ride_id, fix.lat, fix.lng, fix.speed_mps, fix.elevation_m, fix.recorded_at),
        )
        self._queue("ride_point", {"ride_id": ride_id, **asdict(fix)})
        self._conn.commit()
        return point_id

    def add_event(
        self,
        ride_id: str,
        event_type: str,
        fix: GpsFix,
        imu_magnitude: float | None = None,
        photo_path: Path | None = None,
    ) -> EventRecord:
        event = EventRecord(
            id=uuid4().hex,
            ride_id=ride_id,
            type=event_type,
            lat=fix.lat,
            lng=fix.lng,
            occurred_at=datetime.now(timezone.utc).isoformat(),
            imu_magnitude=imu_magnitude,
            photo_path=str(photo_path) if photo_path else None,
        )
        self._conn.execute(
            """
            insert into events
              (id, ride_id, type, lat, lng, imu_magnitude, photo_path, occurred_at)
            values (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event.id,
                event.ride_id,
                event.type,
                event.lat,
                event.lng,
                event.imu_magnitude,
                event.photo_path,
                event.occurred_at,
            ),
        )
        self._queue("event", asdict(event))
        self._conn.commit()
        return event

    def pending_sync_items(self) -> list[sqlite3.Row]:
        return list(
            self._conn.execute(
                "select id, kind, payload_json from sync_queue where synced_at is null order by created_at"
            )
        )

    def mark_synced(self, queue_id: str) -> None:
        self._conn.execute(
            "update sync_queue set synced_at = ? where id = ?",
            (datetime.now(timezone.utc).isoformat(), queue_id),
        )
        self._conn.commit()

    def _queue(self, kind: str, payload: dict) -> None:
        self._conn.execute(
            "insert into sync_queue (id, kind, payload_json, created_at) values (?, ?, ?, ?)",
            (uuid4().hex, kind, json.dumps(payload), datetime.now(timezone.utc).isoformat()),
        )
