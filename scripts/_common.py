#!/usr/bin/env python3
# Gemeinsame Helfer fuer die Bau-Skripte unter scripts/. Wird per `import _common` genutzt
# (Python haengt beim Aufruf `python3 scripts/xy.py` automatisch scripts/ an sys.path).
#
# Shared helpers for the build scripts in scripts/. Imported via `import _common`
# (Python automatically puts the script's own directory on sys.path).
import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("LIVEMAP_DATA_DIR", str(ROOT / "data")))
CACHE_DIR = Path(os.environ.get("LIVEMAP_CACHE_DIR", str(ROOT / ".cache")))

# scunpacked-data: community-maintained extraction of the Star Citizen game data files (datamine),
# updated after every game patch. https://github.com/StarCitizenWiki/scunpacked-data
SCU_RAW = "https://raw.githubusercontent.com/StarCitizenWiki/scunpacked-data/master/"
SCU_REPO_URL = "https://github.com/StarCitizenWiki/scunpacked-data"
SCU_REPO_DIR = Path(os.environ.get("SCU_REPO", str(CACHE_DIR / "scunpacked-data")))

# UEX Corp: public, read-only game-economy API (locations, terminals; live prices are fetched
# directly by the frontend at runtime). No API key needed for these read endpoints.
# https://uexcorp.space/api/
UEX_API = "https://api.uexcorp.space/2.0/"

UA = {"User-Agent": "LiveMap-OSS/1.0 (+https://github.com/; open-source Star Citizen fan map, "
                     "siehe/see CREDITS.md)"}

# Optionale deutsche Community-Uebersetzung (CC BY-NC-SA 4.0), Standard: AUS.
# Optional German community translation (CC BY-NC-SA 4.0), default: OFF.
# Einschalten / enable with: env LIVEMAP_DE=1  oder/or  --with-de
# Quelle / source: https://github.com/rjcncpt/StarCitizen-Deutsch-INI (siehe CREDITS.md)
DE_INI_URL = "https://raw.githubusercontent.com/rjcncpt/StarCitizen-Deutsch-INI/main/live/global.ini"
DE_INI_CACHE = CACHE_DIR / "StarCitizen-Deutsch-INI" / "global.ini"
WITH_DE = os.environ.get("LIVEMAP_DE", "0") == "1" or "--with-de" in sys.argv


def cli_path(default):
    """Erstes Nicht-Flag-Argument als Zielpfad, sonst default. Flags wie --with-de stoeren nicht.
    First non-flag CLI argument as target path, else default. Flags like --with-de don't interfere."""
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    return Path(args[0]) if args else Path(default)


def ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def get(url, data=None, timeout=120):
    req = urllib.request.Request(
        url,
        headers=dict(UA, **({"Content-Type": "application/json"} if data else {})),
        data=data,
        method="POST" if data else "GET",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def write_json(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)


def load_de_translations(en_labels):
    """Baut die EN->DE-Uebersetzungstabelle aus der gecachten StarCitizen-Deutsch-INI.
    Ruft der Aufrufer nur, wenn WITH_DE wahr ist. Laedt die INI hoechstens einmal (Cache in .cache/).

    Builds the EN->DE translation table from the cached StarCitizen-Deutsch-INI file.
    Only call this when WITH_DE is true. Downloads the INI at most once (cached under .cache/)."""
    en2de = {}
    try:
        DE_INI_CACHE.parent.mkdir(parents=True, exist_ok=True)
        if not DE_INI_CACHE.exists():
            req = urllib.request.Request(DE_INI_URL, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r:
                DE_INI_CACHE.write_bytes(r.read())
        raw = DE_INI_CACHE.read_text(encoding="utf-8-sig")
        de = dict(l.split("=", 1) for l in raw.splitlines() if "=" in l)
        for k, v in en_labels.items():
            t = (v or "").strip()
            g = (de.get(k) or "").strip()
            if t and g and g != t and t not in en2de:
                en2de[t] = g
    except Exception as ex:
        print("WARNUNG/WARNING: deutsche Texte nicht geladen / German texts not loaded:", ex, file=sys.stderr)
    return en2de
