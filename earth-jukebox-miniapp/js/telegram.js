/**
 * Telegram WebApp Integration Module.
 * Connects Earth Jukebox with native Telegram Mini App API.
 */

class TelegramController {
    constructor() {
        this.tg = window.Telegram ? window.Telegram.WebApp : null;
        this.init();
    }

    init() {
        if (!this.tg) {
            console.warn("Telegram WebApp SDK not found. Running in standalone web browser mode.");
            return;
        }

        try {
            this.tg.ready();
            this.tg.expand();
            this.tg.setHeaderColor('#0a0a1a');
            this.tg.setBackgroundColor('#0a0a1a');
        } catch (e) {
            console.error("Error initializing Telegram WebApp:", e);
        }
    }

    // MainButton Setup
    setMainButton(text, onClickCallback, show = true) {
        if (!this.tg || !this.tg.MainButton) return;
        this.tg.MainButton.setText(text);
        this.tg.MainButton.show();
        
        // Remove existing listeners
        this.tg.MainButton.offClick();
        if (onClickCallback) {
            this.tg.MainButton.onClick(onClickCallback);
        }
    }

    hideMainButton() {
        if (!this.tg || !this.tg.MainButton) return;
        this.tg.MainButton.hide();
    }

    // BackButton Setup
    setBackButton(onClickCallback) {
        if (!this.tg || !this.tg.BackButton) return;
        this.tg.BackButton.show();
        this.tg.BackButton.offClick();
        if (onClickCallback) {
            this.tg.BackButton.onClick(onClickCallback);
        }
    }

    hideBackButton() {
        if (!this.tg || !this.tg.BackButton) return;
        this.tg.BackButton.hide();
    }

    // Haptic Feedback
    hapticImpact(style = 'medium') {
        if (this.tg && this.tg.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred(style);
        }
    }

    hapticNotification(type = 'success') {
        if (this.tg && this.tg.HapticFeedback) {
            this.tg.HapticFeedback.notificationOccurred(type);
        }
    }

    hapticSelection() {
        if (this.tg && this.tg.HapticFeedback) {
            this.tg.HapticFeedback.selectionChanged();
        }
    }

    // Share & Send Data
    shareInline(text = "Men Yer simfoniyasini eshitdim! 🌍") {
        if (this.tg && this.tg.switchInlineQuery) {
            this.tg.switchInlineQuery(text);
        } else {
            alert("Sharable string: " + text);
        }
    }

    sendDataToBot(dataObject) {
        if (this.tg && this.tg.sendData) {
            this.tg.sendData(JSON.stringify(dataObject));
        } else {
            console.log("Send Data to bot:", dataObject);
        }
    }

    // CloudStorage Persistence
    saveSettings(settings) {
        if (this.tg && this.tg.CloudStorage) {
            this.tg.CloudStorage.setItem('lastSettings', JSON.stringify(settings), (err) => {
                if (err) console.error("CloudStorage save error:", err);
            });
        } else {
            localStorage.setItem('lastSettings', JSON.stringify(settings));
        }
    }

    loadSettings(callback) {
        if (this.tg && this.tg.CloudStorage) {
            this.tg.CloudStorage.getItem('lastSettings', (err, value) => {
                if (!err && value) {
                    try { callback(JSON.parse(value)); } catch (e) {}
                }
            });
        } else {
            const val = localStorage.getItem('lastSettings');
            if (val) {
                try { callback(JSON.parse(val)); } catch (e) {}
            }
        }
    }
}

const telegramController = new TelegramController();
