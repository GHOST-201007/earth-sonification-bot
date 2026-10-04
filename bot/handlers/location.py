"""
Location Handler for Earth Sonification Bot with Multi-Language support.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from config import Config
from database.db import db_manager
from localization.i18n import i18n
from bot.keyboards.inline import get_location_selection_keyboard

logger = logging.getLogger(__name__)


async def location_menu_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Displays location selection menu."""
    user = update.effective_user
    user_rec = await db_manager.get_or_create_user(user.id, user.username, user.first_name)
    lang = user_rec.language

    title_str = i18n.t("loc_title", lang)
    current_str = i18n.t("loc_current", lang, location=user_rec.location_name)
    coords_str = i18n.t("loc_coords", lang, lat=user_rec.latitude, lon=user_rec.longitude)
    instruction_str = i18n.t("loc_instruction", lang)

    text = (
        f"{title_str}\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"{current_str}\n"
        f"{coords_str}\n\n"
        f"{instruction_str}\n\n"
        "👇 _Select one of the preset locations below:_"
    )

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.reply_text(
            text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=get_location_selection_keyboard(lang),
        )
    else:
        await update.message.reply_text(
            text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=get_location_selection_keyboard(lang),
        )


async def set_location_callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Processes location preset selection callback."""
    query = update.callback_query
    await query.answer()

    data = query.data  # e.g. "set_loc:uzbekistan"
    preset_key = data.split(":")[-1]

    if preset_key in Config.PRESET_LOCATIONS:
        preset = Config.PRESET_LOCATIONS[preset_key]
        user = update.effective_user
        
        await db_manager.update_user_location(
            user_id=user.id,
            lat=preset["lat"],
            lon=preset["lon"],
            location_name=preset["name"],
        )

        user_rec = await db_manager.get_or_create_user(user.id)
        lang = user_rec.language

        success_text = i18n.t("loc_updated", lang, name=preset["name"], lat=preset["lat"], lon=preset["lon"])

        await query.message.reply_text(
            success_text,
            parse_mode=ParseMode.MARKDOWN,
        )


async def user_location_message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Processes location shared via Telegram native location attachment."""
    if not update.message or not update.message.location:
        return

    loc = update.message.location
    lat, lon = round(loc.latitude, 4), round(loc.longitude, 4)
    user = update.effective_user
    loc_name = f"Custom ({lat}, {lon})"

    await db_manager.update_user_location(
        user_id=user.id,
        lat=lat,
        lon=lon,
        location_name=loc_name,
    )

    user_rec = await db_manager.get_or_create_user(user.id)
    lang = user_rec.language

    success_text = i18n.t("loc_updated", lang, name=loc_name, lat=lat, lon=lon)

    await update.message.reply_text(
        success_text,
        parse_mode=ParseMode.MARKDOWN,
    )
