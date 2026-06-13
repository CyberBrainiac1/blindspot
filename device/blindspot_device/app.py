from __future__ import annotations

import time

from .camera import Camera
from .config import DeviceConfig
from .feedback import Feedback
from .gps import GpsReader
from .imu import CrashDetector, IMUSample, ImpactDetector
from .store import LocalStore
from .sync import SyncClient


class DeviceApp:
    def __init__(
        self,
        config: DeviceConfig,
        camera: Camera,
        gps: GpsReader,
        feedback: Feedback,
        store: LocalStore,
        sync: SyncClient,
    ) -> None:
        self.config = config
        self.camera = camera
        self.gps = gps
        self.feedback = feedback
        self.store = store
        self.sync = sync
        self.impact_detector = ImpactDetector(config.impact_threshold_g)
        self.crash_detector = CrashDetector(
            threshold_g=config.crash_threshold_g,
            orientation_delta_deg=config.crash_orientation_delta_deg,
            stillness_g=config.crash_stillness_g,
            stillness_seconds=config.crash_stillness_seconds,
        )

    def run_mock_ride(self, duration_s: float = 10.0) -> str:
        ride_id = self.store.start_ride(self.config.device_id)
        start = time.monotonic()
        tick = 0
        while time.monotonic() - start < duration_s:
            fix = self.gps.read_fix()
            self.store.add_ride_point(ride_id, fix)

            sample = self._mock_imu_sample(time.monotonic() - start, tick)
            if self.impact_detector.observe(sample):
                self.capture_event(ride_id, "impact", sample)
            if self.crash_detector.observe(sample):
                self.feedback.crash_countdown()
                self.capture_event(ride_id, "crash", sample)

            tick += 1
            time.sleep(1)

        self.store.end_ride(ride_id)
        if self.sync.sync_pending(self.store):
            self.feedback.synced()
        return ride_id

    def capture_event(self, ride_id: str, event_type: str, sample: IMUSample | None = None) -> None:
        fix = self.gps.read_fix()
        photo_path = self.camera.capture(self.config.photos_dir, prefix=event_type)
        self.store.add_event(
            ride_id=ride_id,
            event_type=event_type,
            fix=fix,
            imu_magnitude=sample.magnitude_g if sample else None,
            photo_path=photo_path,
        )
        self.feedback.flag_saved()

    @staticmethod
    def _mock_imu_sample(elapsed_s: float, tick: int) -> IMUSample:
        if tick == 3:
            return IMUSample(elapsed_s, 0.2, 0.3, 2.7, 2, 3)
        return IMUSample(elapsed_s, 0.01, 0.02, 1.0, 2, 3)
