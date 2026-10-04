"""
Composite Earth Sonification Module (Master Earth Symphony).
Synthesizes Temperature (Melody/Core), Sea Level (Ocean Bass & Glissando), and Clouds (Atmospheric Pad) into a unified acoustic portrait of Planet Earth.
"""

import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple
from sonification.synthesizer import synthesizer
from sonification.temperature_sound import temperature_sonifier
from sonification.sea_level_sound import sea_level_sonifier
from sonification.cloud_sound import cloud_sonifier
from config import Config


class EarthSoundComposer:
    """Combines multi-modal planetary datasets into a harmonious master soundscape."""

    def compose_earth_symphony(
        self,
        temp_c: float,
        sea_level_rate: float,
        cloud_pct: int,
        duration: float = 4.5,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Synthesizes a 3-track composite Earth Symphony:
        - Layer 1 (Ocean/Foundation): Sea Level bass glissando & swell
        - Layer 2 (Core/Thermal): Temperature harmonic melodic lead
        - Layer 3 (Atmosphere/Air): Cloud cover airy pad & pulse texture
        """
        # 1. Generate individual sonic layers
        temp_audio, temp_meta = temperature_sonifier.generate_temperature_audio(temp_c, duration=duration)
        sea_audio, sea_meta = sea_level_sonifier.generate_sea_level_audio(sea_level_rate, duration=duration)
        cloud_audio, cloud_meta = cloud_sonifier.generate_cloud_audio(cloud_pct, duration=duration)

        # 2. Master Multitrack Mix with Balanced Gains
        # Track 1 (Thermal): 0.55 gain
        # Track 2 (Ocean): 0.50 gain
        # Track 3 (Atmosphere): 0.45 gain
        master_mix = synthesizer.mix_tracks([
            (temp_audio, 0.55),
            (sea_audio, 0.50),
            (cloud_audio, 0.45),
        ])

        metadata = {
            "title": "🌍 Complete Earth Sonification Symphony",
            "duration_seconds": duration,
            "layers": {
                "temperature": {
                    "value": f"{temp_c}°C",
                    "role": "Melodic Core & Thermal Register",
                    "base_freq": temp_meta["base_frequency_hz"],
                },
                "sea_level": {
                    "value": f"+{sea_level_rate} mm/yr",
                    "role": "Oceanic Sub-Bass & Pitch Trajectory",
                    "direction": sea_meta["pitch_direction"],
                },
                "clouds": {
                    "value": f"{cloud_pct}%",
                    "role": "Atmospheric Airy Pad & Shimmer",
                    "character": cloud_meta["sound_character"],
                },
            },
        }

        return master_mix, metadata

    def export_sound(
        self,
        temp_c: float = 24.5,
        sea_level_rate: float = 3.9,
        cloud_pct: int = 55,
        output_filename: str = "earth_master_sound.wav",
    ) -> Tuple[Path, Dict[str, Any]]:
        """Generates the master symphony audio and saves to WAV."""
        audio_data, metadata = self.compose_earth_symphony(temp_c, sea_level_rate, cloud_pct)
        file_path = Config.AUDIO_OUTPUT_DIR / output_filename
        synthesizer.export_wav(audio_data, file_path)
        return file_path, metadata


# Singleton composer instance
earth_sound_composer = EarthSoundComposer()
