from __future__ import annotations

import argparse

from device.blindspot_device.app import DeviceApp
from device.blindspot_device.camera import MockCamera
from device.blindspot_device.config import DeviceConfig
from device.blindspot_device.feedback import ConsoleFeedback
from device.blindspot_device.gps import MockGpsReader
from device.blindspot_device.store import LocalStore
from device.blindspot_device.sync import SyncClient


def main() -> None:
    parser = argparse.ArgumentParser(description="Create one simulated Blind Spot capture event")
    parser.add_argument(
        "event_type",
        nargs="?",
        default="manual_flag",
        choices=["manual_flag", "impact", "hard_brake", "swerve", "crash"],
    )
    args = parser.parse_args()

    config = DeviceConfig()
    config.ensure_dirs()
    store = LocalStore(config.db_path)
    ride_id = store.start_ride(config.device_id)
    app = DeviceApp(
        config=config,
        camera=MockCamera(),
        gps=MockGpsReader(),
        feedback=ConsoleFeedback(),
        store=store,
        sync=SyncClient(config.backend_url, config.api_key),
    )
    app.capture_event(ride_id, args.event_type)
    store.end_ride(ride_id)
    print(f"created {args.event_type} on ride_id={ride_id}")


if __name__ == "__main__":
    main()
