"""
Language selection inline keyboard for Earth Sonification Telegram Bot.
"""

from telegram import InlineKeyboardMarkup, InlineKeyboardButton


def get_language_selection_keyboard() -> InlineKeyboardMarkup:
    """Inline keyboard for choosing language (uz, ru, en)."""
    keyboard = [
        [
            InlineKeyboardButton("🇺🇿 O‘zbekcha", callback_data="set_lang:uz"),
            InlineKeyboardButton("🇷🇺 Русский", callback_data="set_lang:ru"),
        ],
        [
            InlineKeyboardButton("🇬🇧 English", callback_data="set_lang:en"),
        ],
    ]
    return InlineKeyboardMarkup(keyboard)
