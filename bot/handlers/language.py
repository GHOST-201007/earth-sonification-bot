"""
Language selection handler for Earth Sonification Telegram Bot.
Enables switching user language between uz, ru, and en.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from localization.i18n import i18n
from database.db import db_manager
from bot.keyboards.language import get_language_selection_keyboard
from bot.keyboards.reply import get_main_reply_keyboard

logger = logging.getLogger(__name__)


async def language_menu_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Displays language selection menu."""
    user = update.effective_user
    user_rec = await db_manager.get_or_create_user(user.id, user.username, user.first_name)
    lang = user_rec.language

    text = i18n.t("welcome_first_time", lang)

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.reply_text(
            text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=get_language_selection_keyboard(),
        )
    else:
        await update.message.reply_text(
            text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=get_language_selection_keyboard(),
        )


async def set_language_callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Processes language selection callback."""
    query = update.callback_query
    await query.answer()

    data = query.data  # e.g. "set_lang:ru"
    selected_lang = data.split(":")[-1]

    if selected_lang in i18n.SUPPORTED_LANGUAGES:
        user = update.effective_user
        await db_manager.update_user_language(user.id, selected_lang)

        success_text = i18n.t("lang_changed", selected_lang)
        welcome_text = i18n.t("welcome_back", selected_lang)

        await query.message.reply_text(
            f"{success_text}\n\n{welcome_text}",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=get_main_reply_keyboard(selected_lang),
        )
