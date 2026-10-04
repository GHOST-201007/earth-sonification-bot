"""
High-Precision Pure Audio Synthesizer for Earth Data Sonification.
Generates harmonic waveforms, frequency sweeps, ADSR envelopes, rhythmic textures, and multi-track mixing.
"""

import math
import wave
import struct
import numpy as np
from pathlib import Path
from typing import Tuple, List, Optional
from config import Config


class AudioSynthesizer:
    """Core DSP synthesizer for generating professional acoustic audio waveforms."""

    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate

    def create_time_array(self, duration: float) -> np.ndarray:
        """Returns time array for given duration."""
        return np.linspace(0, duration, int(self.sample_rate * duration), endpoint=False)

    def generate_adsr_envelope(
        self,
        duration: float,
        attack: float = 0.1,
        decay: float = 0.2,
        sustain_level: float = 0.7,
        release: float = 0.3,
    ) -> np.ndarray:
        """
        Generates an ADSR (Attack, Decay, Sustain, Release) envelope to avoid clicking.
        All times are in seconds.
        """
        total_samples = int(self.sample_rate * duration)
        attack_samples = int(self.sample_rate * attack)
        decay_samples = int(self.sample_rate * decay)
        release_samples = int(self.sample_rate * release)

        # Safety adjustment if parameters exceed total duration
        if attack_samples + decay_samples + release_samples > total_samples:
            scale = total_samples / (attack_samples + decay_samples + release_samples + 1)
            attack_samples = int(attack_samples * scale)
            decay_samples = int(decay_samples * scale)
            release_samples = int(release_samples * scale)

        sustain_samples = max(0, total_samples - (attack_samples + decay_samples + release_samples))

        # Attack ramp: 0.0 -> 1.0
        env_a = np.linspace(0.0, 1.0, attack_samples, endpoint=False) if attack_samples > 0 else np.array([])
        # Decay ramp: 1.0 -> sustain_level
        env_d = np.linspace(1.0, sustain_level, decay_samples, endpoint=False) if decay_samples > 0 else np.array([])
        # Sustain: sustain_level
        env_s = np.full(sustain_samples, sustain_level)
        # Release ramp: sustain_level -> 0.0
        env_r = np.linspace(sustain_level, 0.0, release_samples, endpoint=False) if release_samples > 0 else np.array([])

        env = np.concatenate([env_a, env_d, env_s, env_r])
        if len(env) < total_samples:
            env = np.pad(env, (0, total_samples - len(env)), mode='constant')
        elif len(env) > total_samples:
            env = env[:total_samples]

        return env

    def generate_harmonic_tone(
        self,
        frequency: float,
        duration: float,
        harmonics: List[float] = [1.0, 0.4, 0.2, 0.05],
        detune_hz: float = 0.5,
        attack: float = 0.1,
        release: float = 0.3,
    ) -> np.ndarray:
        """
        Generates rich harmonic audio tone with slight analog detune chorus effect.
        """
        t = self.create_time_array(duration)
        signal = np.zeros_like(t)

        for i, weight in enumerate(harmonics, start=1):
            harmonic_freq = frequency * i
            # Primary harmonic
            signal += weight * np.sin(2 * np.pi * harmonic_freq * t)
            # Subtle detuned stereo/chorus layer
            if detune_hz > 0:
                signal += (weight * 0.3) * np.sin(2 * np.pi * (harmonic_freq + detune_hz) * t)

        envelope = self.generate_adsr_envelope(duration, attack=attack, decay=0.15, sustain_level=0.75, release=release)
        return signal * envelope

    def generate_frequency_sweep(
        self,
        start_freq: float,
        end_freq: float,
        duration: float,
        harmonic_depth: int = 3,
        attack: float = 0.2,
        release: float = 0.4,
    ) -> np.ndarray:
        """
        Generates smooth glissando / frequency sweep (e.g. for rising sea level).
        Computes phase integral: phi(t) = 2*pi * integral(f(t) dt).
        """
        t = self.create_time_array(duration)
        # Linear frequency interpolation: f(t) = start_freq + (end_freq - start_freq) * (t / duration)
        # Phase integral = 2*pi * (start_freq * t + 0.5 * (end_freq - start_freq) * t^2 / duration)
        phase = 2 * np.pi * (start_freq * t + 0.5 * (end_freq - start_freq) * (t ** 2) / duration)
        
        signal = np.sin(phase)
        if harmonic_depth >= 2:
            signal += 0.35 * np.sin(2 * phase)
        if harmonic_depth >= 3:
            signal += 0.15 * np.sin(3 * phase)

        envelope = self.generate_adsr_envelope(duration, attack=attack, decay=0.2, sustain_level=0.8, release=release)
        return signal * envelope

    def generate_rhythmic_arpeggio(
        self,
        notes: List[float],
        bpm: float,
        duration: float,
        pulse_width: float = 0.8,
    ) -> np.ndarray:
        """
        Generates a rhythmic sequence of melodic notes mapped to a given BPM tempo.
        """
        t_total = self.create_time_array(duration)
        signal = np.zeros_like(t_total)
        
        beat_duration = 60.0 / bpm
        note_count = len(notes)
        if note_count == 0:
            return signal

        current_time = 0.0
        note_idx = 0

        while current_time < duration:
            note_freq = notes[note_idx % note_count]
            single_note_dur = min(beat_duration * pulse_width, duration - current_time)
            if single_note_dur <= 0.01:
                break

            tone = self.generate_harmonic_tone(
                frequency=note_freq,
                duration=single_note_dur,
                harmonics=[1.0, 0.5, 0.2],
                attack=0.03,
                release=0.08,
            )

            start_sample = int(current_time * self.sample_rate)
            end_sample = start_sample + len(tone)
            if end_sample <= len(signal):
                signal[start_sample:end_sample] += tone
            else:
                remaining = len(signal) - start_sample
                signal[start_sample:] += tone[:remaining]

            current_time += beat_duration
            note_idx += 1

        return signal

    def generate_airy_ambient_pad(
        self,
        frequencies: List[float],
        duration: float,
        shimmer_freq: float = 2.0,
    ) -> np.ndarray:
        """
        Generates an ambient cloud/atmospheric pad chord with gentle amplitude modulation shimmer.
        """
        t = self.create_time_array(duration)
        signal = np.zeros_like(t)

        for freq in frequencies:
            # Main tone + soft fifth
            tone = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * (freq * 1.5) * t)
            signal += tone

        # Shimmer amplitude modulation (LFO)
        lfo = 0.7 + 0.3 * np.sin(2 * np.pi * shimmer_freq * t)
        signal = signal * lfo

        envelope = self.generate_adsr_envelope(duration, attack=0.4, decay=0.3, sustain_level=0.7, release=0.6)
        return signal * envelope

    def mix_tracks(self, tracks: List[Tuple[np.ndarray, float]]) -> np.ndarray:
        """
        Mixes multiple audio tracks with individual volume gains and soft limiter to prevent clipping.
        tracks: List of (audio_array, gain_factor)
        """
        if not tracks:
            return np.zeros(self.sample_rate * 3)

        max_len = max(len(t[0]) for t in tracks)
        mixed = np.zeros(max_len)

        for track_data, gain in tracks:
            if len(track_data) < max_len:
                padded = np.pad(track_data, (0, max_len - len(track_data)), mode='constant')
                mixed += padded * gain
            else:
                mixed += track_data[:max_len] * gain

        # Master Limiter / Normalization (-1.5 dB headroom)
        peak = np.max(np.abs(mixed))
        if peak > 0:
            target_peak = 0.85
            mixed = (mixed / peak) * target_peak

        return mixed

    def export_wav(self, audio_data: np.ndarray, output_path: Path) -> Path:
        """
        Exports floating point numpy array to 16-bit PCM standard WAV file.
        Compatible with all media players and Telegram Voice/Audio message uploads.
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Peak normalize to avoid distortion
        peak = np.max(np.abs(audio_data))
        if peak > 0:
            normalized = audio_data / max(peak, 1.0) * 0.9
        else:
            normalized = audio_data

        # Convert to 16-bit integer PCM (-32767 to 32767)
        int16_data = np.int16(np.clip(normalized * 32767, -32767, 32767))

        with wave.open(str(output_path), 'wb') as wav_file:
            # 1 channel (mono), 2 bytes per sample (16-bit), sample rate
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(int16_data.tobytes())

        return output_path


# Singleton synthesizer instance
synthesizer = AudioSynthesizer(sample_rate=Config.AUDIO_SAMPLE_RATE)
