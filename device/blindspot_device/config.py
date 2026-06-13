from dataclasses import dataclass
from pathlib import Path
import os


@dataclass(frozen=True)
class DeviceConfig:
    data_dir: Path = Path(os.getenv("BLINDSPOT_DATA_DIR", "data/device"))
    db_path: Path = Path(os.getenv("BLINDSPOT_DB_PATH", "data/device/blindspot.sqlite3"))
    photos_dir: Path = Path(os.getenv("BLINDSPOT_PHOTOS_DIR", "data/device/photos"))
    videos_dir: Path = Path(os.getenv("BLINDSPOT_VIDEOS_DIR", "data/device/videos"))
    backend_url: str | None = os.getenv("BLINDSPOT_BACKEND_URL")
    api_key: str | None = os.getenv("BLINDSPOT_API_KEY")
    device_id: str = os.getenv("BLINDSPOT_DEVICE_ID", "dev-pi-001")
    impact_threshold_g: float = float(os.getenv("BLINDSPOT_IMPACT_THRESHOLD_G", "2.4"))
    crash_threshold_g: float = float(os.getenv("BLINDSPOT_CRASH_THRESHOLD_G", "3.0"))
    crash_orientation_delta_deg: float = float(
        os.getenv("BLINDSPOT_CRASH_ORIENTATION_DELTA_DEG", "55")
    )
    crash_stillness_g: float = float(os.getenv("BLINDSPOT_CRASH_STILLNESS_G", "0.18"))
    crash_stillness_seconds: float = float(
        os.getenv("BLINDSPOT_CRASH_STILLNESS_SECONDS", "3.0")
    )

    def ensure_dirs(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.photos_dir.mkdir(parents=True, exist_ok=True)
        self.videos_dir.mkdir(parents=True, exist_ok=True)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
