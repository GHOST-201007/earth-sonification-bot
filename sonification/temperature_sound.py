"""
Temperature Sonification Module.
Maps Earth temperature values to musical frequencies, octave registers, and harmonic motifs.
"""

import math
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple
from sonification.synthesizer import synthesizer
from config import Config


class TemperatureSonifier:
    """Translates temperature data into musical pitch and melodic motifs."""

    # Reference pitch values (Hz)
    PENTATONIC_FREQUENCIES = [
        65.41,   # C2  (-20°C - Extreme Frost)
        82.41,   # E2
        110.00,  # A2  (-5°C)
        130.81,  # C3  (0°C - Freezing point)
        164.81,  # E3
        220.00,  # A3  (12°C - Cool)
        261.63,  # C4  (18°C - Mild)
        329.63,  # E4  (23°C - Optimal Warmth)
        440.00,  # A4  (28°C - Warm)
        523.25,  # C5  (34°C - Hot)
        659.25,  # E5  (39°C - Very Hot)
        880.00,  # A5  (44°C - Extreme Heat)
        1046.50, # C6  (50°C+ - Scorching)
    ]

    def temp_to_frequency(self, temp_c: float) -> float:
        """
        Maps continuous temperature (-20°C to +50°C) to exponential frequency (Hz).
        Formula: f = 65.41 * (2 ** ((temp_c + 20) / 17.5))
        """
        # Clamp between -25°C and 55°C
        clamped_temp = max(-25.0, min(55.0, temp_c))
        # Continuous exponential pitch curve
        freq = 65.41 * math.pow(2.0, (clamped_temp + 20.0) / 17.5)
        return float(freq)

    def generate_temperature_audio(self, temp_c: float, duration: float = 3.5) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Generates rich harmonic audio representing current temperature.
        Warmer temperature = higher pitch, brighter harmonics, faster vibrato.
        Colder temperature = deep bass drone, warm sub-harmonics, slower movement.
        """
        base_freq = self.temp_to_frequency(temp_c)
        
        # Determine harmonic profile based on warmth
        if temp_c >= 28.0:
            # Hot: Bright harmonic overtones, slight shimmer/vibrato
            harmonics = [1.0, 0.7, 0.5, 0.3, 0.15]
            detune = 1.2
            bpm = 140.0 + min(60.0, (temp_c - 28.0) * 4.0)
        elif temp_c >= 15.0:
            # Moderate/Warm: Balanced golden harmonics
            harmonics = [1.0, 0.5, 0.25, 0.1]
            detune = 0.6
            bpm = 105.0
        else:
            # Cold: Deep, mellow, fundamental-heavy
            harmonics = [1.0, 0.3, 0.08, 0.02]
            detune = 0.2
            bpm = 75.0

        # Primary sustained harmonic tone
        tone = synthesizer.generate_harmonic_tone(
            frequency=base_freq,
            duration=duration,
            harmonics=harmonics,
            detune_hz=detune,
            attack=0.15,
            release=0.4,
        )

        # Melodic motif: Base frequency + major/minor 3rd + 5th note pulses
        # Creates a short musical gesture that makes the sound pleasant and recognizable
        third_ratio = 1.2599 if temp_c >= 18.0 else 1.1892  # Major 3rd vs Minor 3rd
        fifth_ratio = 1.4983  # Perfect 5th
        arpeggio_notes = [base_freq, base_freq * third_ratio, base_freq * fifth_ratio, base_freq * 2.0]

        arp = synthesizer.generate_rhythmic_arpeggio(
            notes=arpeggio_notes,
            bpm=bpm,
            duration=duration,
            pulse_width=0.7,
        )

        # Mix the sustained ambient root with the melodic gesture
        mixed = synthesizer.mix_tracks([
            (tone, 0.65),
            (arp, 0.45),
        ])

        metadata = {
            "temperature_c": temp_c,
            "base_frequency_hz": round(base_freq, 1),
            "bpm": round(bpm, 1),
            "harmonics_count": len(harmonics),
            "scale": "Major Harmonic" if temp_c >= 18.0 else "Minor Ambient",
        }

        return mixed, metadata

    def export_sound(self, temp_c: float, output_filename: str = "temperature_sound.wav") -> Tuple[Path, Dict[str, Any]]:
        """Generates audio and saves to WAV file."""
        audio_data, metadata = self.generate_temperature_audio(temp_c)
        file_path = Config.AUDIO_OUTPUT_DIR / output_filename
        synthesizer.export_wav(audio_data, file_path)
        return file_path, metadata


# Singleton instance
temperature_sonifier = TemperatureSonifier()
