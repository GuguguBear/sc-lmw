# Turn a log label into words the window can show.
# zh-Hans and zh-Hant use the official Chinese name from data/loc.json.
# English and German keep English. A raw item id never stays on screen.

import json
import re
from pathlib import Path

ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
MAKERS = (
    "Aegis", "Anvil", "Crusader", "MISC", "Origin", "RSI", "Drake", "Banu",
    "Aopoa", "Tumbril", "Greycat", "Kruger", "Consolidated", "Esperia", "Gatac", "Mirai",
)
# A lone token with one of these spellings is a fragment, not a name.
DENY = {"MAX", "MISC", "RSI", "CO", "GS", "Mk", "PTV", "STV", "ROC", "UTV", "The", "This", "From"}
CODE_TOKEN = re.compile(r"\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+){1,}\b")
SPAN = re.compile(r"[A-Za-z][A-Za-z0-9'+.-]*(?:[ /-]+[A-Za-z0-9][A-Za-z0-9'+.-]*)*")
ITEM_MAKER = {"grin": "Greycat Industrial", "shin": "Shubin Interstellar"}
HANT_MAKER = {
    "AEGS": "宙斯盾", "ANVL": "鐵砧", "DRAK": "德雷克", "ORIG": "起源",
    "MISC": "武藏", "CRUS": "十字軍", "CNOU": "聯合", "KRIG": "克魯格",
    "MRAI": "未來", "GRIN": "灰貓", "GAMA": "蓋塔克", "BANU": "巴努",
    "ESPR": "埃斯佩里亞",
}

_PACK = None
_INDEX = None
_CACHE = {}


def _load():
    global _PACK, _INDEX
    if _PACK is not None:
        return
    _PACK = {"hans": {}, "hant": {}}
    _INDEX = {}
    here = Path(__file__).resolve().parent
    candidates = [
        here.parent / "data" / "loc.json",
        here / "data" / "loc.json",
        Path(getattr(__import__("sys"), "_MEIPASS", here)).parent / "data" / "loc.json",
    ]
    path = next((item for item in candidates if item.is_file()), None)
    if path is None:
        return
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return
    hans = raw.get("hans") if isinstance(raw.get("hans"), dict) else {}
    hant = raw.get("hant") if isinstance(raw.get("hant"), dict) else {}
    _PACK = {"hans": hans, "hant": hant}
    for key in hans:
        if not key or len(key) > 48 or "\n" in key or ". " in key:
            continue
        if len(key.split()) > 6:
            continue
        _INDEX.setdefault(key.lower(), []).append(key)
    for keys in _INDEX.values():
        keys.sort(key=len)


def _find_key(text):
    _load()
    hans = _PACK["hans"]
    if text in hans:
        return text
    hits = _INDEX.get(text.lower()) if _INDEX else None
    return hits[0] if hits else ""


def _forms(name):
    seen = []

    def add(value):
        value = " ".join(str(value or "").split())
        if value and value not in seen:
            seen.append(value)

    add(name)
    text = name
    text = re.sub(
        r"\bMk\s*(\d{1,2})\b",
        lambda match: "Mk " + ROMAN[int(match.group(1))] if 0 < int(match.group(1)) < len(ROMAN) else match.group(0),
        text,
        flags=re.I,
    )
    text = re.sub(r"\bHull-([A-E])\b", r"Hull \1", text)
    text = re.sub(r"\bL(\d{1,2})\b", r"L-\1", text)
    text = text.replace("F7CM", "F7C-M").replace("F7CS", "F7C-S").replace("F7CR", "F7C-R")
    text = re.sub(r"\bm(\d+)\b", r"M\1", text)
    text = re.sub(r"\bMax\b", "MAX", text)
    add(text)
    hornet = re.fullmatch(r"(Anvil) Hornet (F7[A-Za-z0-9-]+) (Mk [IVX]+)", text)
    if hornet:
        add("%s %s Hornet %s" % (hornet.group(1), hornet.group(2), hornet.group(3)))
        if hornet.group(2) == "F7C-M":
            add("Anvil F7C-M Super Hornet %s" % hornet.group(3))
    if "C8R Pisces" in text and "Rescue" not in text:
        add(text.replace("C8R Pisces", "C8R Pisces Rescue"))
    if re.search(r"\bStar Runner\b", text):
        add("Mercury Star Runner")
    if text.endswith(" GS"):
        add(text[:-3].strip())
    if text.endswith(" Collector Military"):
        add(text[: -len(" Collector Military")].strip())
    for maker in MAKERS:
        if text.startswith(maker + " "):
            add(text[len(maker) + 1:])
    return seen


def _phrase(code):
    low = code.lower()
    laser = re.fullmatch(r"mining_laser_[a-z0-9]+_([a-z]+)_s(\d+)", low)
    if laser:
        return "%s-S%s Mining Laser" % (laser.group(1).capitalize(), laser.group(2))
    gadget = re.fullmatch(r"mining_gadget_([a-z0-9]+)_([a-z0-9]+)", low)
    if gadget:
        product = code.split("_")[-1]
        maker = ITEM_MAKER.get(gadget.group(1), "")
        return (maker + " " + product).strip()
    drink = re.fullmatch(r"drink_bottle_cruz_\d+_([a-z]+)(?:_[a-z])?", low)
    if drink:
        return "CRUZ " + drink.group(1).capitalize()
    if "healing" in low:
        return "MedPen"
    if low.endswith("_mag") or "_mag_" in low:
        return "Weapon Magazine"
    if "rdot" in low:
        return "RD-1 Jaeger (1x Red Dot)" if "x1" in low else "Red dot sight"
    if "fuse" in low:
        return "Fuse"
    drop = {
        "mining", "gadget", "drink", "bottle", "subitem", "consumable", "none",
        "item", "laser", "optics", "multi", "standard", "crlf", "nvtc",
    }
    words = []
    for part in code.split("_"):
        if not part or part.isdigit() or part.lower() in drop:
            continue
        words.append(ITEM_MAKER.get(part.lower(), part if part[:1].isupper() else part.capitalize()))
    return " ".join(words) or code.replace("_", " ")


def _resolve(text, lang):
    zh = "hant" if lang == "zh-Hant" else "hans" if lang == "zh-Hans" else ""
    for form in _forms(text):
        key = _find_key(form)
        if not key:
            continue
        if not zh:
            return key
        value = _PACK[zh].get(key) or _PACK["hans"].get(key) or ""
        if value and value != key and len(value) <= 48:
            return _polish(value, lang)
    return ""


def _polish(value, lang):
    if lang != "zh-Hant":
        return value
    head, _, rest = value.partition(" ")
    name = HANT_MAKER.get(head)
    if not name:
        return value
    return name if not rest else name + " " + rest


def _cover(span, lang):
    words = span.split()
    count = len(words)
    index = 0
    out = []
    while index < count:
        chosen = 0
        spoken = ""
        for length in range(min(6, count - index), 0, -1):
            chunk = " ".join(words[index:index + length])
            if length == 1 and (chunk in DENY or len(chunk) < 4):
                continue
            hit = _resolve(chunk, lang)
            if hit:
                chosen = length
                spoken = hit
                break
        if chosen:
            out.append(spoken)
            index += chosen
        else:
            out.append(words[index])
            index += 1
    return " ".join(out)


def speak(lang, text):
    raw = " ".join(str(text or "").split())
    if not raw:
        return ""
    key = (lang or "en", raw)
    cached = _CACHE.get(key)
    if cached is not None:
        return cached

    def code_sub(match):
        phrase = _phrase(match.group(0))
        return _resolve(phrase, lang) or phrase

    folded = CODE_TOKEN.sub(code_sub, raw)
    shown = SPAN.sub(lambda match: _cover(match.group(0), lang), folded)
    _CACHE[key] = shown
    return shown
