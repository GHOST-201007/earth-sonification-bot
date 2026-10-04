"""
Database models and dataclasses for Earth Sonification Bot.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any


@dataclass
class CachedDataRecord:
    """Represents a cached dataset in SQLite."""
    id: Optional[int]
    data_type: str  # 'temperature', 'sea_level', 'clouds', 'all_data'
    location_key: str  # e.g. "41.30,69.24" or "global"
    raw_json: str
    value_summary: str
    created_at: float  # Unix timestamp
    expires_at: float  # Unix timestamp


@dataclass
class UserSettingsRecord:
    """Represents user configuration and preferences."""
    user_id: int
    username: Optional[str]
    first_name: Optional[str]
    language: str  # 'uz', 'ru', 'en'
    sound_mode: str  # 'scientific', 'musical', 'atmospheric', 'experimental'
    latitude: float
    longitude: float
    location_name: str
    scale_type: str  # 'pentatonic', 'chromatic', 'harmonic'
    created_at: str
    updated_at: str


@dataclass
class SonificationLogRecord:
    """Log entry for generated sonifications."""
    id: Optional[int]
    user_id: int
    sound_type: str  # 'temperature', 'sea_level', 'clouds', 'earth_composite'
    parameters_json: str
    audio_filename: str
    generated_at: str
