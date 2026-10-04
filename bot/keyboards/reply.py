"""
Localized Reply Keyboards for Telegram Bot.
Provides persistent, intuitive, emoji-rich navigation buttons in uz, ru, or en.
"""

from telegram import ReplyKeyboardMarkup, KeyboardButton
from localization.i18n import i18n


def get_main_reply_keyboard(lang: str = "uz") -> ReplyKeyboardMarkup:
    """Returns the main bottom keyboard menu for instant access in user's language."""
    keyboard = [
        [
            KeyboardButton(i18n.t("btn_temperature", lang)),
            KeyboardButton(i18n.t("btn_sea_level", lang)),
        ],
        [
            KeyboardButton(i18n.t("btn_clouds", lang)),
            KeyboardButton(i18n.t("btn_all_data", lang)),
        ],
        [
            KeyboardButton(i18n.t("btn_earth_sound", lang)),
            KeyboardButton(i18n.t("btn_location", lang)),
        ],
        [
            KeyboardButton(i18n.t("btn_settings", lang)),
            KeyboardButton(i18n.t("btn_about", lang)),
            KeyboardButton(i18n.t("btn_help", lang)),
        ],
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, is_persistent=True)
