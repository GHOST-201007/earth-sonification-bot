"""
Telegram Bot Backend for Earth Jukebox Mini App.
Built with aiogram 3.x for native Telegram WebApp support.
"""

import os
import json
import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "8676204957:AAErAa8Mwlol47aKe--HZM6pvax43m7za0c")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-domain.com/earth-jukebox")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(Command("start"))
async def start_handler(message: types.Message):
    """Handles /start command and opens Earth Jukebox WebApp."""
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🌍 Earth Jukebox ni ochish",
                    web_app=WebAppInfo(url=WEBAPP_URL),
                )
            ]
        ]
    )
    await message.answer(
        "🎵 *Yer haqidagi ma'lumotlar musiqasi*\n\n"
        "NASA ochiq iqlim ma'lumotlarini musiqa sifatida eshiting!\n"
        "Harorat, dengiz sathi, CO₂ va muzliklar darajasi...",
        parse_mode="Markdown",
        reply_markup=keyboard,
    )


@dp.message(F.web_app_data)
async def webapp_data_handler(message: types.Message):
    """Handles data sent back from Telegram Mini App via tg.sendData()."""
    try:
        data = json.loads(message.web_app_data.data)

        if data.get("action") == "save_session":
            params = data.get("parameters", [])
            years = data.get("yearRange", [1960, 2024])
            await message.answer(
                f"✅ Siz *{years[0]}-{years[1]} yillar* oralig'idagi\n"
                f"*{len(params)} parametr* bo'yicha musiqa eshitdingiz!\n\n"
                f"📊 *Tanlanganlar:* {', '.join(params)}",
                parse_mode="Markdown",
            )
        elif data.get("action") == "share_score":
            score = data.get("score", 100)
            await message.answer(
                f"🎵 Musiqa natijasi: *{score} ball*\n"
                "Do'stlaringizga ulashing!",
                parse_mode="Markdown",
            )
    except Exception as e:
        logger.error("Error processing web_app_data: %s", e)


@dp.inline_query()
async def inline_handler(query: types.InlineQuery):
    """Handles inline sharing queries in Telegram chats."""
    results = [
        types.InlineQueryResultArticle(
            id="1",
            title="Earth Jukebox",
            description="Yer iqlimini musiqa sifatida eshiting",
            input_message_content=types.InputTextMessageContent(
                message_text="🌍 Men *Earth Jukebox* da Yer simfoniyasini eshitdim!\nSen ham sinab ko'r:",
                parse_mode="Markdown",
            ),
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="▶ Ochish",
                            url=WEBAPP_URL,
                        )
                    ]
                ]
            ),
        )
    ]
    await query.answer(results, cache_time=1)


async def main():
    logger.info("Starting Earth Jukebox aiogram 3.x Mini App bot polling...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
