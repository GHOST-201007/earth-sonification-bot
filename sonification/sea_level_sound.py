"""
Sea Level Sonification Module.
Maps sea level rate and directional trend into acoustic glissando sweeps and oceanic wave swells.
"""

import math
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple
from sonification.synthesizer import synthesizer
from config import Config


class SeaLevelSonifier:
    """Translates ocean altimetry and sea level change into pitch movement sweeps."""

    def generate_sea_level_audio(
        self,
        rate_mm_year: float,
        cumulative_rise_mm: float = 104.2,
        duration: float = 4.0,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Generates sea level sonification:
        - Rising trend (+rate): Ascending frequency sweep with oceanic wave modulation.
        - Falling trend (-rate): Descending frequency sweep.
        - Cumulative rise: Controls the depth of the sub-bass ocean resonance.
        """
        # Pitch ranges (Hz)
        base_low_freq = 98.0  # G2 (Deep Ocean)
        
        # Calculate pitch sweep end frequency based on rate of rise
        # Normal rise is ~3.9 mm/yr -> sweeps up to ~392 Hz (G4)
        if rate_mm_year >= 0:
            start_freq = base_low_freq
            end_freq = base_low_freq + min(500.0, max(50.0, rate_mm_year * 75.0))
            direction_label = "Ascending Glissando (Rising Tone)"
        else:
            start_freq = base_low_freq + 250.0
            end_freq = base_low_freq
            direction_label = "Descending Glissando (Falling Tone)"

        # 1. Main sweeping tone representing change over time
        sweep_track = synthesizer.generate_frequency_sweep(
            start_freq=start_freq,
            end_freq=end_freq,
            duration=duration,
            harmonic_depth=3,
            attack=0.3,
            release=0.5,
        )

        # 2. Oceanic swell layer: Low-frequency rhythmic amplitude modulation (wave action)
        t = synthesizer.create_time_array(duration)
        swell_freq = 0.5  # 0.5 Hz = 2-second ocean wave cycle
        sub_ocean_tone = np.sin(2 * np.pi * (start_freq * 0.5) * t) * (0.6 + 0.4 * np.sin(2 * np.pi * swell_freq * t))
        sub_envelope = synthesizer.generate_adsr_envelope(duration, attack=0.4, decay=0.3, sustain_level=0.7, release=0.5)
        sub_ocean_tone *= sub_envelope

        # 3. Mix the sweep with the ocean wave drone
        mixed = synthesizer.mix_tracks([
            (sweep_track, 0.70),
            (sub_ocean_tone, 0.40),
        ])

        metadata = {
            "rate_mm_year": rate_mm_year,
            "cumulative_rise_mm": cumulative_rise_mm,
            "start_frequency_hz": round(start_freq, 1),
            "end_frequency_hz": round(end_freq, 1),
            "pitch_direction": direction_label,
            "duration_seconds": duration,
        }

        return mixed, metadata

    def export_sound(
        self,
        rate_mm_year: float = 3.9,
        output_filename: str = "sea_level_sound.wav",
    ) -> Tuple[Path, Dict[str, Any]]:
        """Generates audio and saves to WAV file."""
        audio_data, metadata = self.generate_sea_level_audio(rate_mm_year)
        file_path = Config.AUDIO_OUTPUT_DIR / output_filename
        synthesizer.export_wav(audio_data, file_path)
        return file_path, metadata


# Singleton instance
sea_level_sonifier = SeaLevelSonifier()
