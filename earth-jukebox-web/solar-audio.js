/**
 * Earth Jukebox — Solar Wind Web Audio Sonification Engine
 * 
 * Maps NASA/NOAA heliophysics parameters to acoustic parameters:
 *  - Speed (km/s) -> Pitch / Carrier Fundamental Frequency & Scale quantization
 *  - Density (p/cm³) -> Volume, Sub-bass amplitude, and harmonic saturation
 *  - Temperature (K) -> Timbral brightness / 24dB Resonant Lowpass Filter Cutoff
 *  - IMF Bz (nT) -> Southward (< 0) triggers magnetic reconnection Aurora Arpeggiator
 *  - IMF Bt (nT) -> Spatial Reverb & Stereo Width
 */

class SolarAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.synthLabManualMode = false;

    // Current Physics State
    this.state = {
      speed: 350.7,        // km/s
      density: 2.74,       // p/cm³
      temperature: 46113,  // Kelvin
      bz: -0.84,           // nT (Southward = negative)
      bt: 3.48,            // nT (total magnetic strength)
      scale: 'pentatonic', // musical scale mode
      masterVolume: 0.75,
      reverbLevel: 0.45
    };

    // Frequency & Gain targets
    this.targetPitch = 130.81; // C3
    this.targetGain = 0.5;

    // Musical Scale Definitions (semitone intervals from base C)
    this.scales = {
      pentatonic: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36],
      dorian:     [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19, 21, 22, 24],
      lydian:     [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23, 24],
      drone:      [0, 7, 12, 19, 24, 31, 36],
      continuous: null // pure microtonal frequency mapping
    };

    // Tone Matrix
    this.baseMidi = 36; // C2 = 65.41 Hz base
    this.arpeggioTimer = null;
  }

  /**
   * Initializes Web Audio Context on user gesture
   */
  initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        return this.ctx.resume();
      }
      return Promise.resolve();
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Destination for Recording
    this.recordDest = this.ctx.createMediaStreamDestination();

    // Master Dynamics & Limiter
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.masterCompressor.knee.setValueAtTime(30, this.ctx.currentTime);
    this.masterCompressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.masterCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.state.masterVolume, this.ctx.currentTime);

    // Audio Visualizer Analyser Node
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.85;

    // Routing Master
    this.masterCompressor.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this.masterGain.connect(this.recordDest);

    // Distortion Waveshaper
    this.waveshaper = this.ctx.createWaveShaper();
    this.waveshaper.curve = this.makeDistortionCurve(10);
    this.waveshaper.oversample = '4x';

    // Build Spatial Reverb Bus
    this.setupReverbBus();

    // Build Synthesizer Units
    this.setupSolarCarrierDrone();
    this.setupSolarWindNoise();
    this.setupAuroraBellBus();

    return Promise.resolve();
  }

  makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  setDistortionAmount(amount) {
    if (!this.waveshaper) return;
    this.waveshaper.curve = this.makeDistortionCurve(amount * 80);
  }

  /**
   * Algorithmic Space Reverb Impulse Generator
   */
  setupReverbBus() {
    this.reverbSendGain = this.ctx.createGain();
    this.reverbSendGain.gain.setValueAtTime(this.state.reverbLevel, this.ctx.currentTime);

    const length = this.ctx.sampleRate * 3.5;
    const decay = 2.6;
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const envelope = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = impulse;

    this.reverbSendGain.connect(this.convolver);
    this.convolver.connect(this.masterCompressor);
  }

  /**
   * Carrier Drone: Dual harmonic oscillators for Speed + Sub-bass for Density
   */
  setupSolarCarrierDrone() {
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Resonant Filter driven by Proton Temperature
    this.tempFilter = this.ctx.createBiquadFilter();
    this.tempFilter.type = 'lowpass';
    this.tempFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);
    this.tempFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    // Osc 1: Primary Sine
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sine';
    this.osc1.frequency.setValueAtTime(130.8, this.ctx.currentTime);

    // Osc 2: Warm Detuned Sawtooth (Micro-beating creates solar plasma pulse)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'sawtooth';
    this.osc2.frequency.setValueAtTime(130.8 * 0.998, this.ctx.currentTime);

    this.osc2Gain = this.ctx.createGain();
    this.osc2Gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    this.osc2.connect(this.osc2Gain);

    // Sub-Bass Sine for Density Weight (Fundamental / 2)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'triangle';
    this.subOsc.frequency.setValueAtTime(65.4, this.ctx.currentTime);
    this.subGain = this.ctx.createGain();
    this.subGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    this.subOsc.connect(this.subGain);

    // Connect Carrier Oscillators to Temp Filter
    this.osc1.connect(this.tempFilter);
    this.osc2Gain.connect(this.tempFilter);
    this.subGain.connect(this.tempFilter);

    this.tempFilter.connect(this.waveshaper);
    this.waveshaper.connect(this.droneGain);
    this.droneGain.connect(this.masterCompressor);
    this.droneGain.connect(this.reverbSendGain);

    this.osc1.start();
    this.osc2.start();
    this.subOsc.start();
  }

  /**
   * Procedural Solar Wind Streaming Whoosh (Filtered Pink Noise)
   */
  setupSolarWindNoise() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.noiseFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.noiseNode.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterCompressor);
    this.noiseGain.connect(this.reverbSendGain);

    this.noiseNode.start();
  }

  /**
   * Aurora Bells Bus: triggered during southward magnetic field reconnection (Bz < 0)
   */
  setupAuroraBellBus() {
    this.auroraMasterGain = this.ctx.createGain();
    this.auroraMasterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    this.auroraPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    if (this.auroraPanner) {
      this.auroraMasterGain.connect(this.auroraPanner);
      this.auroraPanner.connect(this.masterCompressor);
      this.auroraPanner.connect(this.reverbSendGain);
    } else {
      this.auroraMasterGain.connect(this.masterCompressor);
      this.auroraMasterGain.connect(this.reverbSendGain);
    }
  }

  /**
   * Triggers an organic celestial aurora chime / bell note
   */
  playAuroraChime(frequency, intensity = 0.5) {
    if (!this.ctx || !this.isPlaying) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(frequency, t);

    if (this.auroraPanner) {
      this.auroraPanner.pan.linearRampToValueAtTime((Math.random() * 1.6) - 0.8, t + 0.1);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 3.5, t);
    filter.Q.setValueAtTime(4.0, t);

    const gainPeak = Math.min(0.35, 0.08 + intensity * 0.25);
    const duration = 1.2 + Math.random() * 1.5;

    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gainPeak, t + 0.04);
    env.gain.exponentialRampToValueAtTime(0.00001, t + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.auroraMasterGain);

    osc.start(t);
    osc.stop(t + duration + 0.1);
  }

  /**
   * Starts or resumes playback
   */
  async play() {
    await this.initContext();
    this.isPlaying = true;
    const t = this.ctx.currentTime;

    this.droneGain.gain.cancelScheduledValues(t);
    this.droneGain.gain.linearRampToValueAtTime(this.targetGain, t + 0.8);

    this.noiseGain.gain.cancelScheduledValues(t);
    this.noiseGain.gain.linearRampToValueAtTime(0.12, t + 1.2);

    this.updateAcoustics();
    this.startAuroraArpeggiator();
  }

  /**
   * Pauses or fades out playback
   */
  pause() {
    if (!this.ctx) return;
    this.isPlaying = false;
    const t = this.ctx.currentTime;

    this.droneGain.gain.cancelScheduledValues(t);
    this.droneGain.gain.linearRampToValueAtTime(0.0001, t + 0.5);

    this.noiseGain.gain.cancelScheduledValues(t);
    this.noiseGain.gain.linearRampToValueAtTime(0.0001, t + 0.5);

    if (this.arpeggioTimer) {
      clearInterval(this.arpeggioTimer);
      this.arpeggioTimer = null;
    }
  }

  /**
   * Updates all acoustic parameters based on current state
   */
  updateAcoustics() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const { speed, density, temperature, bz, scale } = this.state;

    // 1. Calculate Fundamental Pitch from Solar Wind Speed
    const rawFreq = 65.41 * Math.pow(2, (speed - 300) / 350);

    let finalPitch = rawFreq;
    if (scale !== 'continuous' && this.scales[scale]) {
      finalPitch = this.quantizeToScale(rawFreq, this.scales[scale]);
    }
    this.targetPitch = finalPitch;

    this.osc1.frequency.cancelScheduledValues(t);
    this.osc1.frequency.exponentialRampToValueAtTime(Math.max(30, finalPitch), t + 0.2);

    this.osc2.frequency.cancelScheduledValues(t);
    this.osc2.frequency.exponentialRampToValueAtTime(Math.max(30, finalPitch * 1.003), t + 0.2);

    this.subOsc.frequency.cancelScheduledValues(t);
    this.subOsc.frequency.exponentialRampToValueAtTime(Math.max(20, finalPitch * 0.5), t + 0.2);

    // 2. Calculate Volume & Saturation from Proton Density
    const normalizedDensity = Math.min(1.0, Math.log10(density + 1) / 1.7);
    const calculatedGain = 0.2 + normalizedDensity * 0.6;
    this.targetGain = calculatedGain;

    if (this.isPlaying) {
      this.droneGain.gain.cancelScheduledValues(t);
      this.droneGain.gain.linearRampToValueAtTime(calculatedGain, t + 0.15);

      if (!this.synthLabManualMode) {
        this.subGain.gain.cancelScheduledValues(t);
        this.subGain.gain.linearRampToValueAtTime(0.1 + normalizedDensity * 0.35, t + 0.2);
      }

      const noiseLevel = 0.04 + (speed / 1500) * 0.16;
      this.noiseGain.gain.cancelScheduledValues(t);
      this.noiseGain.gain.linearRampToValueAtTime(noiseLevel, t + 0.2);
    }

    // 3. Modulate Resonant Lowpass Filter from Proton Temperature (unless manual mode override)
    if (!this.synthLabManualMode) {
      const filterCutoff = Math.min(14000, 150 + Math.sqrt(Math.max(1000, temperature)) * 14);
      this.tempFilter.frequency.cancelScheduledValues(t);
      this.tempFilter.frequency.exponentialRampToValueAtTime(Math.max(100, filterCutoff), t + 0.25);
    }

    // 4. Noise Bandpass Center Frequency tied to speed
    const noiseCenter = 200 + (speed / 1500) * 1200;
    this.noiseFilter.frequency.cancelScheduledValues(t);
    this.noiseFilter.frequency.exponentialRampToValueAtTime(Math.max(150, noiseCenter), t + 0.25);
  }

  /**
   * Quantizes a continuous Hz value to nearest musical note within a scale
   */
  quantizeToScale(freq, scaleIntervals) {
    const midi = 69 + 12 * (Math.log(freq / 440) / Math.LN2);
    const rootMidi = 36; // C2

    let closestMidi = rootMidi;
    let minDiff = 999;

    scaleIntervals.forEach(interval => {
      const scaleNoteMidi = rootMidi + interval;
      const diff = Math.abs(midi - scaleNoteMidi);
      if (diff < minDiff) {
        minDiff = diff;
        closestMidi = scaleNoteMidi;
      }
    });

    return 440 * Math.pow(2, (closestMidi - 69) / 12);
  }

  /**
   * Periodically triggers Aurora Bells when Bz is Southward (< 0)
   */
  startAuroraArpeggiator() {
    if (this.arpeggioTimer) clearInterval(this.arpeggioTimer);

    this.arpeggioTimer = setInterval(() => {
      if (!this.isPlaying) return;

      const { bz, scale } = this.state;
      if (bz < -0.1) {
        const severity = Math.min(1.0, Math.abs(bz) / 20);
        if (Math.random() < 0.35 + severity * 0.55) {
          const currentScale = this.scales[scale] || this.scales.lydian;
          const randomInterval = currentScale[Math.floor(Math.random() * currentScale.length)];
          const bellMidi = 60 + randomInterval;
          const bellFreq = 440 * Math.pow(2, (bellMidi - 69) / 12);

          this.playAuroraChime(bellFreq, severity);
        }
      }
    }, 450);
  }

  setMasterVolume(val) {
    this.state.masterVolume = parseFloat(val);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.state.masterVolume, this.ctx.currentTime + 0.05);
    }
  }

  setReverbLevel(val) {
    this.state.reverbLevel = parseFloat(val);
    if (this.reverbSendGain && this.ctx) {
      this.reverbSendGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.reverbSendGain.gain.linearRampToValueAtTime(this.state.reverbLevel, this.ctx.currentTime + 0.05);
    }
  }

  updateParameters(params) {
    Object.assign(this.state, params);
    this.updateAcoustics();
  }

  startRecording() {
    if (!this.recordDest) return false;
    this.recordedChunks = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
      ? 'audio/webm;codecs=opus' 
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.recordDest.stream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `earth-jukebox-solar-wind-${new Date().toISOString().slice(0, 19)}.webm`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 2000);
    };

    this.mediaRecorder.start();
    this.isRecording = true;
    return true;
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      return true;
    }
    return false;
  }

  /**
   * ADD-ON: Coronal Mass Ejection (CME) Sonic Shockwave Burst
   */
  triggerCmeBurst() {
    if (!this.ctx || !this.isPlaying) return;

    const now = this.ctx.currentTime;
    
    // 1. Dramatic Sub-bass rumble swell
    if (this.subGain) {
      this.subGain.gain.cancelScheduledValues(now);
      this.subGain.gain.setValueAtTime(this.subGain.gain.value, now);
      this.subGain.gain.linearRampToValueAtTime(0.55, now + 1.2);
      this.subGain.gain.exponentialRampToValueAtTime(0.18, now + 6.5);
    }

    // 2. Open lowpass filter wide with heavy resonance
    if (this.tempFilter) {
      this.tempFilter.frequency.cancelScheduledValues(now);
      this.tempFilter.frequency.setValueAtTime(this.tempFilter.frequency.value, now);
      this.tempFilter.frequency.exponentialRampToValueAtTime(3200, now + 1.5);
      this.tempFilter.frequency.exponentialRampToValueAtTime(550, now + 7.0);
    }

    // 3. Trigger cascade of intense auroral bell harmonics
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (this.isPlaying && this.ctx) {
          const cmeNotes = [48, 55, 60, 67, 72, 79];
          const midi = cmeNotes[i % cmeNotes.length];
          const freq = 440 * Math.pow(2, (midi - 69) / 12);
          this.playBellVoice(freq, 0.45);
        }
      }, i * 400 + 1200);
    }
  }

  /**
   * ADD-ON: 3D Binaural Spatial Audio Toggle (Sun on Left, Earth on Right)
   */
  toggleSpatialBinaural(enabled) {
    this.spatialAudioEnabled = enabled;
    if (!this.ctx) return;

    if (this.ctx.createStereoPanner) {
      if (!this.dronePanner) {
        this.dronePanner = this.ctx.createStereoPanner();
        this.dronePanner.pan.setValueAtTime(-0.35, this.ctx.currentTime); // Sunward (Left)
      }
      if (!this.bellPanner) {
        this.bellPanner = this.ctx.createStereoPanner();
        this.bellPanner.pan.setValueAtTime(0.40, this.ctx.currentTime); // Earthward (Right)
      }

      if (this.droneGain && this.dronePanner) {
        try {
          if (enabled) {
            this.droneGain.disconnect(this.masterCompressor);
            this.droneGain.connect(this.dronePanner);
            this.dronePanner.connect(this.masterCompressor);
          } else {
            this.droneGain.disconnect(this.dronePanner);
            this.droneGain.connect(this.masterCompressor);
          }
        } catch (e) {
          // Fallback if re-connection state varies
        }
      }
    }
    return this.spatialAudioEnabled;
  }

  /**
   * ADD-ON: Sleep / Study Focus Timer with Soft Fadeout
   */
  setSleepFocusTimer(minutes, onTick, onComplete) {
    this.clearSleepTimer();
    if (!minutes || minutes <= 0) return;

    this.sleepSecondsRemaining = minutes * 60;
    
    this.sleepTimerInterval = setInterval(() => {
      this.sleepSecondsRemaining--;

      if (onTick) {
        const m = Math.floor(this.sleepSecondsRemaining / 60);
        const s = this.sleepSecondsRemaining % 60;
        onTick(`${m}:${s.toString().padStart(2, '0')}`);
      }

      // Soft fadeout over the last 15 seconds
      if (this.sleepSecondsRemaining <= 15 && this.masterGain && this.ctx) {
        const fraction = Math.max(0, this.sleepSecondsRemaining / 15);
        this.masterGain.gain.setValueAtTime(this.state.masterVolume * fraction, this.ctx.currentTime);
      }

      if (this.sleepSecondsRemaining <= 0) {
        this.clearSleepTimer();
        this.pause();
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  clearSleepTimer() {
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    this.sleepSecondsRemaining = 0;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.state.masterVolume, this.ctx.currentTime);
    }
  }
}
