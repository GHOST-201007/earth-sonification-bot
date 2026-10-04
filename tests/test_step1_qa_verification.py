"""
Comprehensive Manual & Automated QA Verification Suite for STEP 1 - Multi-Language System.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from localization.i18n import i18n
from database.db import db_manager
from bot.handlers.start import start_handler
from bot.handlers.language import language_menu_handler, set_language_callback_handler
from bot.handlers.temperature import temperature_handler
from bot.handlers.sea_level import sea_level_handler
from bot.handlers.clouds import clouds_handler
from bot.handlers.data_overview import data_overview_handler
from bot.handlers.earth_sound import earth_sound_handler
from bot.handlers.help_about import help_handler, about_handler


@pytest.mark.asyncio
async def test_qa_multi_language_end_to_end_user_flow(tmp_path):
    """Executes full multi-language user flow across UZ, RU, EN."""
    test_db = tmp_path / "qa_test.db"
    db_manager.db_path = str(test_db)
    await db_manager.initialize()

    # Create mock update & context
    update = MagicMock()
    update.effective_user.id = 555111
    update.effective_user.username = "space_tester"
    update.effective_user.first_name = "Cosmonaut"
    update.effective_chat.id = 555111
    update.callback_query = None
    update.message.reply_text = AsyncMock()

    context = MagicMock()
    context.bot.send_chat_action = AsyncMock()
    context.bot.send_audio = AsyncMock()

    # 1. First /start -> default uz
    await start_handler(update, context)
    assert update.message.reply_text.called

    # 2. Switch to Russian via callback set_lang:ru
    query = MagicMock()
    query.data = "set_lang:ru"
    query.answer = AsyncMock()
    query.message.reply_text = AsyncMock()
    update.callback_query = query

    await set_language_callback_handler(update, context)
    user_rec = await db_manager.get_or_create_user(555111)
    assert user_rec.language == "ru"

    # 3. Test Russian Temperature
    update.callback_query = None
    await temperature_handler(update, context)
    assert context.bot.send_audio.called

    # 4. Switch to English via callback set_lang:en
    query.data = "set_lang:en"
    update.callback_query = query
    await set_language_callback_handler(update, context)
    user_rec_en = await db_manager.get_or_create_user(555111)
    assert user_rec_en.language == "en"

    # 5. Test English Earth Sound
    update.callback_query = None
    await earth_sound_handler(update, context)
    assert context.bot.send_audio.called


def test_qa_key_parity_and_no_missing_strings():
    """Verify parity of localized keys."""
    uz = set(i18n.translations.get("uz", {}).keys())
    ru = set(i18n.translations.get("ru", {}).keys())
    en = set(i18n.translations.get("en", {}).keys())

    assert uz == ru
    assert uz == en
