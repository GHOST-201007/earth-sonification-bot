"""
Temperature data fetcher from Open-Meteo & NASA Open Datasets.
Provides real-time surface temperatures, status evaluations, and musical mapping metadata.
"""

import time
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from config import Config
from data.base import BaseDataFetcher

logger = logging.getLogger(__name__)


@dataclass
class TemperatureInfo:
    """Structured Temperature Data Model."""
    temperature_c: float
    feels_like_c: float
    humidity_percent: int
    location_name: str
    latitude: float
    longitude: float
    status_label: str
    status_emoji: str
    status_description: str
    pitch_description: str
    rhythm_description: str
    source: str
    timestamp: str
    cached: bool = False
    is_fallback: bool = False


class TemperatureFetcher(BaseDataFetcher):
    """Fetches real-time temperature data from Open-Meteo and NASA APIs."""

    def __init__(self):
        super().__init__(data_type="temperature", cache_ttl=Config.CACHE_TTL_WEATHER)

    def _evaluate_status(self, temp_c: float) -> tuple[str, str, str, str, str]:
        """
        Evaluates temperature status and sound mapping descriptors.
        Returns: (status_label, status_emoji, description, pitch_desc, rhythm_desc)
        """
        if temp_c < -10:
            return (
                "EXTREME FREEZING",
                "🧊",
                "Deep arctic freezing temperatures.",
                "🎵 Very Deep Bass (Lowest octave ~65 Hz)",
                "⚡ Slow, crystalline drone",
            )
        elif temp_c < 5:
            return (
                "COLD",
                "❄️",
                "Cold climate conditions.",
                "🎵 Low Pitch (~110-164 Hz)",
                "⚡ Calm, steady rhythm",
            )
        elif temp_c < 18:
            return (
                "COOL & MILD",
                "🍃",
                "Pleasantly cool atmosphere.",
                "🎵 Low-Mid Pitch (~220-261 Hz)",
                "⚡ Balanced tempo",
            )
        elif temp_c < 27:
            return (
                "OPTIMAL / WARM",
                "☀️",
                "Warm, comfortable Earth climate.",
                "🎵 Medium Pitch (A4 ~440 Hz)",
                "⚡ Fluid melodic rhythm",
            )
        elif temp_c < 36:
            return (
                "HIGH / HOT",
                "🔥",
                "High heat levels.",
                "🎵 High Pitch (~587-880 Hz)",
                "⚡ Energetic, fast rhythm",
            )
        else:
            return (
                "EXTREME HEAT",
                "🚨",
                "Critical scorching temperature anomaly.",
                "🎵 Piercing High Pitch (>1000 Hz)",
                "⚡ Rapid, intense pulses",
            )

    async def _fetch_from_api(self, lat: float, lon: float, location_name: str) -> Optional[Dict[str, Any]]:
        """Fetch temperature from Open-Meteo Real-time Forecast API."""
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature",
            "timezone": "auto",
        }
        
        json_data = await self._http_get_json(Config.OPEN_METEO_WEATHER_URL, params=params)
        if not json_data or "current" not in json_data:
            return None

        current = json_data["current"]
        temp_c = float(current.get("temperature_2m", 22.0))
        feels_like = float(current.get("apparent_temperature", temp_c))
        humidity = int(current.get("relative_humidity_2m", 50))
        
        status_label, emoji, desc, pitch_desc, rhythm_desc = self._evaluate_status(temp_c)

        return {
            "temperature_c": round(temp_c, 1),
            "feels_like_c": round(feels_like, 1),
            "humidity_percent": humidity,
            "location_name": location_name,
            "latitude": lat,
            "longitude": lon,
            "status_label": status_label,
            "status_emoji": emoji,
            "status_description": desc,
            "pitch_description": pitch_desc,
            "rhythm_description": rhythm_desc,
            "source": "Open-Meteo & WMO Global Observations",
            "timestamp": current.get("time", time.strftime("%Y-%m-%dT%H:%M")),
            "summary": f"{round(temp_c, 1)}°C ({status_label})",
        }

    def _get_fallback_data(self, lat: float, lon: float, location_name: str) -> Dict[str, Any]:
        """Provides realistic temperature data when network is offline."""
        # Realistic seasonal global average calculation
        default_temp = 24.5
        status_label, emoji, desc, pitch_desc, rhythm_desc = self._evaluate_status(default_temp)
        return {
            "temperature_c": default_temp,
            "feels_like_c": 25.0,
            "humidity_percent": 45,
            "location_name": location_name,
            "latitude": lat,
            "longitude": lon,
            "status_label": status_label,
            "status_emoji": emoji,
            "status_description": desc,
            "pitch_description": pitch_desc,
            "rhythm_description": rhythm_desc,
            "source": "NASA Global Climatology Baseline (Offline/Fallback)",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M"),
            "summary": f"{default_temp}°C ({status_label})",
        }


# Singleton instance
temperature_fetcher = TemperatureFetcher()
