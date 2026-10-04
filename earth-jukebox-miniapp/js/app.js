/**
 * Main Controller for Earth Jukebox Telegram Mini App.
 */

class EarthJukeboxApp {
    constructor() {
        this.selectedParams = ['temperature', 'seaLevel', 'co2', 'arcticIce'];
        this.currentYearIdx = 0;
        this.isPlaying = false;
        this.playbackTimer = null;
        this.visualizer = null;
    }

    init() {
        // Initialize Visualizer
        this.visualizer = new WaveformVisualizer('waveform-canvas');

        // Simulate Splash Screen Loading Bar (0 -> 100%)
        let progress = 0;
        const progressEl = document.getElementById('splash-progress-bar');
        const interval = setInterval(() => {
            progress += 25;
            if (progressEl) progressEl.style.width = `${progress}%`;
            if (progress >= 100) {
                clearInterval(interval);
                uiManager.showScreen('screen-home');
                this.setupHomeState();
            }
        }, 200);

        // Load persisted settings from Telegram CloudStorage
        telegramController.loadSettings((settings) => {
            if (settings && settings.selectedParams) {
                this.selectedParams = settings.selectedParams;
                this.updateParamCardsUI();
            }
        });
    }

    setupHomeState() {
        telegramController.setMainButton('▶ MUSIQA BOSHLASH', () => {
            telegramController.hapticImpact('medium');
            this.startSonification();
        });
    }

    toggleParam(paramKey) {
        telegramController.hapticSelection();
        const idx = this.selectedParams.indexOf(paramKey);
        if (idx >= 0) {
            this.selectedParams.splice(idx, 1);
        } else {
            this.selectedParams.push(paramKey);
        }
        this.updateParamCardsUI();

        // Persist preferences
        telegramController.saveSettings({ selectedParams: this.selectedParams });
    }

    updateParamCardsUI() {
        ['temperature', 'seaLevel', 'cloudCover', 'arcticIce', 'co2'].forEach(paramKey => {
            const card = document.getElementById(`btn-param-${paramKey}`);
            if (card) {
                if (this.selectedParams.includes(paramKey)) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            }
        });
    }

    startSonification() {
        uiManager.showScreen('screen-player');
        this.isPlaying = true;
        this.currentYearIdx = 0;
        this.visualizer.setPlaying(true);

        telegramController.setMainButton('⏸ TO‘XTATISH', () => {
            telegramController.hapticImpact('medium');
            this.stopSonification();
        });

        this.runLoop();
    }

    stopSonification() {
        this.isPlaying = false;
        if (this.playbackTimer) clearTimeout(this.playbackTimer);
        this.visualizer.setPlaying(false);

        // Show Results Screen
        uiManager.showScreen('screen-results');

        telegramController.setMainButton('📤 DO‘STlARGA YUBORISH', () => {
            telegramController.hapticImpact('success');
            telegramController.shareInline(`Men Yer simfoniyasini eshitdim! 🌍 (${NASA_CLIMATE_DATA[0].year} -> ${NASA_CLIMATE_DATA[NASA_CLIMATE_DATA.length - 1].year})`);
        });

        // Send Session summary to Bot
        telegramController.sendDataToBot({
            action: 'save_session',
            parameters: this.selectedParams,
            yearRange: [NASA_CLIMATE_DATA[0].year, NASA_CLIMATE_DATA[NASA_CLIMATE_DATA.length - 1].year],
            score: 100
        });
    }

    runLoop() {
        if (!this.isPlaying) return;

        const currentData = NASA_CLIMATE_DATA[this.currentYearIdx];
        uiManager.updatePlayerStats(currentData);
        audioEngine.playSonificationStep(currentData, this.selectedParams);
        telegramController.hapticSelection();

        this.currentYearIdx++;
        if (this.currentYearIdx >= NASA_CLIMATE_DATA.length) {
            this.stopSonification();
            return;
        }

        this.playbackTimer = setTimeout(() => this.runLoop(), 380);
    }
}

const app = new EarthJukeboxApp();
window.addEventListener('DOMContentLoaded', () => app.init());
