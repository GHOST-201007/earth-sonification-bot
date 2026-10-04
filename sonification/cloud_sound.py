"""
Cloud Cover Sonification Module.
Maps atmospheric cloud coverage percentages (0-100%) to harmonic density, chord voicing, and airy shimmer.
"""

import math
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, List
from sonification.synthesizer import synthesizer
from config import Config


class CloudSonifier:
    """Translates satellite cloud coverage into acoustic density and airy pads."""

    def generate_cloud_audio(
        self,
        cloud_pct: int,
        duration: float = 3.5,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Generates cloud sonification:
        - Low cloudiness (0-20%): High, delicate, crystalline pure chime.
        - Medium cloudiness (20-60%): Warm airy ambient chord.
        - High cloudiness (60-100%): Dense, thick, layered harmonic cloud textures with rapid pulse.
        """
        cloud_pct = max(0, min(100, cloud_pct))

        # Root frequencies based on cloud altitude & density
        if cloud_pct <= 20:
            # Clear sky: High delicate bells
            freqs = [784.0, 1174.66, 1567.98]  # G5, D6, G6
            shimmer_rate = 1.0
            rhythm_bpm = 60.0
            sound_char = "Light Crystalline Chime"
        elif cloud_pct <= 40:
            # Partly cloudy: Airy fifths
            freqs = [523.25, 659.25, 783.99]  # C5, E5, G5
            shimmer_rate = 2.0
            rhythm_bpm = 85.0
            sound_char = "Airy Harmonic Chord"
        elif cloud_pct <= 60:
            # Scattered: Mid-frequency resonant pad
            freqs = [392.00, 493.88, 587.33, 783.99]  # G4, B4, D5, G5
            shimmer_rate = 3.0
            rhythm_bpm = 110.0
            sound_char = "Resonant Cloud Pad"
        elif cloud_pct <= 80:
            # Overcast: Dense rich chord
            freqs = [261.63, 329.63, 392.00, 523.25]  # C4, E4, G4, C5
            shimmer_rate = 4.5
            rhythm_bpm = 135.0
            sound_char = "Thick Ambient Cluster"
        else:
            # Heavy overcast: Deep multi-layered atmospheric cluster
            freqs = [196.00, 246.94, 293.66, 392.00, 493.88]  # G3, B3, D4, G4, B4
            shimmer_rate = 6.0
            rhythm_bpm = 155.0
            sound_char = "Heavy Overcast Atmospheric Symphony"

        # 1. Airy Ambient Pad with Shimmer Modulation
        pad = synthesizer.generate_airy_ambient_pad(
            frequencies=freqs,
            duration=duration,
            shimmer_freq=shimmer_rate,
        )

        # 2. Gentle rhythmic arpeggio texture
        arp = synthesizer.generate_rhythmic_arpeggio(
            notes=freqs,
            bpm=rhythm_bpm,
            duration=duration,
            pulse_width=0.6,
        )

        # Mix pad and rhythmic pulses
        mixed = synthesizer.mix_tracks([
            (pad, 0.70),
            (arp, 0.35),
        ])

        metadata = {
            "cloud_cover_percent": cloud_pct,
            "fundamental_freq_hz": freqs[0],
            "harmonics_count": len(freqs),
            "shimmer_rate_hz": shimmer_rate,
            "rhythm_bpm": rhythm_bpm,
            "sound_character": sound_char,
            "duration_seconds": duration,
        }

        return mixed, metadata

    def export_sound(
        self,
        cloud_pct: int = 45,
        output_filename: str = "cloud_sound.wav",
    ) -> Tuple[Path, Dict[str, Any]]:
        """Generates audio and saves to WAV file."""
        audio_data, metadata = self.generate_cloud_audio(cloud_pct)
        file_path = Config.AUDIO_OUTPUT_DIR / output_filename
        synthesizer.export_wav(audio_data, file_path)
        return file_path, metadata


# Singleton instance
cloud_sonifier = CloudSonifier()
