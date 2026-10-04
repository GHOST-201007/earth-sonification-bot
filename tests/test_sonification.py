"""
Unit and Integration tests for the Sonification Engine.
"""

import os
import wave
import pytest
import numpy as np
from pathlib import Path
from sonification.synthesizer import AudioSynthesizer, synthesizer
from sonification.temperature_sound import temperature_sonifier
from sonification.sea_level_sound import sea_level_sonifier
from sonification.cloud_sound import cloud_sonifier
from sonification.earth_sound import earth_sound_composer
from sonification.engine import sonification_engine


def test_synthesizer_adsr_envelope():
    """Verify ADSR envelope generation produces smooth non-clicking curves."""
    synth = AudioSynthesizer(sample_rate=44100)
    duration = 2.0
    envelope = synth.generate_adsr_envelope(duration, attack=0.1, decay=0.2, sustain_level=0.7, release=0.3)
    
    assert len(envelope) == int(44100 * duration)
    assert envelope[0] == pytest.approx(0.0, abs=0.01)  # Starts at 0
    assert np.max(envelope) <= 1.0  # Normalized peak
    assert envelope[-1] == pytest.approx(0.0, abs=0.01)  # Ends at 0


def test_synthesizer_harmonic_tone():
    """Verify harmonic tone generation has correct length and no NaN/Inf."""
    synth = AudioSynthesizer(sample_rate=44100)
    tone = synth.generate_harmonic_tone(440.0, duration=1.0)
    
    assert len(tone) == 44100
    assert not np.isnan(tone).any()
    assert not np.isinf(tone).any()
    assert np.max(np.abs(tone)) > 0.1


def test_synthesizer_frequency_sweep():
    """Verify frequency sweep (glissando) generation."""
    synth = AudioSynthesizer(sample_rate=44100)
    sweep = synth.generate_frequency_sweep(start_freq=110.0, end_freq=440.0, duration=1.5)
    
    assert len(sweep) == int(44100 * 1.5)
    assert not np.isnan(sweep).any()


def test_temperature_sonifier_pitch_mapping():
    """Test temperature to pitch mapping produces increasing frequency for increasing temperature."""
    f_cold = temperature_sonifier.temp_to_frequency(-10.0)
    f_mild = temperature_sonifier.temp_to_frequency(15.0)
    f_hot = temperature_sonifier.temp_to_frequency(35.0)
    f_extreme = temperature_sonifier.temp_to_frequency(45.0)

    assert f_cold < f_mild < f_hot < f_extreme
    assert f_cold >= 50.0
    assert f_extreme <= 1200.0


def test_temperature_audio_export(tmp_path):
    """Test temperature audio file export produces a valid 16-bit PCM WAV."""
    audio_file, meta = temperature_sonifier.export_sound(28.5, output_filename="test_temp.wav")
    
    assert audio_file.exists()
    assert audio_file.stat().st_size > 1000

    # Verify WAV header
    with wave.open(str(audio_file), 'rb') as wf:
        assert wf.getnchannels() == 1
        assert wf.getsampwidth() == 2  # 16-bit
        assert wf.getframerate() == 44100
        assert wf.getnframes() > 0


def test_sea_level_audio_export(tmp_path):
    """Test sea level glissando audio export."""
    audio_file, meta = sea_level_sonifier.export_sound(rate_mm_year=3.9, output_filename="test_sea.wav")
    
    assert audio_file.exists()
    assert meta["rate_mm_year"] == 3.9
    assert meta["end_frequency_hz"] > meta["start_frequency_hz"]

    with wave.open(str(audio_file), 'rb') as wf:
        assert wf.getframerate() == 44100
        assert wf.getnframes() > 0


def test_cloud_audio_export(tmp_path):
    """Test cloud cover ambient pad export."""
    audio_file, meta = cloud_sonifier.export_sound(cloud_pct=75, output_filename="test_clouds.wav")
    
    assert audio_file.exists()
    assert meta["cloud_cover_percent"] == 75
    assert meta["harmonics_count"] >= 3

    with wave.open(str(audio_file), 'rb') as wf:
        assert wf.getframerate() == 44100
        assert wf.getnframes() > 0


def test_earth_composite_symphony(tmp_path):
    """Test composite 3-layer Earth Symphony synthesis."""
    audio_file, meta = earth_sound_composer.export_sound(
        temp_c=25.0,
        sea_level_rate=3.9,
        cloud_pct=60,
        output_filename="test_earth_symphony.wav",
    )
    
    assert audio_file.exists()
    assert "layers" in meta
    assert "temperature" in meta["layers"]
    assert "sea_level" in meta["layers"]
    assert "clouds" in meta["layers"]

    with wave.open(str(audio_file), 'rb') as wf:
        assert wf.getframerate() == 44100
        assert wf.getnframes() == int(44100 * 4.5)
