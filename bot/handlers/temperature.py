"""
Temperature Handler for Earth Sonification Bot with Multi-Language support.
"""

import logging
from telegram import Update, InputFile
from telegram.ext import ContextTypes
from telegram.constants import ParseMode, ChatAction
from data.temperature import temperature_fetcher
from sonification.engine import sonification_engine
from bot.keyboards.inline import get_temperature_inline_keyboard
from database.db import db_manager
from localization.i18n import i18n

logger = logging.getLogger(__name__)


async def temperature_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, force_refresh: bool = False):
    """Handles /temperature command, button clicks, and inline actions."""
    user = update.effective_user
    chat = update.effective_chat
    
    query = update.callback_query
    if query:
        await query.answer("🌡 Fetching temperature & sonifying...")

    user_rec = await db_manager.get_or_create_user(user.id, user.username, user.first_name)
    lat, lon, loc_name = user_rec.latitude, user_rec.longitude, user_rec.location_name
    lang = user_rec.language

    await context.bot.send_chat_action(chat_id=chat.id, action=ChatAction.RECORD_VOICE)

    # 1. Fetch data
    temp_data = await temperature_fetcher.get_data(lat, lon, loc_name, force_refresh=force_refresh)
    temp_c = temp_data["temperature_c"]
    status_label = temp_data["status_label"]
    status_emoji = temp_data["status_emoji"]
    status_desc = temp_data["status_description"]
    pitch_desc = temp_data["pitch_description"]
    rhythm_desc = temp_data["rhythm_description"]
    source = temp_data["source"]
    is_cached = temp_data.get("cached", False)

    # 2. Generate Sonification Audio
    audio_path, metadata = await sonification_engine.sonify_temperature(temp_c, user_id=user.id)

    # 3. Format localized user message
    cache_badge = "⚡ (Cached)" if is_cached else "🔄 (Live Data)"
    title_str = i18n.t("temp_title", lang)
    loc_str = i18n.t("temp_location", lang, location=loc_name)
    current_str = i18n.t("temp_current", lang, temp=temp_c, feels=temp_data.get("feels_like_c", temp_c))
    status_str = i18n.t("temp_status", lang, emoji=status_emoji, status=status_label)
    pitch_str = i18n.t("temp_pitch", lang, pitch=pitch_desc)
    rhythm_str = i18n.t("temp_rhythm", lang, rhythm=rhythm_desc)
    freq_str = i18n.t("temp_freq", lang, freq=metadata['base_frequency_hz'], scale=metadata['scale'])
    rule_str = i18n.t("temp_rule", lang)

    response_text = (
        f"{title_str} {cache_badge}\n"
        f"{loc_str}\n\n"
        f"{current_str}\n"
        f"{status_str}\n"
        f"_{status_desc}_\n\n"
        f"🎵 *Sonification Mapping:*\n"
        f"{pitch_str}\n"
        f"{rhythm_str}\n"
        f"{freq_str}\n\n"
        f"{rule_str}\n\n"
        f"🛰 *Source:* `{source}`"
    )

    # 4. Send Audio to User with Localized Inline Keyboard
    with open(audio_path, "rb") as audio_file:
        await context.bot.send_audio(
            chat_id=chat.id,
            audio=InputFile(audio_file, filename=f"earth_temperature_{temp_c}C.wav"),
            caption=response_text,
            parse_mode=ParseMode.MARKDOWN,
            title=f"Earth Temperature ({temp_c}°C)",
            performer="Earth Sonification Bot 🌍",
            reply_markup=get_temperature_inline_keyboard(lang),
        )
