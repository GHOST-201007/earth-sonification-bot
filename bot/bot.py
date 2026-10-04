"""
Telegram Bot Application Setup and Dispatcher Configuration with Multi-Language Support.
NASA Space Apps Challenge - Earth Sonification Bot.
"""

import logging
from telegram import Update, BotCommand, MenuButtonWebApp, WebAppInfo
from telegram.ext import (
    Application,
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    ContextTypes,
)
from config import Config
from database.db import db_manager
from localization.i18n import i18n
from bot.handlers.start import start_handler
from bot.handlers.temperature import temperature_handler
from bot.handlers.sea_level import sea_level_handler
from bot.handlers.clouds import clouds_handler
from bot.handlers.data_overview import data_overview_handler
from bot.handlers.earth_sound import earth_sound_handler
from bot.handlers.location import location_menu_handler, set_location_callback_handler, user_location_message_handler
from bot.handlers.language import language_menu_handler, set_language_callback_handler
from bot.handlers.help_about import help_handler, about_handler

logger = logging.getLogger(__name__)


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Global error handler for unhandled exceptions."""
    logger.error("Exception while handling an update: %s", context.error, exc_info=context.error)
    if isinstance(update, Update) and update.effective_message:
        try:
            lang = "uz"
            if update.effective_user:
                user_rec = await db_manager.get_or_create_user(update.effective_user.id)
                lang = user_rec.language

            err_msg = i18n.t("err_generic", lang)
            await update.effective_message.reply_text(err_msg, parse_mode="Markdown")
        except Exception as e:
            logger.error("Failed to send error notification: %s", e)


async def router_callback_query_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Central router for all interactive inline callback queries."""
    query = update.callback_query
    data = query.data

    if data.startswith("set_lang:"):
        await set_language_callback_handler(update, context)
    elif data.startswith("set_loc:"):
        await set_location_callback_handler(update, context)
    elif data == "action:sound:temperature":
        await temperature_handler(update, context)
    elif data == "action:sound:sea_level":
        await sea_level_handler(update, context)
    elif data == "action:sound:clouds":
        await clouds_handler(update, context)
    elif data == "action:sound:earth":
        await earth_sound_handler(update, context)
    elif data == "action:refresh:temperature":
        await temperature_handler(update, context, force_refresh=True)
    elif data == "action:refresh:sea_level":
        await sea_level_handler(update, context, force_refresh=True)
    elif data == "action:refresh:clouds":
        await clouds_handler(update, context, force_refresh=True)
    elif data == "action:refresh:all_data":
        await data_overview_handler(update, context, force_refresh=True)
    elif data == "nav:temperature":
        await temperature_handler(update, context)
    elif data == "nav:sea_level":
        await sea_level_handler(update, context)
    elif data == "nav:clouds":
        await clouds_handler(update, context)
    elif data == "nav:all_data":
        await data_overview_handler(update, context)
    elif data == "nav:location":
        await location_menu_handler(update, context)
    elif data == "nav:language":
        await language_menu_handler(update, context)
    elif data == "nav:about":
        await about_handler(update, context)
    elif data == "nav:start":
        await start_handler(update, context)
    else:
        await query.answer()


async def post_init(application: Application) -> None:
    """Register official Telegram Bot commands menu and WebApp menu button."""
    commands = [
        BotCommand("start", "🚀 Start / Restart Bot & Main Menu"),
        BotCommand("temperature", "🌡 Earth Temperature & Pitch Sonification"),
        BotCommand("sea_level", "🌊 Sea Level Trend & Glissando Sweep"),
        BotCommand("clouds", "☁️ Cloud Cover & Ambient Pad Sound"),
        BotCommand("data", "📊 Complete Earth Data Overview"),
        BotCommand("earth_sound", "🌍 Master Earth Symphony Audio"),
        BotCommand("location", "📍 Change Location (Global / Uzbek / GPS)"),
        BotCommand("language", "🌐 Switch Language (UZ / RU / EN)"),
        BotCommand("about", "ℹ️ NASA Space Apps Project Story"),
        BotCommand("help", "❓ Help & Command Manual"),
    ]
    from telegram import BotCommandScopeAllPrivateChats, BotCommandScopeDefault
    try:
        await application.bot.set_my_commands(commands, scope=BotCommandScopeDefault())
        await application.bot.set_my_commands(commands, scope=BotCommandScopeAllPrivateChats())
        logger.info("Successfully registered official Telegram bot commands menu.")
    except Exception as e:
        logger.error("Failed to set bot commands menu: %s", e)

    try:
        await application.bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="Open App",
                web_app=WebAppInfo(url=Config.WEBAPP_URL)
            )
        )
        logger.info("Successfully set bot chat menu button for Web App.")
    except Exception as e:
        logger.error("Failed to set chat menu button: %s", e)


def create_bot_application() -> Application:
    """Builds and configures the Telegram bot application instance."""
    if not Config.BOT_TOKEN:
        logger.warning("BOT_TOKEN is not set in environment or .env file!")

    app = ApplicationBuilder().token(Config.BOT_TOKEN or "DUMMY_TOKEN").post_init(post_init).build()

    # 1. Command Handlers
    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("help", help_handler))
    app.add_handler(CommandHandler("language", language_menu_handler))
    app.add_handler(CommandHandler("temperature", temperature_handler))
    app.add_handler(CommandHandler("sea_level", sea_level_handler))
    app.add_handler(CommandHandler("clouds", clouds_handler))
    app.add_handler(CommandHandler("data", data_overview_handler))
    app.add_handler(CommandHandler("earth_sound", earth_sound_handler))
    app.add_handler(CommandHandler("location", location_menu_handler))
    app.add_handler(CommandHandler("about", about_handler))

    # 2. Text Message Handlers (Regex matching for 3 languages)
    # Temperature (🌡 Harorat / 🌡 Temp...)
    app.add_handler(MessageHandler(filters.Regex(r"^🌡"), temperature_handler))
    # Sea Level (🌊 Dengiz... / 🌊 Sea... / 🌊 Уровень...)
    app.add_handler(MessageHandler(filters.Regex(r"^🌊"), sea_level_handler))
    # Cloud Cover (☁️ Bulut... / ☁️ Cloud... / ☁️ Облач...)
    app.add_handler(MessageHandler(filters.Regex(r"^☁️"), clouds_handler))
    # All Data (📊 Barcha... / 📊 All... / 📊 Все...)
    app.add_handler(MessageHandler(filters.Regex(r"^📊"), data_overview_handler))
    # Earth Sound (🌍 Earth Sound / 🌍 Звук Земли)
    app.add_handler(MessageHandler(filters.Regex(r"^🌍"), earth_sound_handler))
    # Location (📍 Hudud / 📍 Location / 📍 Локация)
    app.add_handler(MessageHandler(filters.Regex(r"^📍"), location_menu_handler))
    # Settings / Language (⚙️ Sozlamalar / ⚙️ Settings)
    app.add_handler(MessageHandler(filters.Regex(r"^⚙️"), language_menu_handler))
    # About Project (ℹ️ Loyiha... / ℹ️ About... / ℹ️ О проекте)
    app.add_handler(MessageHandler(filters.Regex(r"^ℹ️"), about_handler))
    # Help (❓ Yordam / ❓ Help / ❓ Помощь)
    app.add_handler(MessageHandler(filters.Regex(r"^❓"), help_handler))

    # 3. Location Message Handler (Native GPS coordinate attachment)
    app.add_handler(MessageHandler(filters.LOCATION, user_location_message_handler))

    # 4. Interactive Inline Button Callback Router
    app.add_handler(CallbackQueryHandler(router_callback_query_handler))

    # 5. Global Error Handler
    app.add_error_handler(error_handler)

    return app
