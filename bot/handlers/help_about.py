"""
Help and About handlers for Earth Sonification Telegram Bot with Multi-Language support.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from localization.i18n import i18n
from database.db import db_manager

logger = logging.getLogger(__name__)


async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles the /help command."""
    user = update.effective_user
    user_rec = await db_manager.get_or_create_user(user.id, user.username, user.first_name)
    lang = user_rec.language

    title_str = i18n.t("help_title", lang)
    text_str = i18n.t("help_text", lang)
    full_text = f"{title_str}\n━━━━━━━━━━━━━━━━━━━━\n\n{text_str}"

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.reply_text(full_text, parse_mode=ParseMode.MARKDOWN)
    else:
        await update.message.reply_text(full_text, parse_mode=ParseMode.MARKDOWN)


async def about_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles the /about command and Space Apps storytelling."""
    user = update.effective_user
    user_rec = await db_manager.get_or_create_user(user.id, user.username, user.first_name)
    lang = user_rec.language

    title_str = i18n.t("about_title", lang)
    text_str = i18n.t("about_text", lang)
    full_text = f"{title_str}\n━━━━━━━━━━━━━━━━━━━━\n\n{text_str}"

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.reply_text(full_text, parse_mode=ParseMode.MARKDOWN)
    else:
        await update.message.reply_text(full_text, parse_mode=ParseMode.MARKDOWN)
