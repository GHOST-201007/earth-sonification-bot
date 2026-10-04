"""
Data aggregator service that compiles Temperature, Sea Level, and Cloud Cover into a unified Earth telemetry view.
"""

import asyncio
import logging
from typing import Dict, Any
from data.temperature import temperature_fetcher
from data.sea_level import sea_level_fetcher
from data.clouds import cloud_fetcher

logger = logging.getLogger(__name__)


class EarthDataAggregator:
    """Aggregates all Earth datasets in parallel."""

    @staticmethod
    async def get_all_data(lat: float, lon: float, location_name: str, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Gathers temperature, sea level, and cloud cover concurrently.
        """
        temp_task = temperature_fetcher.get_data(lat, lon, location_name, force_refresh)
        sea_task = sea_level_fetcher.get_data(lat, lon, location_name, force_refresh)
        cloud_task = cloud_fetcher.get_data(lat, lon, location_name, force_refresh)

        temp_data, sea_data, cloud_data = await asyncio.gather(
            temp_task, sea_task, cloud_task, return_exceptions=False
        )

        return {
            "location_name": location_name,
            "latitude": lat,
            "longitude": lon,
            "temperature": temp_data,
            "sea_level": sea_data,
            "clouds": cloud_data,
        }


# Singleton instance
data_aggregator = EarthDataAggregator()
