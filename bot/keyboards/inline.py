"""
Localized Inline Keyboards for Telegram Bot.
Provides interactive inline buttons in uz, ru, or en.
"""

from telegram import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from localization.i18n import i18n
from config import Config


def get_start_inline_keyboard(lang: str = "uz") -> InlineKeyboardMarkup:
    """Inline keyboard attached to /start welcome message."""
    keyboard = [
        [
            InlineKeyboardButton("🚀 Earth Jukebox Mini App 🎵", web_app=WebAppInfo(url=Config.WEBAPP_URL)),
        ],
        [
            InlineKeyboardButton(i18n.t("btn_master_earth_sound", lang), callback_data="action:sound:earth"),
            InlineKeyboardButton(i18n.t("btn_change_location", lang), callback_data="nav:location"),
        ],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_temperature_inline_keyboard(lang: str = "uz") -> InlineKeyboardMarkup:
    """Inline keyboard under Temperature response."""
    keyboard = [
        [
            InlineKeyboardButton(i18n.t("btn_regenerate_sound", lang), callback_data="action:sound:temperature"),
            InlineKeyboardButton(i18n.t("btn_refresh_data", lang), callback_data="action:refresh:temperature"),
        ],
        [
            InlineKeyboardButton("🚀 Earth Jukebox Mini App 🌍", web_app=WebAppInfo(url=Config.WEBAPP_URL)),
        ],
        [
            InlineKeyboardButton(i18n.t("btn_master_earth_sound", lang), callback_data="action:sound:earth"),
            InlineKeyboardButton(i18n.t("btn_change_location", lang), callback_data="nav:location"),
        ],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_sea_level_inline_keyboard(lang: str = "uz") -> InlineKeyboardMarkup:
    """Inline keyboard under Sea Level response."""
    keyboard = [
        [
            InlineKeyboardButton(i18n.t("btn_regenerate_sound", lang), callback_data="action:sound:sea_level"),
            InlineKeyboardButton(i18n.t("btn_refresh_data", lang), callback_data="action:refresh:sea_level"),
        ],
        [
            InlineKeyboardButton(i18n.t("btn_master_earth_sound", lang), callback_data="action:sound:earth"),
            InlineKeyboardButton(i18n.t("btn_all_data", lang), callback_data="nav:all_data"),
        ],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_clouds_inline_keyboard(lang: str = "uz") -> InlineKeyboardMarkup:
    """Inline keyboard under Cloud Cover response."""
    keyboard = [
        [
            InlineKeyboardButton(i18n.t("btn_regenerate_sound", lang), callback_data="action:sound:clouds"),
            InlineKeyboardButton(i18n.t("btn_refresh_data", lang), callback_data="action:refresh:clouds"),
        ],
        [
            InlineKeyboardButton(i18n.t("btn_master_earth_sound", lang), callback_data="action:sound:earth"),
            InlineKeyboardButton(i18n.t("btn_change_location", lang), callback_data="nav:location"),
        ],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_data_overview_inline_keyboard(lang: str = "uz") -> InlineKeyboardMarkup:
    """Inline keyboard under /data overview."""
    keyboard = [
        [
            InlineKeyboardButton("🚀 Earth Jukebox Mini App 🌍", web_app=WebAppInfo(url=Config.WEBAPP_URL)),
        ],
        [
            InlineKeyboardButton(i18n.t("btn_generate_earth_sound", lang), callback_data="action:sound:earth"),
        ],
        [
            InlineKeyboardButton(i18n.t("btn_temperature", lang), callback_data="nav:temperature"),
            InlineKeyboardButton(i18n.t("btn_sea_level", lang), callback_data="nav:sea_level"),
            InlineKeyboardButton(i18n.t("btn_clouds", lang), callback_data="nav:clouds"),
        ],
        [
            InlineKeyboardButton(i18n.t("btn_refresh_data", lang), callback_data="action:refresh:all_data"),
            InlineKeyboardButton(i18n.t("btn_change_location", lang), callback_data="nav:location"),
        ],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_earth_sound_inline_keyboard(lang: str = "uz") -> InlineKeyboardMarkup:
    """Inline keyboard under Earth Symphony response."""
    keyboard = [
        [
            InlineKeyboardButton(i18n.t("btn_regenerate_sound", lang), callback_data="action:sound:earth"),
            InlineKeyboardButton(i18n.t("btn_all_data", lang), callback_data="nav:all_data"),
        ],
        [
            InlineKeyboardButton(i18n.t("btn_change_location", lang), callback_data="nav:location"),
            InlineKeyboardButton(i18n.t("btn_about", lang), callback_data="nav:about"),
        ],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_location_selection_keyboard(lang: str = "uz") -> InlineKeyboardMarkup:
    """Inline keyboard for choosing preset locations."""
    keyboard = [
        [
            InlineKeyboardButton("🌍 Global Earth Average", callback_data="set_loc:global"),
            InlineKeyboardButton("🇺🇿 Tashkent, UZ", callback_data="set_loc:uzbekistan"),
        ],
        [
            InlineKeyboardButton("☀️ Equator (Galapagos)", callback_data="set_loc:equator"),
            InlineKeyboardButton("❄️ Arctic (Svalbard)", callback_data="set_loc:arctic"),
        ],
        [
            InlineKeyboardButton("🧊 Antarctica (Vostok)", callback_data="set_loc:antarctica"),
            InlineKeyboardButton("🇯🇵 Tokyo, Japan", callback_data="set_loc:tokyo"),
        ],
        [
            InlineKeyboardButton("🇺🇸 New York, USA", callback_data="set_loc:newyork"),
        ],
        [
            InlineKeyboardButton(i18n.t("btn_back_main", lang), callback_data="nav:start"),
        ],
    ]
    return InlineKeyboardMarkup(keyboard)
