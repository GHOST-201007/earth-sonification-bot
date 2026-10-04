"""
Database manager with SQLite and aiosqlite for non-blocking caching and user management.
"""

import json
import time
import logging
from typing import Optional, Dict, Any
import aiosqlite
from config import Config
from database.models import UserSettingsRecord

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Handles asynchronous SQLite database operations and caching."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = str(db_path or Config.DATABASE_PATH)

    async def initialize(self):
        """Creates tables and performs automatic schema migrations."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("PRAGMA journal_mode=WAL;")
            
            # Cache table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS data_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    data_type TEXT NOT NULL,
                    location_key TEXT NOT NULL,
                    raw_json TEXT NOT NULL,
                    value_summary TEXT,
                    created_at REAL NOT NULL,
                    expires_at REAL NOT NULL,
                    UNIQUE(data_type, location_key)
                )
            """)

            # User Settings table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS user_settings (
                    user_id INTEGER PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    language TEXT DEFAULT 'uz',
                    sound_mode TEXT DEFAULT 'scientific',
                    latitude REAL DEFAULT 41.2995,
                    longitude REAL DEFAULT 69.2401,
                    location_name TEXT DEFAULT 'Tashkent, Uzbekistan',
                    scale_type TEXT DEFAULT 'pentatonic',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Schema Migration Check for language and sound_mode columns if table pre-existed
            cursor = await db.execute("PRAGMA table_info(user_settings);")
            columns = [row[1] for row in await cursor.fetchall()]
            
            if "language" not in columns:
                logger.info("Migrating user_settings schema: adding 'language' column")
                await db.execute("ALTER TABLE user_settings ADD COLUMN language TEXT DEFAULT 'uz';")
            
            if "sound_mode" not in columns:
                logger.info("Migrating user_settings schema: adding 'sound_mode' column")
                await db.execute("ALTER TABLE user_settings ADD COLUMN sound_mode TEXT DEFAULT 'scientific';")

            # Sonification Logs table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS sonification_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    sound_type TEXT NOT NULL,
                    parameters_json TEXT NOT NULL,
                    audio_filename TEXT NOT NULL,
                    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Indexes
            await db.execute("CREATE INDEX IF NOT EXISTS idx_cache_lookup ON data_cache (data_type, location_key);")
            await db.execute("CREATE INDEX IF NOT EXISTS idx_cache_expires ON data_cache (expires_at);")
            await db.execute("CREATE INDEX IF NOT EXISTS idx_logs_user ON sonification_logs (user_id);")
            
            await db.commit()
            logger.info("Database initialized successfully at %s", self.db_path)

    # ---------------- Cache Operations ----------------

    async def get_cached_data(self, data_type: str, location_key: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached data if present and unexpired."""
        now = time.time()
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                SELECT raw_json, expires_at FROM data_cache
                WHERE data_type = ? AND location_key = ?
                """,
                (data_type, location_key),
            )
            row = await cursor.fetchone()
            if row:
                raw_json, expires_at = row
                if expires_at > now:
                    try:
                        return json.loads(raw_json)
                    except json.JSONDecodeError:
                        return None
        return None

    async def set_cached_data(self, data_type: str, location_key: str, data: Dict[str, Any], ttl_seconds: int, summary: str = ""):
        """Stores or updates data in the cache with expiration."""
        now = time.time()
        expires_at = now + ttl_seconds
        raw_json = json.dumps(data)

        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO data_cache (data_type, location_key, raw_json, value_summary, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(data_type, location_key) DO UPDATE SET
                    raw_json = excluded.raw_json,
                    value_summary = excluded.value_summary,
                    created_at = excluded.created_at,
                    expires_at = excluded.expires_at
                """,
                (data_type, location_key, raw_json, summary, now, expires_at),
            )
            await db.commit()

    # ---------------- User Operations ----------------

    async def get_or_create_user(self, user_id: int, username: Optional[str] = None, first_name: Optional[str] = None) -> UserSettingsRecord:
        """Retrieves or creates user settings record."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                SELECT user_id, username, first_name, language, sound_mode, latitude, longitude, location_name, scale_type, created_at, updated_at
                FROM user_settings WHERE user_id = ?
                """,
                (user_id,),
            )
            row = await cursor.fetchone()
            if row:
                return UserSettingsRecord(*row)

            # Create default user
            await db.execute(
                """
                INSERT INTO user_settings (user_id, username, first_name, language, sound_mode, latitude, longitude, location_name, scale_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    username,
                    first_name,
                    "uz",
                    "scientific",
                    Config.DEFAULT_LATITUDE,
                    Config.DEFAULT_LONGITUDE,
                    Config.DEFAULT_LOCATION_NAME,
                    "pentatonic",
                ),
            )
            await db.commit()

            return UserSettingsRecord(
                user_id=user_id,
                username=username,
                first_name=first_name,
                language="uz",
                sound_mode="scientific",
                latitude=Config.DEFAULT_LATITUDE,
                longitude=Config.DEFAULT_LONGITUDE,
                location_name=Config.DEFAULT_LOCATION_NAME,
                scale_type="pentatonic",
                created_at=str(time.time()),
                updated_at=str(time.time()),
            )

    async def update_user_language(self, user_id: int, language: str):
        """Updates user preferred language."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                UPDATE user_settings
                SET language = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                """,
                (language, user_id),
            )
            await db.commit()

    async def update_user_sound_mode(self, user_id: int, sound_mode: str):
        """Updates user preferred sonification sound mode."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                UPDATE user_settings
                SET sound_mode = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                """,
                (sound_mode, user_id),
            )
            await db.commit()

    async def update_user_location(self, user_id: int, lat: float, lon: float, location_name: str):
        """Updates user selected coordinates and location name."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                UPDATE user_settings
                SET latitude = ?, longitude = ?, location_name = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                """,
                (lat, lon, location_name, user_id),
            )
            await db.commit()

    async def log_sonification(self, user_id: int, sound_type: str, params: Dict[str, Any], audio_path: str):
        """Logs a generated audio sonification event."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO sonification_logs (user_id, sound_type, parameters_json, audio_filename)
                VALUES (?, ?, ?, ?)
                """,
                (user_id, sound_type, json.dumps(params), audio_path),
            )
            await db.commit()


# Singleton database instance
db_manager = DatabaseManager()
