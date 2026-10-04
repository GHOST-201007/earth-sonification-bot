"""
Base data fetching framework with caching, resilience, and fallback data models.
"""

import logging
import asyncio
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import aiohttp
from database.db import db_manager

logger = logging.getLogger(__name__)


class BaseDataFetcher(ABC):
    """Abstract base class for all Earth data providers."""

    def __init__(self, data_type: str, cache_ttl: int):
        self.data_type = data_type
        self.cache_ttl = cache_ttl

    def _get_location_key(self, lat: float, lon: float) -> str:
        """Generates a rounded location key for caching."""
        return f"{round(lat, 2)},{round(lon, 2)}"

    async def get_data(self, lat: float, lon: float, location_name: str = "Location", force_refresh: bool = False) -> Dict[str, Any]:
        """
        Retrieves data with Cache-First strategy:
        1. Check local SQLite cache
        2. If miss or expired, fetch from real API
        3. If API fails, retry or return realistic fallback data without crashing
        4. Save to cache
        """
        loc_key = self._get_location_key(lat, lon)

        if not force_refresh:
            cached = await db_manager.get_cached_data(self.data_type, loc_key)
            if cached is not None:
                cached["cached"] = True
                return cached

        # Fetch from remote API with retry
        data = None
        for attempt in range(1, 3):
            try:
                data = await self._fetch_from_api(lat, lon, location_name)
                if data:
                    break
            except Exception as e:
                logger.warning("Attempt %d failed to fetch %s: %s", attempt, self.data_type, e)
                if attempt < 2:
                    await asyncio.sleep(0.5)

        if data is None:
            logger.warning("API unavailable for %s, utilizing realistic fallback data.", self.data_type)
            data = self._get_fallback_data(lat, lon, location_name)
            data["is_fallback"] = True
        else:
            data["is_fallback"] = False

        data["cached"] = False
        summary = data.get("summary", f"{self.data_type} data")

        # Cache valid data
        try:
            await db_manager.set_cached_data(self.data_type, loc_key, data, self.cache_ttl, summary)
        except Exception as e:
            logger.error("Failed to write to cache: %s", e)

        return data

    @abstractmethod
    async def _fetch_from_api(self, lat: float, lon: float, location_name: str) -> Optional[Dict[str, Any]]:
        """Fetch real data from public open APIs."""
        pass

    @abstractmethod
    def _get_fallback_data(self, lat: float, lon: float, location_name: str) -> Dict[str, Any]:
        """Return realistic fallback data if network/API fails."""
        pass

    async def _http_get_json(self, url: str, params: Optional[Dict[str, Any]] = None, timeout_seconds: int = 6) -> Optional[Dict[str, Any]]:
        """Helper to make async HTTP GET requests with timeout."""
        timeout = aiohttp.ClientTimeout(total=timeout_seconds)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, params=params) as resp:
                if resp.status == 200:
                    return await resp.json()
                logger.error("HTTP GET %s returned status %d", url, resp.status)
                return None
