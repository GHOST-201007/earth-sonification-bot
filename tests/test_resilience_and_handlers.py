"""
Resilience, Error Handling, and Mock Telegram Handler Tests.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from data.temperature import TemperatureFetcher
from data.sea_level import SeaLevelFetcher
from data.clouds import CloudFetcher
from data.data_aggregator import data_aggregator
from bot.handlers.start import start_handler
from bot.handlers.temperature import temperature_handler
from bot.handlers.sea_level import sea_level_handler
from bot.handlers.clouds import clouds_handler
from bot.handlers.data_overview import data_overview_handler
from bot.handlers.earth_sound import earth_sound_handler
from bot.handlers.help_about import help_handler, about_handler
from database.db import db_manager


@pytest.mark.asyncio
async def test_temperature_fallback_on_network_failure(monkeypatch):
    """Verify that when network fails, fallback data is returned without exception."""
    fetcher = TemperatureFetcher()

    async def mock_network_failure(*args, **kwargs):
        raise ConnectionError("Network unreachable")

    monkeypatch.setattr(fetcher, "_fetch_from_api", mock_network_failure)
    
    # Should not raise exception
    data = await fetcher.get_data(0.0, 0.0, "Test Location", force_refresh=True)
    assert data is not None
    assert data["is_fallback"] is True
    assert "temperature_c" in data
    assert "pitch_description" in data


@pytest.mark.asyncio
async def test_clouds_fallback_on_network_failure(monkeypatch):
    """Verify cloud fallback on network error."""
    fetcher = CloudFetcher()

    async def mock_network_failure(*args, **kwargs):
        raise TimeoutError("API timeout")

    monkeypatch.setattr(fetcher, "_fetch_from_api", mock_network_failure)
    
    data = await fetcher.get_data(0.0, 0.0, "Test Location", force_refresh=True)
    assert data is not None
    assert data["is_fallback"] is True
    assert 0 <= data["cloud_cover_percent"] <= 100


@pytest.mark.asyncio
async def test_telegram_handlers_mock_execution(tmp_path):
    """Simulate Telegram updates executing handlers to verify end-to-end flow without crash."""
    test_db = tmp_path / "mock_test.db"
    db_manager.db_path = str(test_db)
    await db_manager.initialize()

    # Mock Telegram Update & Context
    update = MagicMock()
    update.effective_user.id = 12345
    update.effective_user.username = "testastronaut"
    update.effective_user.first_name = "Astronaut"
    update.effective_chat.id = 12345
    update.callback_query = None
    update.message.reply_text = AsyncMock()

    context = MagicMock()
    context.bot.send_chat_action = AsyncMock()
    context.bot.send_audio = AsyncMock()

    # Test /start
    await start_handler(update, context)
    assert update.message.reply_text.called

    # Test /temperature
    await temperature_handler(update, context)
    assert context.bot.send_audio.called

    # Test /sea_level
    await sea_level_handler(update, context)
    assert context.bot.send_audio.called

    # Test /clouds
    await clouds_handler(update, context)
    assert context.bot.send_audio.called

    # Test /earth_sound
    await earth_sound_handler(update, context)
    assert context.bot.send_audio.called

    # Test /data
    await data_overview_handler(update, context)
    assert update.message.reply_text.called

    # Test /help & /about
    await help_handler(update, context)
    await about_handler(update, context)
