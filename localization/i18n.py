"""
Internationalization (i18n) localization manager for Earth Sonification Bot.
Supports Uzbek (uz), Russian (ru), and English (en).
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

LOCALIZATION_DIR = Path(__file__).resolve().parent


class I18nManager:
    """Manages translations across uz, ru, and en languages."""

    SUPPORTED_LANGUAGES = {"uz": "🇺🇿 O‘zbekcha", "ru": "🇷🇺 Русский", "en": "🇬🇧 English"}
    DEFAULT_LANGUAGE = "uz"

    def __init__(self):
        self.translations: Dict[str, Dict[str, str]] = {}
        self._load_translations()

    def _load_translations(self):
        """Loads json localization files into memory."""
        for lang_code in self.SUPPORTED_LANGUAGES.keys():
            file_path = LOCALIZATION_DIR / f"{lang_code}.json"
            if file_path.exists():
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        self.translations[lang_code] = json.load(f)
                    logger.info("Loaded %d strings for language [%s]", len(self.translations[lang_code]), lang_code)
                except Exception as e:
                    logger.error("Failed to load localization file %s: %s", file_path, e)
                    self.translations[lang_code] = {}
            else:
                logger.warning("Localization file not found: %s", file_path)
                self.translations[lang_code] = {}

    def t(self, key: str, lang: Optional[str] = None, **kwargs) -> str:
        """
        Retrieves formatted localized string for key.
        Fallback order: specified lang -> default lang ('uz') -> English ('en') -> key name.
        """
        target_lang = (lang or self.DEFAULT_LANGUAGE).lower()
        if target_lang not in self.SUPPORTED_LANGUAGES:
            target_lang = self.DEFAULT_LANGUAGE

        lang_dict = self.translations.get(target_lang, {})
        template = lang_dict.get(key)

        # Fallback 1: Default language (uz)
        if template is None and target_lang != self.DEFAULT_LANGUAGE:
            template = self.translations.get(self.DEFAULT_LANGUAGE, {}).get(key)

        # Fallback 2: English (en)
        if template is None and target_lang != "en":
            template = self.translations.get("en", {}).get(key)

        # Fallback 3: Key itself
        if template is None:
            logger.warning("Missing translation key '%s' for language '%s'", key, target_lang)
            return key

        if kwargs:
            try:
                return template.format(**kwargs)
            except KeyError as e:
                logger.error("Formatting error for key '%s' in lang '%s': missing kwarg %s", key, target_lang, e)
                return template

        return template


# Singleton i18n instance
i18n = I18nManager()
