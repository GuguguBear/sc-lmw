# Turn a log label into words the window can show.
# Chinese modes use the official Chinese name. English and German use the
# official English name, including when the game client wrote Chinese.
# A raw item id never stays on screen. A name is kept whole when only part of it matches.

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
GLOSS = re.compile(r"([^\s()（）]*[\u4e00-\u9fff][^\s()（）]*)\s*[（(]([A-Za-z][^()（）]*)[）)]")
MARK = re.compile(r"Mk\.?\s*[IVX0-9]+", re.I)
DUP = re.compile(r"([^\s()（）]{1,48})\s*[（(]\1[）)]")
ITEM_MAKER = {"grin": "Greycat Industrial", "shin": "Shubin Interstellar"}
HANT_MAKER = {
    "AEGS": "宙斯盾", "ANVL": "鐵砧", "DRAK": "德雷克", "ORIG": "起源",
    "MISC": "武藏", "CRUS": "十字軍", "CNOU": "聯合", "KRIG": "克魯格",
    "MRAI": "未來", "GRIN": "灰貓", "GAMA": "蓋塔克", "BANU": "巴努",
    "ESPR": "埃斯佩里亞",
}

_PACK = None
_INDEX = None
_REV = None
_CACHE = {}
_CJK_RUN = re.compile(r"[\u4e00-\u9fff]+")
_CONN = set("的上之于")


def _read_pack(path):
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}, {}, {}
    if not isinstance(raw, dict):
        return {}, {}, {}
    hans = raw.get("hans") if isinstance(raw.get("hans"), dict) else {}
    hant = raw.get("hant") if isinstance(raw.get("hant"), dict) else {}
    rev = raw.get("rev") if isinstance(raw.get("rev"), dict) else {}
    return hans, hant, rev


def _name_key(key):
    text = " ".join(str(key or "").split())
    if not text or len(text) > 48 or len(text.split()) > 6:
        return ""
    if text[0].islower() or "~" in text or any(ch in text for ch in ".?!"):
        return ""
    return text


def _better(old, new):
    if not old:
        return new

    def rank(text):
        return (len(text.replace(" ", "")), -text.count(" "), len(text), text.lower())

    return new if rank(new) < rank(old) else old


def _remember(rev, value, key):
    chosen = _name_key(key)
    if not chosen or not isinstance(value, str):
        return
    text = " ".join(value.split())
    cjk = sum(1 for ch in text if "\u4e00" <= ch <= "\u9fff")
    if cjk < 2 or len(text) > 32 or any(ch in text for ch in "。！？?!"):
        return
    rev[text] = _better(rev.get(text, ""), chosen)


def _load():
    global _PACK, _INDEX, _REV
    if _PACK is not None:
        return
    here = Path(__file__).resolve().parent
    bundled = Path(getattr(__import__("sys"), "_MEIPASS", here))
    candidates = [
        here / "names-pack.json",
        bundled / "names-pack.json",
        here.parent / "data" / "loc.json",
        here / "data" / "loc.json",
        bundled.parent / "data" / "loc.json",
    ]
    hans, hant = {}, {}
    rev = {}
    seen = set()
    for path in candidates:
        if path in seen or not path.is_file():
            continue
        seen.add(path)
        block_h, block_t, block_r = _read_pack(path)
        hans.update(block_h)
        hant.update(block_t)
        for zh, en in block_r.items():
            if isinstance(zh, str) and isinstance(en, str) and zh not in rev:
                rev[zh] = en
    for table in (hans, hant):
        for key, value in table.items():
            _remember(rev, value, key)
    _PACK = {"hans": hans, "hant": hant}
    _REV = rev
    _INDEX = {}
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


def _ungloss(text):
    def repl(match):
        inner = " ".join(match.group(2).split())
        if MARK.fullmatch(inner):
            return match.group(0)
        return match.group(1)

    return DUP.sub(r"\1", GLOSS.sub(repl, text))


def _gloss_en(text):
    def repl(match):
        inner = " ".join(match.group(2).split())
        if MARK.fullmatch(inner) or not re.search(r"[A-Za-z]", inner):
            return match.group(0)
        return inner

    return GLOSS.sub(repl, text)


def _segment(run):
    parts = []
    index = 0
    size = len(run)
    while index < size:
        if run[index] in _CONN and parts and any(ch not in _CONN for ch in run[index + 1:]):
            index += 1
            continue
        found = ""
        take = 0
        for length in range(min(32, size - index), 1, -1):
            hit = _REV.get(run[index:index + length])
            if hit:
                found = hit
                take = length
                break
        if not take:
            return ""
        parts.append(found)
        index += take
    return " ".join(parts)


def _from_zh(text):
    _load()
    glossed = _gloss_en(text)
    exact = _REV.get(" ".join(glossed.split()))
    if exact:
        return exact
    runs = list(_CJK_RUN.finditer(glossed))
    if not runs:
        return glossed
    out = []
    cursor = 0
    for match in runs:
        spoken = _segment(match.group(0))
        if not spoken:
            return glossed
        out.append(glossed[cursor:match.start()])
        out.append(spoken)
        cursor = match.end()
    out.append(glossed[cursor:])
    return "".join(out)


def speak(lang, text):
    raw = " ".join(str(text or "").split())
    if not raw:
        return ""
    key = (lang or "en", raw)
    cached = _CACHE.get(key)
    if cached is not None:
        return cached
    if lang in ("en", "de"):
        shown = _from_zh(raw)
        _CACHE[key] = shown
        return shown
    zh = lang in ("zh-Hans", "zh-Hant")
    if zh:
        raw = _ungloss(raw)

    def code_sub(match):
        phrase = _phrase(match.group(0))
        return _resolve(phrase, lang) or phrase

    folded = CODE_TOKEN.sub(code_sub, raw)
    shown = SPAN.sub(lambda match: _cover(match.group(0), lang), folded)
    if zh:
        shown = _ungloss(shown)
    _CACHE[key] = shown
    return shown
