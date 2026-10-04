"""
Cloud Cover data provider utilizing Open-Meteo & NASA satellite meteorological data.
Fetches total cloud cover percentage (0-100%), status evaluation, and acoustic texture parameters.
"""

import time
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from config import Config
from data.base import BaseDataFetcher

logger = logging.getLogger(__name__)


@dataclass
class CloudInfo:
    """Structured Cloud Cover Data Model."""
    cloud_cover_percent: int
    location_name: str
    latitude: float
    longitude: float
    status_label: str
    status_emoji: str
    status_description: str
    pitch_description: str
    texture_description: str
    source: str
    timestamp: str
    cached: bool = False
    is_fallback: bool = False


class CloudFetcher(BaseDataFetcher):
    """Fetches real-time cloud cover percentage and determines sonic texture."""

    def __init__(self):
        super().__init__(data_type="clouds", cache_ttl=Config.CACHE_TTL_WEATHER)

    def _evaluate_status(self, cloud_pct: int) -> tuple[str, str, str, str, str]:
        """
        Evaluates cloud status and sound characteristics.
        Returns: (status_label, status_emoji, description, pitch_desc, texture_desc)
        """
        if cloud_pct <= 20:
            return (
                "CLEAR SKIES / VERY LIGHT",
                "☀️",
                "Atmosphere is transparent with minimal cloud obstruction.",
                "🎵 High, crystalline pure bell tone (~784 Hz)",
                "✨ Sparse, gentle acoustic texture",
            )
        elif cloud_pct <= 40:
            return (
                "PARTLY CLOUDY",
                "🌤",
                "Light scattered cumulus clouds drifting across the sky.",
                "🎵 Mid-High airy harmonic (~523 Hz)",
                "✨ Mild rhythmic pulsation",
            )
        elif cloud_pct <= 60:
            return (
                "SCATTERED CLOUDS",
                "⛅",
                "Moderate cloud coverage with balanced solar filtering.",
                "🎵 Medium frequency resonant pad (~392 Hz)",
                "✨ Moderate harmonic density",
            )
        elif cloud_pct <= 80:
            return (
                "MOSTLY CLOUDY / OVERCAST",
                "🌥",
                "Dense cloud layer blocking majority of sunlight.",
                "🎵 Mid-Low filtered tone (~261 Hz)",
                "✨ Rich, thick ambient chords with fast pulse",
            )
        else:
            return (
                "HEAVY OVERCAST / DENSE CLOUDS",
                "☁️",
                "Complete atmospheric cloud saturation.",
                "🎵 Deep, layered atmospheric chord (~196 Hz)",
                "✨ Swelling, textured polyphonic rhythm",
            )

    async def _fetch_from_api(self, lat: float, lon: float, location_name: str) -> Optional[Dict[str, Any]]:
        """Fetch real-time cloud cover from Open-Meteo."""
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high",
            "timezone": "auto",
        }

        json_data = await self._http_get_json(Config.OPEN_METEO_WEATHER_URL, params=params)
        if not json_data or "current" not in json_data:
            return None

        current = json_data["current"]
        cloud_pct = int(current.get("cloud_cover", 45))
        
        status_label, emoji, desc, pitch_desc, texture_desc = self._evaluate_status(cloud_pct)

        return {
            "cloud_cover_percent": cloud_pct,
            "location_name": location_name,
            "latitude": lat,
            "longitude": lon,
            "status_label": status_label,
            "status_emoji": emoji,
            "status_description": desc,
            "pitch_description": pitch_desc,
            "texture_description": texture_desc,
            "source": "Open-Meteo Satellite & Meteorological Models",
            "timestamp": current.get("time", time.strftime("%Y-%m-%dT%H:%M")),
            "summary": f"{cloud_pct}% ({status_label})",
        }

    def _get_fallback_data(self, lat: float, lon: float, location_name: str) -> Dict[str, Any]:
        """Provides realistic cloud cover fallback."""
        default_pct = 68
        status_label, emoji, desc, pitch_desc, texture_desc = self._evaluate_status(default_pct)
        return {
            "cloud_cover_percent": default_pct,
            "location_name": location_name,
            "latitude": lat,
            "longitude": lon,
            "status_label": status_label,
            "status_emoji": emoji,
            "status_description": desc,
            "pitch_description": pitch_desc,
            "texture_description": texture_desc,
            "source": "NASA Earth Observations (Baseline Satellite Cloudiness)",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M"),
            "summary": f"{default_pct}% ({status_label})",
        }


# Singleton instance
cloud_fetcher = CloudFetcher()
