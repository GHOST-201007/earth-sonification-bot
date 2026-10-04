"""
Cloud Cover Handler for Earth Sonification Bot with Multi-Language support.
"""

import logging
from telegram import Update, InputFile
from telegram.ext import ContextTypes
from telegram.constants import ParseMode, ChatAction
from data.clouds import cloud_fetcher
from sonification.engine import sonification_engine
from bot.keyboards.inline import get_clouds_inline_keyboard
from database.db import db_manager
from localization.i18n import i18n

logger = logging.getLogger(__name__)


async def clouds_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, force_refresh: bool = False):
    """Handles /clouds command, button clicks, and inline actions."""
    user = update.effective_user
    chat = update.effective_chat

    query = update.callback_query
    if query:
        await query.answer("☁️ Fetching cloud cover & synthesizing pad...")

    user_rec = await db_manager.get_or_create_user(user.id, user.username, user.first_name)
    lat, lon, loc_name = user_rec.latitude, user_rec.longitude, user_rec.location_name
    lang = user_rec.language

    await context.bot.send_chat_action(chat_id=chat.id, action=ChatAction.RECORD_VOICE)

    # 1. Fetch data
    cloud_data = await cloud_fetcher.get_data(lat, lon, loc_name, force_refresh=force_refresh)
    cloud_pct = cloud_data["cloud_cover_percent"]
    status_label = cloud_data["status_label"]
    status_emoji = cloud_data["status_emoji"]
    status_desc = cloud_data["status_description"]
    pitch_desc = cloud_data["pitch_description"]
    texture_desc = cloud_data["texture_description"]
    source = cloud_data["source"]
    is_cached = cloud_data.get("cached", False)

    # 2. Generate Audio
    audio_path, metadata = await sonification_engine.sonify_clouds(cloud_pct, user_id=user.id)

    # 3. Format localized text
    cache_badge = "⚡ (Cached)" if is_cached else "🔄 (Live Satellite)"
    title_str = i18n.t("cloud_title", lang)
    loc_str = i18n.t("cloud_location", lang, location=loc_name)
    current_str = i18n.t("cloud_current", lang, pct=cloud_pct)
    status_str = i18n.t("cloud_status", lang, emoji=status_emoji, status=status_label)
    tone_str = i18n.t("cloud_tone", lang, tone=pitch_desc)
    texture_str = i18n.t("cloud_texture", lang, texture=texture_desc)
    params_str = i18n.t("cloud_params", lang, harmonics=metadata['harmonics_count'], bpm=metadata['rhythm_bpm'])
    rule_str = i18n.t("cloud_rule", lang)

    response_text = (
        f"{title_str} {cache_badge}\n"
        f"{loc_str}\n\n"
        f"{current_str}\n"
        f"{status_str}\n"
        f"_{status_desc}_\n\n"
        f"🎵 *Sonification Mapping:*\n"
        f"{tone_str}\n"
        f"{texture_str}\n"
        f"{params_str}\n\n"
        f"{rule_str}\n\n"
        f"🛰 *Source:* `{source}`"
    )

    # 4. Send Audio
    with open(audio_path, "rb") as audio_file:
        await context.bot.send_audio(
            chat_id=chat.id,
            audio=InputFile(audio_file, filename=f"cloud_cover_{cloud_pct}percent.wav"),
            caption=response_text,
            parse_mode=ParseMode.MARKDOWN,
            title=f"Cloud Cover ({cloud_pct}%)",
            performer="Earth Sonification Bot ☁️",
            reply_markup=get_clouds_inline_keyboard(lang),
        )
