"""
Unified Sonification Engine.
Provides a central gateway for all audio generation, caching, and dispatching.
"""

import time
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
from config import Config
from sonification.temperature_sound import temperature_sonifier
from sonification.sea_level_sound import sea_level_sonifier
from sonification.cloud_sound import cloud_sonifier
from sonification.earth_sound import earth_sound_composer
from database.db import db_manager

logger = logging.getLogger(__name__)


class SonificationEngine:
    """Master engine orchestrating all data-to-sound conversions."""

    def __init__(self):
        Config.ensure_directories()

    async def sonify_temperature(self, temp_c: float, user_id: int = 0) -> Tuple[Path, Dict[str, Any]]:
        """Generates temperature sonification audio file."""
        timestamp = int(time.time())
        filename = f"temp_{int(temp_c)}_{timestamp}.wav"
        file_path, metadata = temperature_sonifier.export_sound(temp_c, output_filename=filename)
        
        if user_id:
            await db_manager.log_sonification(user_id, "temperature", metadata, filename)
        return file_path, metadata

    async def sonify_sea_level(self, rate_mm_year: float, user_id: int = 0) -> Tuple[Path, Dict[str, Any]]:
        """Generates sea level sonification audio file."""
        timestamp = int(time.time())
        filename = f"sea_{int(rate_mm_year * 10)}_{timestamp}.wav"
        file_path, metadata = sea_level_sonifier.export_sound(rate_mm_year, output_filename=filename)
        
        if user_id:
            await db_manager.log_sonification(user_id, "sea_level", metadata, filename)
        return file_path, metadata

    async def sonify_clouds(self, cloud_pct: int, user_id: int = 0) -> Tuple[Path, Dict[str, Any]]:
        """Generates cloud cover sonification audio file."""
        timestamp = int(time.time())
        filename = f"clouds_{cloud_pct}_{timestamp}.wav"
        file_path, metadata = cloud_sonifier.export_sound(cloud_pct, output_filename=filename)
        
        if user_id:
            await db_manager.log_sonification(user_id, "clouds", metadata, filename)
        return file_path, metadata

    async def sonify_earth_composite(
        self,
        temp_c: float,
        sea_level_rate: float,
        cloud_pct: int,
        user_id: int = 0,
    ) -> Tuple[Path, Dict[str, Any]]:
        """Generates multi-layer master Earth sonification audio file."""
        timestamp = int(time.time())
        filename = f"earth_symphony_{timestamp}.wav"
        file_path, metadata = earth_sound_composer.export_sound(temp_c, sea_level_rate, cloud_pct, output_filename=filename)
        
        if user_id:
            await db_manager.log_sonification(user_id, "earth_composite", metadata, filename)
        return file_path, metadata


# Singleton engine instance
sonification_engine = SonificationEngine()
