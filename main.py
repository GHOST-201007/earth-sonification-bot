"""
Main entry point for Earth Sonification Telegram Bot.
NASA Space Apps Challenge.
"""

import sys
import logging
import asyncio
from config import Config
from database.db import db_manager
from bot.bot import create_bot_application

# Ensure UTF-8 output encoding across Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Configure logging
logging.basicConfig(
    format="%(asctime)s - [%(name)s] - %(levelname)s - %(message)s",
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("EarthSonificationBot")


async def main():
    """Main async startup routine."""
    print("=" * 60)
    print("🚀 EARTH SONIFICATION BOT — NASA SPACE APPS CHALLENGE")
    print("✨ “Yer haqidagi ma’lumotlarni nafaqat ko‘ring — ularni eshiting.”")
    print("=" * 60)

    # 1. Initialize configuration & folders
    Config.ensure_directories()
    logger.info("Configuration loaded. Audio directory: %s", Config.AUDIO_OUTPUT_DIR)

    # 2. Initialize Database & Cache
    logger.info("Initializing SQLite database & cache tables...")
    await db_manager.initialize()

    # 3. Check Telegram Token
    if not Config.BOT_TOKEN or Config.BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN_HERE":
        logger.warning(
            "\n" + "!" * 60 + "\n"
            "⚠️  BOT_TOKEN is not configured!\n"
            "1. Copy '.env.example' to '.env'\n"
            "2. Add your Telegram Bot Token from @BotFather in '.env'\n"
            "3. Re-run: python main.py\n"
            + "!" * 60 + "\n"
        )
        # Note: We don't crash immediately so tests and modules can still run smoothly
        return

    # 4. Build and start Telegram Bot polling
    logger.info("Building Telegram application...")
    app = create_bot_application()

    logger.info("Starting Telegram Bot Polling (Ready to receive messages)...")
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)

    # 5. Start a dummy web server so Render doesn't crash (Port bind timeout)
    import os
    from aiohttp import web
    
    async def handle_ping(request):
        return web.Response(text="EARTH SONIFICATION BOT IS RUNNING! NASA Space Apps 2026")

    runner = None
    try:
        port = int(os.environ.get("PORT", 10000))
        web_app = web.Application()
        web_app.router.add_get("/", handle_ping)
        runner = web.AppRunner(web_app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", port)
        await site.start()
        logger.info(f"Dummy web server listening on port {port} to satisfy Render.")
    except Exception as e:
        logger.error(f"Failed to start dummy server: {e}")

    # Keep running until interrupted
    try:
        while True:
            await asyncio.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Stopping bot gracefully...")
    finally:
        if runner:
            await runner.cleanup()
        await app.updater.stop()
        await app.stop()
        await app.shutdown()
        logger.info("Bot shut down successfully.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
