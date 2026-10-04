"""
Tests for SQLite Database Manager and User Persistence.
"""

import pytest
from database.db import DatabaseManager


@pytest.mark.asyncio
async def test_user_creation_and_update(tmp_path):
    """Test user lifecycle in SQLite."""
    test_db = tmp_path / "user_test.db"
    db = DatabaseManager(db_path=str(test_db))
    await db.initialize()

    # Create user
    user = await db.get_or_create_user(user_id=999888, username="nasatester", first_name="Astronaut")
    assert user.user_id == 999888
    assert user.username == "nasatester"
    assert user.location_name == "Tashkent, Uzbekistan"

    # Update location
    await db.update_user_location(user_id=999888, lat=35.6762, lon=139.6503, location_name="Tokyo, Japan")
    updated = await db.get_or_create_user(user_id=999888)
    assert updated.location_name == "Tokyo, Japan"
    assert updated.latitude == 35.6762


@pytest.mark.asyncio
async def test_sonification_logging(tmp_path):
    """Test logging of audio sonification events."""
    test_db = tmp_path / "log_test.db"
    db = DatabaseManager(db_path=str(test_db))
    await db.initialize()

    await db.log_sonification(
        user_id=999888,
        sound_type="temperature",
        params={"temp_c": 28.5, "hz": 440},
        audio_path="temp_28_test.wav",
    )
