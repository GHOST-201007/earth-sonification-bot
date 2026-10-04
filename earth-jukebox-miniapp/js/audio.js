/**
 * Native Web Audio API Engine for Earth Jukebox.
 * Zero heavy external dependencies, 100% lightweight and fast.
 */

class EarthAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.volumes = {
            temperature: 0.8,
            seaLevel: 0.7,
            cloudCover: 0.6,
            arcticIce: 0.75,
            co2: 0.6
        };
        this.setupInstruments();
    }

    initCtx() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setupInstruments() {
        this.instruments = {
            temperature: {
                type: 'piano',
                color: '#FF6B6B',
                mapValue: (anomaly) => {
                    // -0.5°C -> MIDI note 48 (C3), +1.5°C -> MIDI note 84 (C6)
                    return Math.round(48 + ((anomaly + 0.5) / 2.0) * 36);
                }
            },
            seaLevel: {
                type: 'bass',
                color: '#4ECDC4',
                mapValue: (mm) => {
                    // 0 -> 101mm maps to deep bass pitch 36 -> 52
                    return 36 + Math.round((mm / 100) * 16);
                }
            },
            co2: {
                type: 'drone',
                color: '#FF9F43',
                mapValue: (ppm) => {
                    return (ppm - 315) / (422 - 315); // 0.0 to 1.0 cutoff
                }
            },
            arcticIce: {
                type: 'bells',
                color: '#96CEB4',
                mapValue: (iceM) => {
                    // 15M -> many bells, 4M -> few notes
                    return Math.round(((iceM - 4) / (15 - 4)) * 6);
                }
            }
        };
    }

    playTone(midiNote, duration = 0.3, type = 'sine', gainVal = 0.3) {
        if (!this.ctx || this.isMuted) return;

        try {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(gainVal, this.ctx.currentTime + 0.03);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration + 0.05);
        } catch (e) {
            console.error("Error playing tone:", e);
        }
    }

    playDrone(distortion, duration = 0.4) {
        if (!this.ctx || this.isMuted) return;

        try {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gainNode = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low Sub A1

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(80 + distortion * 250, this.ctx.currentTime);

            const gain = 0.25 * this.volumes.co2;
            gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration + 0.05);
        } catch (e) {}
    }

    playSonificationStep(yearRecord, selectedParams) {
        this.initCtx();

        if (selectedParams.includes('temperature')) {
            const note = this.instruments.temperature.mapValue(yearRecord.tempAnomaly);
            this.playTone(note, 0.35, 'triangle', 0.4 * this.volumes.temperature);
        }

        if (selectedParams.includes('seaLevel')) {
            const bassNote = this.instruments.seaLevel.mapValue(yearRecord.seaLevel);
            this.playTone(bassNote, 0.4, 'sine', 0.5 * this.volumes.seaLevel);
        }

        if (selectedParams.includes('co2')) {
            const distortion = this.instruments.co2.mapValue(yearRecord.co2);
            this.playDrone(distortion, 0.4);
        }

        if (selectedParams.includes('arcticIce')) {
            const bellCount = this.instruments.arcticIce.mapValue(yearRecord.arcticIce);
            if (bellCount > 0) {
                for (let b = 0; b < bellCount; b++) {
                    setTimeout(() => {
                        this.playTone(72 + b * 2, 0.15, 'sine', 0.2 * this.volumes.arcticIce);
                    }, b * 60);
                }
            }
        }
    }
}

const audioEngine = new EarthAudioEngine();
