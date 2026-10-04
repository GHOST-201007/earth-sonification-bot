"""
Tests for Data Fetchers (Temperature, Sea Level, Clouds, Aggregator).
"""

import pytest
from data.temperature import temperature_fetcher
from data.sea_level import sea_level_fetcher
from data.clouds import cloud_fetcher
from data.data_aggregator import data_aggregator
from database.db import db_manager


@pytest.mark.asyncio
async def test_database_init_and_cache(tmp_path):
    """Test database initialization and caching operations."""
    test_db_path = tmp_path / "test.db"
    db_manager.db_path = str(test_db_path)
    await db_manager.initialize()

    # Test cache set and get
    test_data = {"temperature_c": 28.5, "status": "HOT"}
    await db_manager.set_cached_data("temperature", "41.30,69.24", test_data, ttl_seconds=60, summary="28.5°C")
    
    cached = await db_manager.get_cached_data("temperature", "41.30,69.24")
    assert cached is not None
    assert cached["temperature_c"] == 28.5


@pytest.mark.asyncio
async def test_temperature_fetcher():
    """Test temperature data fetching and evaluation."""
    data = await temperature_fetcher.get_data(41.2995, 69.2401, "Tashkent", force_refresh=True)
    
    assert "temperature_c" in data
    assert "status_label" in data
    assert "pitch_description" in data
    assert isinstance(data["temperature_c"], (int, float))


@pytest.mark.asyncio
async def test_sea_level_fetcher():
    """Test sea level data fetching."""
    data = await sea_level_fetcher.get_data(0.0, 0.0, "Global Ocean", force_refresh=True)
    
    assert "current_rate_mm_year" in data
    assert "trend_status" in data
    assert data["current_rate_mm_year"] > 0


@pytest.mark.asyncio
async def test_cloud_fetcher():
    """Test cloud cover data fetching."""
    data = await cloud_fetcher.get_data(41.2995, 69.2401, "Tashkent", force_refresh=True)
    
    assert "cloud_cover_percent" in data
    assert 0 <= data["cloud_cover_percent"] <= 100
    assert "texture_description" in data


@pytest.mark.asyncio
async def test_data_aggregator():
    """Test aggregated Earth data fetching."""
    aggregated = await data_aggregator.get_all_data(41.2995, 69.2401, "Tashkent")
    
    assert "temperature" in aggregated
    assert "sea_level" in aggregated
    assert "clouds" in aggregated
    assert "location_name" in aggregated
