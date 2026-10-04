/**
 * Earth Jukebox — Solar Synth Lab Module
 * Handles the experimental sound design studio with dual modes:
 *  - LIVE PHYSICS MODE (Audio dynamically mapped from physical heliophysics data)
 *  - MANUAL SYNTH MODE (Direct acoustic parameter sculpting: cutoff, resonance, distortion, sub-bass)
 */

class SolarSynthLab {
  constructor(audioEngine, telemetryEngine) {
    this.audio = audioEngine;
    this.telemetry = telemetryEngine;
    this.mode = 'physics'; // 'physics' or 'manual'

    // Manual synth overrides
    this.manualParams = {
      pitchOffset: 0,     // semitones (-24 to +24)
      filterCutoff: 1200, // Hz
      resonance: 4.5,     // Q
      distortion: 0.1,    // 0 to 1
      subBassGain: 0.35,  // 0 to 1
      auroraRate: 450,    // ms
      chorusDepth: 0.3,   // 0 to 1
      reverbMix: 0.45     // 0 to 1
    };

    this.initDOM();
  }

  initDOM() {
    this.modeTogglePhysics = document.getElementById('synth-mode-physics');
    this.modeToggleManual = document.getElementById('synth-mode-manual');
    this.btnResetLive = document.getElementById('btn-synth-reset-live');

    // Controls
    this.sliderFilterCutoff = document.getElementById('synth-slider-cutoff');
    this.sliderResonance = document.getElementById('synth-slider-q');
    this.sliderDistortion = document.getElementById('synth-slider-distortion');
    this.sliderSubBass = document.getElementById('synth-slider-sub');
    this.sliderAuroraRate = document.getElementById('synth-slider-aurora');

    this.valCutoff = document.getElementById('synth-val-cutoff');
    this.valResonance = document.getElementById('synth-val-q');
    this.valDistortion = document.getElementById('synth-val-distortion');
    this.valSubBass = document.getElementById('synth-val-sub');
    this.valAuroraRate = document.getElementById('synth-val-aurora');

    this.attachEvents();
  }

  attachEvents() {
    if (this.modeTogglePhysics && this.modeToggleManual) {
      this.modeTogglePhysics.addEventListener('click', () => this.setMode('physics'));
      this.modeToggleManual.addEventListener('click', () => this.setMode('manual'));
    }

    if (this.btnResetLive) {
      this.btnResetLive.addEventListener('click', () => this.resetToLiveData());
    }

    // Manual Sliders
    if (this.sliderFilterCutoff) {
      this.sliderFilterCutoff.addEventListener('input', (e) => {
        this.manualParams.filterCutoff = parseFloat(e.target.value);
        if (this.valCutoff) this.valCutoff.textContent = `${Math.round(this.manualParams.filterCutoff)} Hz`;
        this.applyManualAcoustics();
      });
    }

    if (this.sliderResonance) {
      this.sliderResonance.addEventListener('input', (e) => {
        this.manualParams.resonance = parseFloat(e.target.value);
        if (this.valResonance) this.valResonance.textContent = `Q ${this.manualParams.resonance.toFixed(1)}`;
        this.applyManualAcoustics();
      });
    }

    if (this.sliderDistortion) {
      this.sliderDistortion.addEventListener('input', (e) => {
        this.manualParams.distortion = parseFloat(e.target.value);
        if (this.valDistortion) this.valDistortion.textContent = `${Math.round(this.manualParams.distortion * 100)}%`;
        this.applyManualAcoustics();
      });
    }

    if (this.sliderSubBass) {
      this.sliderSubBass.addEventListener('input', (e) => {
        this.manualParams.subBassGain = parseFloat(e.target.value);
        if (this.valSubBass) this.valSubBass.textContent = `${Math.round(this.manualParams.subBassGain * 100)}%`;
        this.applyManualAcoustics();
      });
    }

    if (this.sliderAuroraRate) {
      this.sliderAuroraRate.addEventListener('input', (e) => {
        this.manualParams.auroraRate = parseFloat(e.target.value);
        if (this.valAuroraRate) this.valAuroraRate.textContent = `${Math.round(this.manualParams.auroraRate)} ms`;
        this.applyManualAcoustics();
      });
    }
  }

  setMode(mode) {
    this.mode = mode;
    const isPhysics = mode === 'physics';

    if (this.modeTogglePhysics && this.modeToggleManual) {
      this.modeTogglePhysics.classList.toggle('active', isPhysics);
      this.modeToggleManual.classList.toggle('active', !isPhysics);
    }

    const manualControlsGroup = document.getElementById('synth-manual-controls-group');
    if (manualControlsGroup) {
      manualControlsGroup.classList.toggle('disabled-controls', isPhysics);
    }

    if (isPhysics) {
      this.audio.synthLabManualMode = false;
      this.audio.updateAcoustics();
    } else {
      this.audio.synthLabManualMode = true;
      this.applyManualAcoustics();
    }
  }

  applyManualAcoustics() {
    if (this.mode !== 'manual' || !this.audio || !this.audio.ctx) return;
    const t = this.audio.ctx.currentTime;

    // Direct filter cutoff override
    if (this.audio.tempFilter) {
      this.audio.tempFilter.frequency.cancelScheduledValues(t);
      this.audio.tempFilter.frequency.exponentialRampToValueAtTime(
        Math.max(50, this.manualParams.filterCutoff), t + 0.1
      );
      this.audio.tempFilter.Q.cancelScheduledValues(t);
      this.audio.tempFilter.Q.linearRampToValueAtTime(this.manualParams.resonance, t + 0.1);
    }

    // Sub-bass override
    if (this.audio.subGain) {
      this.audio.subGain.gain.cancelScheduledValues(t);
      this.audio.subGain.gain.linearRampToValueAtTime(this.manualParams.subBassGain, t + 0.1);
    }

    // Waveshaper distortion
    if (this.audio.setDistortionAmount) {
      this.audio.setDistortionAmount(this.manualParams.distortion);
    }
  }

  resetToLiveData() {
    this.setMode('physics');
    this.telemetry.fetchLive();
    if (window.showToastNotification) {
      window.showToastNotification("Reset to Live NOAA L1 Telemetry");
    }
  }
}
