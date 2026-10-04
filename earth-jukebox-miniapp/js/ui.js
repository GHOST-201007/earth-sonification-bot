/**
 * UI & Screen Manager for Earth Jukebox Telegram Mini App.
 */

class UIManager {
    constructor() {
        this.currentScreen = 'screen-splash';
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
            this.currentScreen = screenId;
        }

        // Configure Telegram BackButton
        if (screenId === 'screen-home' || screenId === 'screen-splash') {
            telegramController.hideBackButton();
        } else {
            telegramController.setBackButton(() => {
                telegramController.hapticImpact('light');
                this.showScreen('screen-home');
            });
        }
    }

    updatePlayerStats(yearData) {
        const yrEl = document.getElementById('stat-year');
        const tempEl = document.getElementById('stat-temp');
        const seaEl = document.getElementById('stat-sea');
        const co2El = document.getElementById('stat-co2');

        if (yrEl) yrEl.textContent = yearData.year;
        if (tempEl) tempEl.textContent = `${yearData.tempAnomaly > 0 ? '+' : ''}${yearData.tempAnomaly}°C`;
        if (seaEl) seaEl.textContent = `+${yearData.seaLevel}mm`;
        if (co2El) co2El.textContent = `${yearData.co2} ppm`;
    }
}

const uiManager = new UIManager();
