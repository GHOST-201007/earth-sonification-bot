"""
Earth Symphony Composite Handler for Earth Sonification Bot with Multi-Language support.
"""

import logging
from telegram import Update, InputFile
from telegram.ext import ContextTypes
from telegram.constants import ParseMode, ChatAction
from data.data_aggregator import data_aggregator
from sonification.engine import sonification_engine
from bot.keyboards.inline import get_earth_sound_inline_keyboard
from database.db import db_manager
from localization.i18n import i18n

logger = logging.getLogger(__name__)


async def earth_sound_handler(update: Update, context: ContextTypes.DEFAULT_TYPE, force_refresh: bool = False):
    """Handles composite /earth_sound command and Earth Sound button."""
    user = update.effective_user
    chat = update.effective_chat

    query = update.callback_query
    if query:
        await query.answer("🌍 Composing complete Earth Symphony...")

    user_rec = await db_manager.get_or_create_user(user.id, user.username, user.first_name)
    lat, lon, loc_name = user_rec.latitude, user_rec.longitude, user_rec.location_name
    lang = user_rec.language

    await context.bot.send_chat_action(chat_id=chat.id, action=ChatAction.RECORD_VOICE)

    # 1. Fetch data
    all_data = await data_aggregator.get_all_data(lat, lon, loc_name, force_refresh=force_refresh)
    temp_val = all_data["temperature"]["temperature_c"]
    sea_rate = all_data["sea_level"]["current_rate_mm_year"]
    cloud_val = all_data["clouds"]["cloud_cover_percent"]

    # 2. Synthesize Composite Audio
    audio_path, metadata = await sonification_engine.sonify_earth_composite(
        temp_c=temp_val,
        sea_level_rate=sea_rate,
        cloud_pct=cloud_val,
        user_id=user.id,
    )

    # 3. Format localized text
    layers = metadata["layers"]
    title_str = i18n.t("earth_symphony_title", lang)
    layer1_str = i18n.t("earth_layer_temp", lang, val=layers['temperature']['value'], freq=layers['temperature']['base_freq'])
    layer2_str = i18n.t("earth_layer_sea", lang, val=layers['sea_level']['value'], dir=layers['sea_level']['direction'])
    layer3_str = i18n.t("earth_layer_cloud", lang, val=layers['clouds']['value'], char=layers['clouds']['character'])
    quote_str = i18n.t("earth_quote", lang)
    badge_str = i18n.t("source_badge", lang)

    response_text = (
        f"{title_str}\n"
        f"📍 *Location:* `{loc_name}`\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "🎧 *Sonic Layers:*\n\n"
        f"{layer1_str}\n\n"
        f"{layer2_str}\n\n"
        f"{layer3_str}\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"{quote_str}\n"
        f"{badge_str}"
    )

    # 4. Send Audio
    with open(audio_path, "rb") as audio_file:
        await context.bot.send_audio(
            chat_id=chat.id,
            audio=InputFile(audio_file, filename=f"earth_symphony_{loc_name}.wav"),
            caption=response_text,
            parse_mode=ParseMode.MARKDOWN,
            title="Earth Symphony 🌍",
            performer="Earth Sonification Bot",
            reply_markup=get_earth_sound_inline_keyboard(lang),
        )
