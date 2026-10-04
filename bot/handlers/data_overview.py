"""
All Data Overview Handler for Earth Sonification Bot with Multi-Language support.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from data.data_aggregator import data_aggregator
from bot.keyboards.inline import get_data_overview_inline_keyboard
from database.db import db_manager
from localization.i18n import i18n

logger = logging.getLogger(__name__)


async def data_overview_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, force_refresh: bool = False):
    """Handles /data command, button clicks, and inline callbacks."""
    user = update.effective_user
    query = update.callback_query

    if query:
        await query.answer("📊 Gathering comprehensive Earth data...")

    user_rec = await db_manager.get_or_create_user(user.id, user.username, user.first_name)
    lat, lon, loc_name = user_rec.latitude, user_rec.longitude, user_rec.location_name
    lang = user_rec.language

    # Fetch all data concurrently
    all_data = await data_aggregator.get_all_data(lat, lon, loc_name, force_refresh=force_refresh)

    temp = all_data["temperature"]
    sea = all_data["sea_level"]
    cloud = all_data["clouds"]

    title_str = i18n.t("overview_title", lang)
    instruction_str = i18n.t("overview_instruction", lang)

    overview_text = (
        f"{title_str}\n"
        f"📍 *Location:* `{loc_name}`\n"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
        f"🌡 *Temperature:* `{temp['temperature_c']}°C` {temp['status_emoji']}\n"
        f"   • Status: *{temp['status_label']}*\n"
        f"   • Sonification: {temp['pitch_description']}\n\n"
        f"🌊 *Sea Level:* `+{sea['current_rate_mm_year']} mm/yr` {sea['trend_emoji']}\n"
        f"   • Trend: *{sea['trend_status']}* (+{sea['cumulative_rise_mm']} mm)\n"
        f"   • Sonification: {sea['pitch_direction']}\n\n"
        f"☁️ *Cloud Cover:* `{cloud['cloud_cover_percent']}%` {cloud['status_emoji']}\n"
        f"   • Status: *{cloud['status_label']}*\n"
        f"   • Sonification: {cloud['pitch_description']}\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"{instruction_str}"
    )

    if query:
        await query.message.reply_text(
            overview_text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=get_data_overview_inline_keyboard(lang),
        )
    else:
        await update.message.reply_text(
            overview_text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=get_data_overview_inline_keyboard(lang),
        )
