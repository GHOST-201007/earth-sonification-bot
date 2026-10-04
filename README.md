# 🌍 EARTH SONIFICATION BOT — NASA Space Apps Challenge

[![NASA Space Apps Challenge](https://img.shields.io/badge/NASA%20Space%20Apps-Earth%20Sonification-blue.svg)](https://www.spaceappschallenge.org/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-brightgreen.svg)](https://python.org)
[![Audio Synthesis](https://img.shields.io/badge/Audio-Pure%20DSP%20Synthesis-orange.svg)]()
[![Tests](https://img.shields.io/badge/Tests-18%20Passed-success.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **“Earth data is everywhere. But not everyone can see data. What if we could HEAR it?”**  
> _“Yer haqidagi ma’lumotlarni nafaqat ko‘ring — ularni eshiting.”_

---

## 🌟 Loyiha haqida (Project Overview)

**Earth Sonification Bot** — bu NASA va ochiq ilmiy platformalardan (NASA POWER, Sentinel-6 / Jason-3 Satellite Altimetry, Open-Meteo) Yer haqidagi real ma'lumotlarni to‘plab, ularni inson qulog‘i idrok eta oladigan **musiqiy parametrlar va akustik to‘lqinlarga (Sonification)** aylantirib beruvchi Telegram bot.

Oddiy raqamlar yoki grafiklar o‘rniga, bot sayyoramizning holatini **ovoz orqali his qilish** imkonini yaratadi:
```
🌍 REAL EARTH DATA ➔ 🧠 DATA ANALYSIS ➔ 🎵 SONIFICATION MAPPING ➔ 🎧 AUDITORY EXPERIENCE
```

---

## 🎵 Sonifikatsiya Mantig‘i (Sonification Engine)

| Ko‘rsatkich | Ma'lumot manbai | Tovush parametri | Musiqiy ma'nosi |
|---|---|---|---|
| **🌡 Harorat (Temperature)** | Open-Meteo & NASA POWER | **Pitch (Balandlik) & Ritm** | Harorat qancha yuqori bo‘lsa, nota shuncha baland (C2 ➔ C6) va jo‘shqin yangraydi. Sovuq iqlimda — chuqur basli dron. |
| **🌊 Dengiz sathi (Sea Level)** | NASA Satellite Altimetry (Sentinel-6, Jason-3) | **Glissando (Chastota ko‘tarilishi)** | Global okean sathi yiliga +3.9 mm ga ko‘tarilayotgani sababli, tovush pastki okean to‘lqinidan yuqoriga qarab siljiydi. |
| **☁️ Bulutlilik (Cloud Cover)** | Open-Meteo Satellite Cloudiness | **Garmonik zichlik & Shimmer** | 0–20%: Toza qo‘ng‘iroq sadosi (Chime). 80–100%: Zich, qalin, ko‘p qatlamli atmosfera akkordi va tezkor pulsatsiya. |
| **🌍 Earth Symphony** | Barcha ma'lumotlar uyg‘unligi | **Polifonik 3 qatlamli simfoniya** | 1-qatlam: Okean basi; 2-qatlam: Harorat melodiyasi; 3-qatlam: Atmosfera havodor akkordi. |

---

## 🏗 Arxitektura (Project Architecture)

```
earth-sonification-bot/
│
├── bot/                       # Telegram Bot Layer
│   ├── handlers/              # Command & Button Handlers
│   │   ├── start.py           # /start & Welcome message
│   │   ├── temperature.py     # /temperature handler & audio sender
│   │   ├── sea_level.py       # /sea_level handler & glissando sender
│   │   ├── clouds.py          # /clouds handler & ambient pad sender
│   │   ├── data_overview.py   # /data handler & composite overview
│   │   ├── earth_sound.py     # /earth_sound master composite composer
│   │   ├── location.py        # /location presets & GPS location
│   │   └── help_about.py      # /help & /about project storytelling
│   ├── keyboards/             # Intuitive Navigation
│   │   ├── reply.py           # Persistent quick menu buttons
│   │   └── inline.py          # Interactive action buttons
│   └── bot.py                 # Bot Application Builder & Error Router
│
├── data/                      # Data Acquisition Layer
│   ├── base.py                # Abstract Fetcher, Retry & Cache Logic
│   ├── temperature.py         # Open-Meteo & NASA Temperature Provider
│   ├── sea_level.py           # NASA Satellite Altimetry Provider
│   ├── clouds.py              # Satellite Cloudiness Provider
│   └── data_aggregator.py     # Parallel Multi-Dataset Aggregator
│
├── sonification/              # Audio Signal Processing & DSP Engine
│   ├── synthesizer.py         # Pure DSP Synthesizer, Harmonics, ADSR, WAV Export
│   ├── temperature_sound.py   # Temperature to Frequency Mapping
│   ├── sea_level_sound.py     # Pitch Sweeps & Oceanic Swell Modulation
│   ├── cloud_sound.py         # Harmonic Density & Airy Pads
│   ├── earth_sound.py         # Master Multitrack Earth Symphony Composer
│   └── engine.py              # Central Sonification Dispatcher
│
├── database/                  # Storage & Caching Layer
│   ├── models.py              # Dataclasses & SQLite Schemas
│   └── db.py                  # Asynchronous SQLite Database Manager
│
├── tests/                     # Automated Test Suite (18 tests)
│   ├── test_sonification.py
│   ├── test_data_fetchers.py
│   ├── test_database.py
│   └── test_resilience_and_handlers.py
│
├── config.py                  # Global Configuration & Environment Loader
├── main.py                    # Application Entrypoint & Startup Loop
├── requirements.txt           # Python Dependencies
├── .env.example               # Environment Variables Template
└── .gitignore                 # Protected Secrets & Build Caches
```

---

## 🚀 Ishga Tushirish (Quick Start)

### 1. Repositoryni tayyorlash
```bash
git clone <repository_url>
cd "EARTH SONIFICATION BOT"
```

### 2. Virtual Environment yaratish va paketlarni o‘rnatish
```bash
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. `.env` faylini sozlash
`.env.example` faylidan nusxa oling va bot tokeningizni kiriting:
```bash
cp .env.example .env
```
`.env` fayli ichiga [@BotFather](https://t.me/BotFather) dan olingan bot tokeningizni yozing:
```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
NASA_API_KEY=DEMO_KEY
CACHE_TTL_WEATHER=900
CACHE_TTL_SEA_LEVEL=86400
```

### 4. Botni ishga tushirish
```bash
python main.py
```

---

## 🧪 Testlarni Ishga Tushirish (Running Tests)

Loyiha to‘liq avtomatlashtirilgan unit va integration testlar bilan ta'minlangan (18 ta test):
```bash
pytest -v
```

---

## 🤖 Telegram Bot Buyruqlari (Commands)

| Buyruq | Tavsif |
|---|---|
| `/start` | Botni ishga tushirish, xush kelibsiz xabari va asosiy tugmalar |
| `/temperature` | Real vaqt harorati va nota balandligi (Pitch) audiosi |
| `/sea_level` | Global dengiz sathining o‘zgarish trendi va ko‘tariluvchi ton |
| `/clouds` | Bulutlilik foizi va havodor ambient pad tovushi |
| `/data` | Barcha ko‘rsatkichlarning jamlangan holati |
| `/earth_sound` | Harorat, okean va bulutlarning birlashtirilgan yagona simfoniyasi |
| `/location` | Hududni o‘zgartirish (Global, O‘zbekiston, Ekvator, Arktika yoki GPS) |
| `/about` | NASA Space Apps loyiha hikoyasi va ilmiy metodologiya |
| `/help` | Botdan foydalanish bo‘yicha to‘liq qo‘llanma |

---

## 💡 Ilmiy Ma'lumot Manbalari (Data Sources)
- **NASA Earth Science Data Systems (ESDS)**: [earthdata.nasa.gov](https://earthdata.nasa.gov/)
- **NASA Sea Level Change**: [sealevel.nasa.gov](https://sealevel.nasa.gov/) (Satellite Altimetry)
- **Open-Meteo Global Weather API**: WMO & NOAA global ob-havo modellari
- **Copernicus Climate Change Service (C3S)**: Okean va atmosfera kuzatuvlari

---

## 👥 Mualliflar va Litsenziya
Ushbu loyiha **NASA Space Apps Challenge 2026** doirasida ochiq fan va ta'lim maqsadida ishlab chiqilgan.  
Litsenziya: **MIT License**.
