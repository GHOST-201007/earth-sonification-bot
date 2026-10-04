"""
Unit tests for Multi-Language System and Localization Manager.
"""

import pytest
from localization.i18n import i18n
from database.db import DatabaseManager


def test_i18n_translation_keys_parity():
    """Verify that uz, ru, and en localization files have matching keys."""
    uz_keys = set(i18n.translations.get("uz", {}).keys())
    ru_keys = set(i18n.translations.get("ru", {}).keys())
    en_keys = set(i18n.translations.get("en", {}).keys())

    assert len(uz_keys) > 20
    assert uz_keys == ru_keys, f"Missing keys in RU: {uz_keys - ru_keys}"
    assert uz_keys == en_keys, f"Missing keys in EN: {uz_keys - en_keys}"


def test_i18n_formatting_and_fallbacks():
    """Verify string retrieval and keyword argument interpolation for uz, ru, en."""
    # Test Uzbek
    uz_text = i18n.t("temp_current", "uz", temp=25.0, feels=26.0)
    assert "25.0°C" in uz_text
    assert "Joriy harorat" in uz_text

    # Test Russian
    ru_text = i18n.t("temp_current", "ru", temp=25.0, feels=26.0)
    assert "25.0°C" in ru_text
    assert "Текущая температура" in ru_text

    # Test English
    en_text = i18n.t("temp_current", "en", temp=25.0, feels=26.0)
    assert "25.0°C" in en_text
    assert "Current Value" in en_text

    # Test Fallback for invalid language code
    fallback_text = i18n.t("btn_temperature", "invalid_lang_code")
    assert fallback_text == "🌡 Harorat"


@pytest.mark.asyncio
async def test_user_language_database_persistence(tmp_path):
    """Test user language updates in SQLite database."""
    test_db = tmp_path / "lang_test.db"
    db = DatabaseManager(db_path=str(test_db))
    await db.initialize()

    # Create user default (uz)
    user = await db.get_or_create_user(user_id=123456)
    assert user.language == "uz"

    # Update to Russian
    await db.update_user_language(user_id=123456, language="ru")
    updated = await db.get_or_create_user(user_id=123456)
    assert updated.language == "ru"

    # Update to English
    await db.update_user_language(user_id=123456, language="en")
    updated_en = await db.get_or_create_user(user_id=123456)
    assert updated_en.language == "en"
