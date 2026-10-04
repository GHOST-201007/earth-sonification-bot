"""
Sea Level Handler for Earth Sonification Bot with Multi-Language support.
"""

import logging
from telegram import Update, InputFile
from telegram.ext import ContextTypes
from telegram.constants import ParseMode, ChatAction
from data.sea_level import sea_level_fetcher
from sonification.engine import sonification_engine
from bot.keyboards.inline import get_sea_level_inline_keyboard
from database.db import db_manager
from localization.i18n import i18n

logger = logging.getLogger(__name__)


async def sea_level_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, force_refresh: bool = False):
    """Handles /sea_level command, button clicks, and inline actions."""
    user = update.effective_user
    chat = update.effective_chat

    query = update.callback_query
    if query:
        await query.answer("🌊 Fetching sea level & synthesizing sweep...")
    
    user_rec = await db_manager.get_or_create_user(user.id, user.username, user.first_name)
    lat, lon, loc_name = user_rec.latitude, user_rec.longitude, user_rec.location_name
    lang = user_rec.language

    await context.bot.send_chat_action(chat_id=chat.id, action=ChatAction.RECORD_VOICE)

    # 1. Fetch data
    sea_data = await sea_level_fetcher.get_data(lat, lon, loc_name, force_refresh=force_refresh)
    rate = sea_data["current_rate_mm_year"]
    cum_rise = sea_data["cumulative_rise_mm"]
    trend_status = sea_data["trend_status"]
    trend_emoji = sea_data["trend_emoji"]
    status_desc = sea_data["status_description"]
    pitch_direction = sea_data["pitch_direction"]
    source = sea_data["source"]
    is_cached = sea_data.get("cached", False)

    # 2. Generate Audio
    audio_path, metadata = await sonification_engine.sonify_sea_level(rate, user_id=user.id)

    # 3. Format localized text
    cache_badge = "⚡ (Cached)" if is_cached else "🔄 (Live Satellite)"
    title_str = i18n.t("sea_title", lang)
    loc_str = i18n.t("sea_location", lang)
    rate_str = i18n.t("sea_rate", lang, rate=rate)
    cum_str = i18n.t("sea_cum", lang, cum=cum_rise, cum_cm=round(cum_rise/10, 1))
    trend_str = i18n.t("sea_trend", lang, emoji=trend_emoji, trend=trend_status)
    pitch_str = i18n.t("sea_pitch", lang, pitch=pitch_direction)
    freq_str = i18n.t("sea_freq", lang, start=metadata['start_frequency_hz'], end=metadata['end_frequency_hz'])
    swell_str = i18n.t("sea_swell", lang)
    rule_str = i18n.t("sea_rule", lang)

    response_text = (
        f"{title_str} {cache_badge}\n"
        f"{loc_str}\n\n"
        f"{rate_str}\n"
        f"{cum_str}\n"
        f"{trend_str}\n"
        f"_{status_desc}_\n\n"
        f"🎵 *Sonification Mapping:*\n"
        f"{pitch_str}\n"
        f"{freq_str}\n"
        f"{swell_str}\n\n"
        f"{rule_str}\n\n"
        f"🛰 *Source:* `{source}`"
    )

    # 4. Send Audio
    with open(audio_path, "rb") as audio_file:
        await context.bot.send_audio(
            chat_id=chat.id,
            audio=InputFile(audio_file, filename=f"global_sea_level_rise_{rate}mm.wav"),
            caption=response_text,
            parse_mode=ParseMode.MARKDOWN,
            title=f"Sea Level Rise (+{rate} mm/yr)",
            performer="Earth Sonification Bot 🌊",
            reply_markup=get_sea_level_inline_keyboard(lang),
        )
