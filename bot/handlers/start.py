"""
Start handler for Earth Sonification Telegram Bot with multi-language support.
NASA Space Apps Challenge.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from localization.i18n import i18n
from bot.keyboards.reply import get_main_reply_keyboard
from bot.keyboards.inline import get_start_inline_keyboard
from bot.keyboards.language import get_language_selection_keyboard
from database.db import db_manager

logger = logging.getLogger(__name__)


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles the /start command."""
    user = update.effective_user
    if not user:
        return

    user_rec = await db_manager.get_or_create_user(
        user_id=user.id,
        username=user.username,
        first_name=user.first_name,
    )
    lang = user_rec.language

    # Render localized welcome message
    welcome_text = i18n.t("welcome_back", lang)

    if update.message:
        await update.message.reply_text(
            welcome_text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=get_start_inline_keyboard(lang),
        )
        # Ensure bottom persistent reply menu is initialized
        await update.message.reply_text(
            "👇",
            reply_markup=get_main_reply_keyboard(lang),
        )
    elif update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.reply_text(
            welcome_text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=get_start_inline_keyboard(lang),
        )
