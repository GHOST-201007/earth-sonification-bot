"""
Configuration settings for the Earth Sonification Bot.
Loads settings from environment variables and .env file.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directory
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env or .env.example
if (BASE_DIR / ".env").exists():
    load_dotenv(BASE_DIR / ".env")
elif (BASE_DIR / ".env.example").exists():
    load_dotenv(BASE_DIR / ".env.example")


class Config:
    """Central configuration class for Earth Sonification Bot."""

    # Telegram Bot Token
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "").strip()

    # NASA API Settings
    NASA_API_KEY: str = os.getenv("NASA_API_KEY", "DEMO_KEY").strip()
    NASA_POWER_API_URL: str = "https://power.larc.nasa.gov/api/temporal/hourly/point"
    
    # Open-Meteo Open Data API (Global, real-time, high-speed, no key required)
    OPEN_METEO_WEATHER_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_MARINE_URL: str = "https://marine-api.open-meteo.com/v1/marine"
    OPEN_METEO_GEOCODING_URL: str = "https://geocoding-api.open-meteo.com/v1/search"

    # Sea Level Dataset Sources (NASA Sea Level Change & Copernicus Climate Change Service)
    NASA_SEA_LEVEL_PORTAL: str = "https://sealevel.nasa.gov"
    
    # Telegram Mini App URL (Telegram requires HTTPS)
    WEBAPP_URL: str = os.getenv("WEBAPP_URL", "https://earth-jukebox.vercel.app").strip()

    # Cache TTL (in seconds)
    CACHE_TTL_WEATHER: int = int(os.getenv("CACHE_TTL_WEATHER", "900"))  # 15 mins
    CACHE_TTL_SEA_LEVEL: int = int(os.getenv("CACHE_TTL_SEA_LEVEL", "86400"))  # 24 hours

    # Default Geographic Coordinates
    DEFAULT_LATITUDE: float = float(os.getenv("DEFAULT_LATITUDE", "41.2995"))
    DEFAULT_LONGITUDE: float = float(os.getenv("DEFAULT_LONGITUDE", "69.2401"))
    DEFAULT_LOCATION_NAME: str = os.getenv("DEFAULT_LOCATION_NAME", "Tashkent, Uzbekistan")

    # Database Path
    DATABASE_PATH: Path = BASE_DIR / os.getenv("DATABASE_PATH", "earth_sonification.db")

    # Audio Synthesis Settings
    AUDIO_SAMPLE_RATE: int = int(os.getenv("AUDIO_SAMPLE_RATE", "44100"))
    AUDIO_OUTPUT_DIR: Path = BASE_DIR / os.getenv("AUDIO_OUTPUT_DIR", "generated_audio")

    # Preset Locations for Fast Selection
    PRESET_LOCATIONS = {
        "global": {"name": "🌍 Global Earth Average", "lat": 0.0, "lon": 0.0},
        "uzbekistan": {"name": "🇺🇿 Tashkent, Uzbekistan", "lat": 41.2995, "lon": 69.2401},
        "equator": {"name": "☀️ Galapagos (Equator)", "lat": -0.9538, "lon": -90.9656},
        "arctic": {"name": "❄️ Svalbard (Arctic)", "lat": 78.2232, "lon": 15.6267},
        "antarctica": {"name": "🧊 Vostok Station (Antarctica)", "lat": -78.4644, "lon": 106.8373},
        "tokyo": {"name": "🇯🇵 Tokyo, Japan", "lat": 35.6762, "lon": 139.6503},
        "newyork": {"name": "🇺🇸 New York, USA", "lat": 40.7128, "lon": -74.0060},
    }

    @classmethod
    def ensure_directories(cls):
        """Ensure runtime directories exist."""
        cls.AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        cls.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)


# Initialize runtime directories
Config.ensure_directories()
