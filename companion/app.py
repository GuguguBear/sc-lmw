# Local place watcher for SC LMW.
# Read companion/README.md before running this. The whole behavior is in this
# file and desk.py. It tails one Game.log that you name, on this computer only,
# and posts the place code to the room you confirm.
# It does not attach to the game, read memory, sniff packets, or change game files.
#
#   Double-click Starfix.exe
#   or: python companion/app.py
#   A window opens. The browser stays closed.
#   127.0.0.1:8780 stays up only so the star map can hand over the room.

import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request

import desk
import history
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

def frozen():
    return bool(getattr(sys, "frozen", False))


BUNDLE = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
DATA = Path(sys.executable).resolve().parent if frozen() else Path(__file__).resolve().parent
ROOT = BUNDLE if frozen() else BUNDLE.parent
RELEASE_API = "https://api.github.com/repos/GuguguBear/sc-lmw/releases/latest"
RELEASE_PAGE = "https://github.com/GuguguBear/sc-lmw/releases"
RELEASE_EXE = "https://github.com/GuguguBear/sc-lmw/releases/download/"


def read_version():
    # companion/VERSION is the number published as the starfix-1.2.3 release.
    for path in (BUNDLE / "VERSION", Path(__file__).resolve().parent / "VERSION"):
        try:
            text = path.read_text(encoding="utf-8").strip()
        except OSError:
            continue
        if re.fullmatch(r"\d+\.\d+\.\d+", text):
            return text
    return "0.0.0"


VERSION = read_version()


def version_tuple(text):
    match = re.fullmatch(r"(?:starfix-)?(\d+)\.(\d+)\.(\d+)", str(text or "").strip())
    if not match:
        return None
    return tuple(int(part) for part in match.groups())
CONFIG = DATA / "config.json"
history.open_store(DATA / "history.jsonl")
HOST = "127.0.0.1"
PORT = 8780
# The star map calls this port from the live site or from a page on this
# computer. Any other website must not read the log path or change the room.
LIVE_ORIGIN = "https://gugugubear.pythonanywhere.com"

TRANS = re.compile(
    r"Transitioning from zone (?P<from_zone>[\w.-]+) in (?P<from_system>[\w.-]+) "
    r"to zone (?P<to_zone>[\w.-]+) in (?P<to_system>[\w.-]+)",
    re.I,
)
CODE = re.compile(r"\b((?:RR|Stanton|Pyro|Nyx|Terra)[A-Za-z0-9_]{2,80})\b")
HINT = re.compile(r"zone|location|quantum|jump", re.I)
GEAR_RE = re.compile(
    r"Attachment\[[^,]+,\s*([A-Za-z0-9_]+),\s*[^\]]+\]\s+Status\[[^\]]+\]\s+Port\[(Armor_[A-Za-z0-9_]+)\]"
)
SHIP_RE = re.compile(
    r"\b((?:AEGS|ANVL|CRUS|MISC|ORIG|RSI|DRAK|BANU|XIAN|TMBL|GRIN|KRIG|CNOU|ESPR|GAMA|VNCL|MRAI)(?:_[A-Za-z][A-Za-z0-9]*)+)_\d{6,}"
)
SELECT_RE = re.compile(r"selected point LOC_RR_S([1-4])_L(\d)\b", re.I)
START_RE = re.compile(r"Projected Start Location is .*?\b(HUR|CRU|ARC|MIC)\s+L(\d)\b", re.I)
ARRIVE_RE = re.compile(r"arrived at final destination", re.I)
# The host id sits on the zone-load line. Startup labels such as shard1 or
# local_shard are this computer's session, not the shared game server.
HOST_RE = re.compile(
    r"\|\s*(?P<host>[A-Za-z0-9_.-]+)\s*\[(?P<host_id>\d{1,20})\]\s*\|\s*Transitioning\b",
    re.I,
)
MAKER_NAME = {
    "AEGS": "Aegis", "ANVL": "Anvil", "CRUS": "Crusader", "MISC": "MISC",
    "ORIG": "Origin", "RSI": "RSI", "DRAK": "Drake", "BANU": "Banu",
    "XIAN": "Aopoa", "TMBL": "Tumbril", "GRIN": "Greycat", "KRIG": "Kruger",
    "CNOU": "Consolidated", "ESPR": "Esperia", "GAMA": "Gatac",
    "VNCL": "Vanduul", "MRAI": "Mirai",
}
BODY_N = {"HUR": "1", "CRU": "2", "ARC": "3", "MIC": "4"}
PORT_ORDER = (
    "Armor_Undersuit", "Armor_Helmet", "Armor_Torso", "Armor_Arms",
    "Armor_Legs", "Armor_Backpack",
)
WORN = {}
WORN_CLS = {}
SHIP = ""
DEST = None
SERVER = ""
TRAVEL = None
LAST_SIG = ""

LOCK = threading.Lock()
STOP = threading.Event()
THREAD = None


def default_log():
    candidates = [
        Path(r"C:\Program Files\Roberts Space Industries\StarCitizen\LIVE\Game.log"),
        Path(r"D:\Program Files\Roberts Space Industries\StarCitizen\LIVE\Game.log"),
        Path(r"D:\Roberts Space Industries\StarCitizen\LIVE\Game.log"),
    ]
    for path in candidates:
        if path.is_file():
            return str(path)
    return str(candidates[0])


def load_config():
    cfg = {
        "apiBase": "https://gugugubear.pythonanywhere.com",
        "room": "",
        "token": "",
        "logPath": default_log(),
        "theme": "compact",
        "lang": "",
    }
    if CONFIG.is_file():
        try:
            saved = json.loads(CONFIG.read_text(encoding="utf-8"))
            if isinstance(saved, dict):
                cfg.update({k: saved[k] for k in cfg if k in saved and isinstance(saved[k], str)})
        except (OSError, json.JSONDecodeError):
            pass
    base = str(cfg.get("apiBase") or "").strip().rstrip("/")
    if base in ("http://127.0.0.1:8770", "http://localhost:8770"):
        cfg["apiBase"] = "https://gugugubear.pythonanywhere.com"
    return cfg


def save_config(cfg):
    CONFIG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")


STATE = {
    "running": False,
    "place": None,
    "sentAt": "",
    "error": "",
    "status": "stopped",
    "offset": 0,
}
PENDING = None
CFG = load_config()


def system_of(code, named=""):
    if named:
        low = named.lower()
        if low in ("stanton", "pyro", "nyx"):
            return named[:1].upper() + named[1:].lower()
    c = (code or "").lower()
    if c.startswith("pyro") or re.match(r"rr_p\d", c):
        return "Pyro"
    if c.startswith("nyx"):
        return "Nyx"
    if c.startswith("stanton") or re.match(r"rr_(hur|cru|arc|mic)", c):
        return "Stanton"
    return ""


def pretty_ship(code):
    parts = code.split("_")
    if "SCItem" in parts:
        parts = parts[: parts.index("SCItem")]
    maker = MAKER_NAME.get(parts[0], parts[0])
    rest = parts[1:]
    if rest and len(rest[-1]) == 1:
        body = " ".join(rest[:-1]) + "-" + rest[-1]
    else:
        body = " ".join(rest)
    return (maker + " " + body).strip()


def pretty_item(code):
    parts = code.split("_")
    while parts and parts[-1].isdigit():
        parts.pop()
    maker = MAKER_NAME.get(parts[0].upper(), parts[0].upper()) if parts else ""
    rest = " ".join(part.capitalize() for part in parts[1:])
    return (maker + " " + rest).strip()


def tidy_place(place):
    if not place:
        return place
    found = re.fullmatch(r"RR_(HUR|CRU|ARC|MIC)_L(\d)", place.get("code") or "", re.I)
    if not found:
        return place
    out = dict(place)
    out["code"] = "RR_%s_L%s" % (found.group(1).upper(), found.group(2))
    out["location"] = "%s-L%s" % (found.group(1).upper(), found.group(2))
    out["system"] = out.get("system") or "Stanton"
    return out


def lagrange_place(body, lag):
    if body in BODY_N:
        num = BODY_N[body]
        name = body
    else:
        num = str(body)
        name = {v: k for k, v in BODY_N.items()}.get(num, "")
    if not name:
        return None
    code = "RR_%s_L%s" % (name, lag)
    return {"code": code, "location": "%s-L%s" % (name, lag), "system": "Stanton"}


def gear_list():
    def row(key):
        item = {"port": key, "name": WORN[key]}
        cls = WORN_CLS.get(key) or ""
        if cls:
            item["cls"] = cls
        return item

    ordered = [row(key) for key in PORT_ORDER if key in WORN]
    ordered.extend(row(key) for key in WORN if key not in PORT_ORDER)
    return ordered[:12]


def host_of(line):
    found = HOST_RE.search(line or "")
    if not found:
        return ""
    return found.group("host_id")


def aim_travel(place):
    if not place:
        return None
    label = place.get("location") or ""
    raw = place.get("code") or ""
    if not label and not raw:
        return None
    return {"mode": "aim", "from": "", "to": label or raw, "to_raw": raw}


def jump_travel(found):
    start = (found.group(1) or "").strip()[:80]
    token = (found.group(2) or "").strip(".,)")
    dest, _kind, code = history.destination(token)
    label = dest or ""
    raw = code or ""
    if not label and not raw:
        return None
    return {"mode": "jump", "from": start, "to": label or raw, "to_raw": raw}


def snapshot(place):
    out = {
        "code": (place or {}).get("code") or "",
        "location": (place or {}).get("location") or "",
        "system": (place or {}).get("system") or "",
        "ship": SHIP,
        "gear": gear_list(),
        "travel": dict(TRAVEL) if TRAVEL else None,
    }
    if SERVER:
        out["server"] = SERVER
    return out


def signature(payload):
    return json.dumps(
        [
            payload.get("code"),
            payload.get("ship"),
            payload.get("gear"),
            payload.get("server"),
            payload.get("travel"),
        ],
        ensure_ascii=False,
        sort_keys=True,
    )


def ingest(line):
    global SHIP, DEST, SERVER, TRAVEL
    text = line or ""
    host = host_of(text)
    if host:
        SERVER = host
    place = tidy_place(parse_line(text))
    if TRANS.search(text):
        TRAVEL = None
    for cls, port in GEAR_RE.findall(text):
        WORN[port] = pretty_item(cls)
        WORN_CLS[port] = cls
    if "CSCItemNavigation::" in text and ("OnPlayer" in text or "OnQuantumDriveArrived" in text):
        found = SHIP_RE.search(text)
        if found:
            SHIP = pretty_ship(found.group(1))
    selected = SELECT_RE.search(text)
    if selected:
        DEST = lagrange_place(selected.group(1), selected.group(2))
        aimed = aim_travel(DEST)
        if aimed:
            TRAVEL = aimed
    started = START_RE.search(text)
    if started:
        place = lagrange_place(started.group(1).upper(), started.group(2))
    jumped = history.JUMP_RE.search(text)
    if jumped:
        nxt = jump_travel(jumped)
        if nxt:
            TRAVEL = nxt
    if ARRIVE_RE.search(text) and DEST:
        place = DEST
        TRAVEL = None
    return place


def parse_line(line):
    text = line or ""
    found = TRANS.search(text)
    host = host_of(text)
    if found:
        code = found.group("to_zone")
        system = system_of(code, found.group("to_system"))
        out = {"code": code, "location": code, "system": system}
        if host:
            out["server"] = host
        return out
    if not HINT.search(text):
        return None
    codes = CODE.findall(text)
    if not codes:
        return None
    code = codes[-1]
    out = {"code": code, "location": code, "system": system_of(code)}
    if host:
        out["server"] = host
    return out


def log_kind(path):
    if not path:
        return "missing"
    file = Path(path)
    try:
        if not file.is_file():
            return "missing"
        if file.stat().st_size <= 0:
            return "empty"
    except OSError:
        return "missing"
    return "ok"


def public_state():
    with LOCK:
        place = STATE["place"]
        log_path = CFG["logPath"]
        kind = log_kind(log_path)
        return {
            "apiBase": CFG["apiBase"],
            "room": CFG["room"],
            "tokenSet": bool(CFG["token"]),
            "logPath": log_path,
            "logExists": kind != "missing",
            "logKind": kind,
            "theme": CFG["theme"],
            "pendingRoom": PENDING["room"] if PENDING else "",
            "running": STATE["running"],
            "status": STATE["status"],
            "error": STATE["error"],
            "sentAt": STATE["sentAt"],
            "place": place,
        }


def apply_settings(body):
    theme = body.get("theme") if body.get("theme") in ("classic", "compact", "practical", "chassis", "scifi") else CFG["theme"]
    api = str(body.get("apiBase") or CFG["apiBase"]).strip().rstrip("/")
    if not api.startswith(("http://", "https://")):
        api = CFG["apiBase"]
    room = str(body.get("room") or "").strip().upper()
    token = str(body.get("token") or "").strip()
    with LOCK:
        CFG["apiBase"] = api
        if room:
            CFG["room"] = room
        if token:
            CFG["token"] = token
        if body.get("logPath"):
            CFG["logPath"] = str(body.get("logPath")).strip()
        CFG["theme"] = theme
        save_config(CFG)


def post_place(place):
    room = CFG["room"]
    token = CFG["token"]
    if not room or not token:
        raise RuntimeError("先在星图里点「连到这台电脑」，再回到这里确认")
    url = CFG["apiBase"] + "/api/rooms/" + quote(room) + "/presence"
    raw = json.dumps(place).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=raw,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
            "User-Agent": "sc-lmw-companion",
        },
    )
    with urllib.request.urlopen(req, timeout=8) as resp:
        resp.read()
    with LOCK:
        STATE["place"] = place
        STATE["sentAt"] = time.strftime("%H:%M:%S")
        STATE["error"] = ""
        STATE["status"] = "sent " + place["code"]


def consider(line, send):
    global LAST_SIG
    history.note(line)
    place = ingest(line)
    with LOCK:
        current = STATE.get("place") or {}
    base = place or (current if current.get("code") else None)
    if not base or not base.get("code"):
        if not send:
            with LOCK:
                STATE["place"] = snapshot(base or {})
        return None
    payload = snapshot(base)
    sig = signature(payload)
    if sig == LAST_SIG:
        return payload
    LAST_SIG = sig
    if send:
        post_place(payload)
    else:
        with LOCK:
            STATE["place"] = payload
            STATE["error"] = ""
    return payload


def scan_tail():
    path = Path(CFG["logPath"])
    if not path.is_file():
        with LOCK:
            STATE["error"] = "找不到这份日志"
            STATE["status"] = "no log"
        return None
    data = path.read_bytes()
    text = data[-8_000_000:].decode("utf-8", "replace")
    found = None
    for line in text.splitlines():
        place = ingest(line)
        if place:
            found = place
    payload = snapshot(found or {})
    with LOCK:
        global LAST_SIG
        STATE["offset"] = path.stat().st_size
        STATE["place"] = payload
        LAST_SIG = signature(payload)
        if payload.get("code"):
            STATE["error"] = ""
            STATE["status"] = "seen " + payload["code"]
        else:
            STATE["status"] = "no place in the recent log"
    return payload if payload.get("code") else None


def watch():
    history.backfill(CFG["logPath"])
    while not STOP.is_set():
        path = Path(CFG["logPath"])
        if not path.is_file():
            with LOCK:
                STATE["error"] = "找不到这份日志"
                STATE["status"] = "waiting for log"
            STOP.wait(2)
            continue
        try:
            with path.open("r", encoding="utf-8", errors="replace") as handle:
                handle.seek(STATE["offset"] or path.stat().st_size)
                with LOCK:
                    STATE["offset"] = handle.tell()
                    STATE["status"] = "watching"
                    STATE["error"] = ""
                while not STOP.is_set():
                    line = handle.readline()
                    if not line:
                        if path.stat().st_size < handle.tell():
                            break
                        STOP.wait(1)
                        continue
                    with LOCK:
                        STATE["offset"] = handle.tell()
                    try:
                        consider(line, True)
                    except Exception as exc:
                        with LOCK:
                            STATE["error"] = str(exc)[:180]
                            STATE["status"] = "send failed"
        except OSError as exc:
            with LOCK:
                STATE["error"] = str(exc)[:180]
            STOP.wait(2)


def offer_pair(body):
    global PENDING
    room = str(body.get("room") or "").strip().upper()
    token = str(body.get("token") or "").strip()
    api = str(body.get("apiBase") or "").strip().rstrip("/")
    if not re.fullmatch(r"[A-Z0-9]{4}-[A-Z0-9]{4}", room):
        raise RuntimeError("房间码不对")
    if not re.fullmatch(r"[A-Za-z0-9]{16,128}", token):
        raise RuntimeError("令牌不对")
    if not api.startswith(("http://", "https://")):
        raise RuntimeError("地址不对")
    with LOCK:
        PENDING = {"room": room, "token": token, "apiBase": api}


def accept_pair():
    global PENDING
    with LOCK:
        pending = PENDING
        if not pending:
            raise RuntimeError("没有待确认的连接")
        CFG["room"] = pending["room"]
        CFG["token"] = pending["token"]
        CFG["apiBase"] = pending["apiBase"]
        PENDING = None
        save_config(CFG)


def decline_pair():
    global PENDING
    with LOCK:
        PENDING = None


def set_running(on):
    global THREAD
    if on:
        if THREAD and THREAD.is_alive():
            return
        STOP.clear()
        path = Path(CFG["logPath"])
        with LOCK:
            STATE["running"] = True
            STATE["offset"] = path.stat().st_size if path.is_file() else 0
            STATE["status"] = "watching"
            STATE["error"] = ""
        scan_tail()
        with LOCK:
            place = STATE.get("place") or {}
        if place.get("code") and CFG.get("token") and CFG.get("room"):
            try:
                post_place(place)
            except Exception as exc:
                with LOCK:
                    STATE["error"] = str(exc)[:180]
                    STATE["status"] = "send failed"
        THREAD = threading.Thread(target=watch, daemon=True)
        THREAD.start()
        return
    STOP.set()
    with LOCK:
        STATE["running"] = False
        STATE["status"] = "stopped"


def origin_allowed(origin):
    if not origin:
        return True
    if origin == LIVE_ORIGIN:
        return True
    parsed = urlparse(origin)
    host = (parsed.hostname or "").lower()
    return parsed.scheme == "http" and host in ("127.0.0.1", "localhost")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def cors(self):
        origin = self.headers.get("Origin")
        if not origin or not origin_allowed(origin):
            return
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")

    def rejected_origin(self):
        origin = self.headers.get("Origin")
        if not origin or origin_allowed(origin):
            return False
        raw = b'{"error":"origin"}'
        self.send_response(403)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)
        return True

    def send_json(self, code, obj):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.cors()
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        if self.rejected_origin():
            return
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.cors()
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def read_json(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return {}
        if n <= 0 or n > 100_000:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def do_GET(self):
        if self.rejected_origin():
            return
        path = unquote(urlparse(self.path).path)
        if path == "/api/status":
            self.send_json(200, public_state())
            return
        if path == "/api/history":
            self.send_json(200, {"events": history.public()})
            return
        if path in ("/", "/index.html"):
            self.file(BUNDLE / "index.html", "text/html; charset=utf-8")
            return
        if path == "/css/starmap.css":
            css = BUNDLE / "css" / "starmap.css" if frozen() else ROOT / "css" / "starmap.css"
            self.file(css, "text/css; charset=utf-8")
            return
        self.send_error(404)

    def file(self, path, mime):
        if not path.is_file():
            self.send_error(404)
            return
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.rejected_origin():
            return
        path = unquote(urlparse(self.path).path)
        body = self.read_json()
        try:
            if path == "/api/pair":
                offer_pair(body)
                self.send_json(200, public_state())
                return
            if path == "/api/pair/yes":
                accept_pair()
                self.send_json(200, public_state())
                return
            if path == "/api/pair/no":
                decline_pair()
                self.send_json(200, public_state())
                return
            if path == "/api/quit":
                self.send_json(200, {"ok": True})
                request_stop()
                return
            if path == "/api/focus":
                shown = raise_window()
                self.send_json(200, {"ok": True, "shown": bool(shown)})
                return
            if path == "/api/settings":
                apply_settings(body)
                self.send_json(200, public_state())
                return
            if path == "/api/watch":
                apply_settings(body)
                set_running(bool(body.get("on")))
                self.send_json(200, public_state())
                return
            if path == "/api/scan":
                apply_settings(body)
                found = scan_tail()
                out = public_state()
                out["found"] = found
                self.send_json(200, out)
                return
            if path == "/api/try":
                place = parse_line(str(body.get("line") or ""))
                sent = False
                if place and body.get("send"):
                    apply_settings(body)
                    post_place(place)
                    sent = True
                elif place:
                    with LOCK:
                        STATE["place"] = place
                        STATE["error"] = ""
                        STATE["status"] = "parsed " + place["code"]
                self.send_json(200, {"place": place, "sent": sent, "state": public_state()})
                return
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:180]
            self.send_json(200, {"error": "房间服务返回 %s %s" % (exc.code, detail), "state": public_state()})
            return
        except Exception as exc:
            self.send_json(200, {"error": str(exc)[:180], "state": public_state()})
            return
        self.send_json(404, {"error": "not found"})


HTTPD = None
RAISE = None
PAGE = "http://%s:%d/" % (HOST, PORT)


def port_open():
    try:
        with urllib.request.urlopen(PAGE + "api/status", timeout=0.4) as resp:
            return resp.status == 200
    except (OSError, urllib.error.URLError):
        return False


def tell(text):
    if sys.platform == "win32":
        import ctypes
        ctypes.windll.user32.MessageBoxW(0, text, "Starfix", 0x40)
    else:
        print(text)


def _update_lang():
    try:
        return desk.canon_lang(CFG.get("lang")) or desk.windows_lang()
    except Exception:
        return "zh-Hans"


def unreachable_text():
    page = RELEASE_PAGE
    lang = _update_lang()
    if lang == "zh-Hant":
        return "偵測到您的網路可能無法存取軟體更新伺服器 Github，建議手動前往查看是否有更新版本\n" + page
    if lang == "en":
        return "This network may be unable to reach the update server (GitHub). Check the releases page yourself for a newer version.\n" + page
    if lang == "de":
        return "Dieses Netzwerk erreicht den Update-Server (GitHub) möglicherweise nicht. Bitte prüfe die Releases-Seite selbst.\n" + page
    return "检测到您的网络可能无法访问软件更新服务器 Github，建议手动前往查看是否有更新版本\n" + page


def update_ready_text(version):
    lang = _update_lang()
    if lang == "zh-Hant":
        return "發現新版本 %s。點確定後會下載並替換目前的程式，然後自動重新開啟。" % version
    if lang == "en":
        return "Version %s is available. Choose OK to download it, replace this copy, and open it again." % version
    if lang == "de":
        return "Version %s ist da. Mit OK wird sie geladen, diese Datei ersetzt und danach neu geöffnet." % version
    return "发现新版本 %s。点确定后会下载并替换当前程序，然后自动重新打开。" % version


def _github_json(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Starfix/" + VERSION,
        "Accept": "application/vnd.github+json",
    })
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            raw = resp.read(1_000_000)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        raise OSError("github")
    except (urllib.error.URLError, TimeoutError, OSError):
        raise OSError("github")
    try:
        data = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        raise OSError("github")
    return data if isinstance(data, dict) else None


def newer_release():
    mine = version_tuple(VERSION)
    data = _github_json(RELEASE_API)
    if not mine or not data:
        return None
    theirs = version_tuple(data.get("tag_name"))
    if not theirs or theirs <= mine:
        return None
    url = ""
    for item in data.get("assets") or []:
        if not isinstance(item, dict) or item.get("name") != "Starfix.exe":
            continue
        link = str(item.get("browser_download_url") or "")
        if link.startswith(RELEASE_EXE):
            url = link
            break
    if not url:
        return None
    return {"version": "%d.%d.%d" % theirs, "url": url}


def download_release(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Starfix/" + VERSION})
    total = 0
    try:
        with urllib.request.urlopen(req, timeout=120) as resp, dest.open("wb") as out:
            while True:
                chunk = resp.read(64 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > 80_000_000:
                    raise OSError("github")
                out.write(chunk)
    except (urllib.error.URLError, TimeoutError, OSError):
        raise OSError("github")
    if total < 1_000_000:
        raise OSError("github")


def swap_and_exit(src, dest):
    script = Path(os.environ.get("TEMP") or os.environ.get("TMP") or ".") / "starfix-update.ps1"

    def quote(value):
        return "'" + str(value).replace("'", "''") + "'"

    script.write_text(
        "$src = %s\n$dst = %s\n$procId = %d\n"
        "$deadline = (Get-Date).AddSeconds(40)\n"
        "while ((Get-Process -Id $procId -ErrorAction SilentlyContinue) -and ((Get-Date) -lt $deadline)) { Start-Sleep -Milliseconds 200 }\n"
        "Start-Sleep -Milliseconds 500\n"
        "try {\n"
        "  Move-Item -LiteralPath $src -Destination $dst -Force\n"
        "  Start-Process -FilePath $dst\n"
        "} catch {\n"
        "  Add-Type -AssemblyName System.Windows.Forms\n"
        "  [System.Windows.Forms.MessageBox]::Show('更新文件已经下载，但没能替换当前程序。请关掉 Starfix 后，手动用旁边的 Starfix.update.exe 替换。', 'Starfix')\n"
        "}\n"
        "Remove-Item -LiteralPath %s -Force -ErrorAction SilentlyContinue\n"
        % (quote(src), quote(dest), os.getpid(), quote(script)),
        encoding="utf-8",
    )
    flags = 0x00000200 | 0x08000000
    subprocess.Popen(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script)],
        creationflags=flags,
        close_fds=True,
    )
    os._exit(0)


def maybe_update():
    # Only the packaged exe replaces itself. Running from source stays as it is.
    if not frozen():
        return
    try:
        found = newer_release()
    except OSError:
        tell(unreachable_text())
        return
    if not found:
        return
    dest = Path(sys.executable).resolve()
    src = dest.with_name("Starfix.update.exe")
    tell(update_ready_text(found["version"]))
    try:
        download_release(found["url"], src)
    except OSError:
        try:
            src.unlink()
        except OSError:
            pass
        tell(unreachable_text())
        return
    swap_and_exit(src, dest)


def raise_window():
    if desk.request_front():
        return True
    fn = RAISE
    if fn:
        fn()
        return True
    return False


def parse_tasklist_pids(text):
    found = []
    for line in str(text or "").splitlines():
        line = line.strip()
        if not line.startswith('"'):
            continue
        parts = [part.strip().strip('"') for part in line.split('","')]
        if len(parts) < 2 or parts[0].lower() != "starfix.exe":
            continue
        try:
            found.append(int(parts[1]))
        except ValueError:
            continue
    return found


def other_starfix_pids():
    if sys.platform != "win32":
        return []
    try:
        done = subprocess.run(
            ["tasklist", "/FI", "IMAGENAME eq Starfix.exe", "/FO", "CSV", "/NH"],
            capture_output=True,
            creationflags=0x08000000,
        )
    except OSError:
        return []
    text = done.stdout.decode("mbcs", "replace")
    skip = {os.getpid()}
    try:
        skip.add(os.getppid())
    except OSError:
        pass
    return [pid for pid in parse_tasklist_pids(text) if pid not in skip and pid > 0]


def end_starfix_pids(pids):
    if sys.platform != "win32":
        return
    me = os.getpid()
    try:
        parent = os.getppid()
    except OSError:
        parent = 0
    for pid in pids:
        if pid <= 0 or pid in (me, parent):
            continue
        try:
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/F"],
                capture_output=True,
                creationflags=0x08000000,
            )
        except OSError:
            pass


def foreground_pid():
    if sys.platform != "win32":
        return 0
    import ctypes
    from ctypes import wintypes
    user32 = ctypes.WinDLL("user32", use_last_error=True)
    user32.GetForegroundWindow.restype = wintypes.HWND
    user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
    user32.GetWindowThreadProcessId.restype = wintypes.DWORD
    hwnd = user32.GetForegroundWindow()
    if not hwnd:
        return 0
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    return int(pid.value)


def allow_foreground(pids):
    if sys.platform != "win32":
        return
    import ctypes
    from ctypes import wintypes
    user32 = ctypes.WinDLL("user32", use_last_error=True)
    user32.AllowSetForegroundWindow.argtypes = [wintypes.DWORD]
    user32.AllowSetForegroundWindow.restype = wintypes.BOOL
    for pid in pids:
        user32.AllowSetForegroundWindow(int(pid))


def ask_yes(text):
    if sys.platform != "win32":
        return False
    import ctypes
    # Yes/No, question icon, topmost, and allowed to take the foreground.
    flags = 0x00000004 | 0x00000020 | 0x00040000 | 0x00010000
    return ctypes.windll.user32.MessageBoxW(0, text, "Starfix", flags) == 6


def already_running_text():
    lang = _update_lang()
    if lang == "zh-Hant":
        return "已經有一個 Starfix 在執行，所以這次沒有打開新視窗。\n\n要結束舊行程並重新打開嗎？"
    if lang == "en":
        return "Starfix is already running, so this launch did not open another window.\n\nClose the old one and open this copy?"
    if lang == "de":
        return "Starfix läuft bereits, darum hat dieser Start kein neues Fenster geöffnet.\n\nDas alte Programm beenden und dieses öffnen?"
    return "已经有一个 Starfix 在运行，所以这次没有打开新窗口。\n\n要结束旧进程并重新打开吗？"


def still_running_text():
    lang = _update_lang()
    if lang == "zh-Hant":
        return "舊的 Starfix 沒有退出，這次沒有打開新視窗。"
    if lang == "en":
        return "The old Starfix did not exit, so this copy did not open."
    if lang == "de":
        return "Das alte Starfix wurde nicht beendet, darum öffnet diese Kopie nicht."
    return "旧的 Starfix 没有退出，这次没有打开新窗口。"


def post_focus():
    try:
        req = urllib.request.Request(
            PAGE + "api/focus",
            data=b"{}",
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            raw = resp.read(10_000)
        data = json.loads(raw.decode("utf-8"))
        return bool(isinstance(data, dict) and data.get("ok"))
    except (OSError, urllib.error.URLError, json.JSONDecodeError, UnicodeError):
        return False


def wait_until(pred, seconds):
    deadline = time.time() + seconds
    while time.time() < deadline:
        if pred():
            return True
        time.sleep(0.1)
    return bool(pred())


def claim_single_instance():
    # A second double-click used to exit quietly. Bring the open window forward.
    # If it never appears, ask before ending the old Starfix.exe.
    if not port_open():
        return True
    if sys.platform != "win32" or not frozen():
        if not post_focus():
            tell("Starfix 已经在运行。")
        return False
    others = other_starfix_pids()
    allow_foreground(others)
    for _ in range(2):
        post_focus()
        if wait_until(lambda: foreground_pid() in others, 0.6):
            return False
    if others and ask_yes(already_running_text()):
        end_starfix_pids(others)
        if wait_until(lambda: not port_open(), 5):
            return True
        tell(still_running_text())
    elif not others:
        tell(already_running_text().split("\n")[0])
    return False


def request_stop():
    STOP.set()

    def _stop():
        time.sleep(0.2)
        if HTTPD is not None:
            HTTPD.shutdown()

    threading.Thread(target=_stop, daemon=True).start()


def main():
    global HTTPD
    if not claim_single_instance():
        return
    maybe_update()
    ThreadingHTTPServer.allow_reuse_address = True
    try:
        httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError:
        tell("8780 端口被别的程序占用，Starfix 开不了。")
        return
    HTTPD = httpd
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    threading.Thread(target=lambda: history.backfill(CFG["logPath"]), daemon=True).start()
    try:
        desk.open_window(sys.modules[__name__])
    finally:
        request_stop()
        httpd.server_close()
        if frozen():
            end_starfix_pids(other_starfix_pids())


if __name__ == "__main__":
    import sys

    if "--check" in sys.argv:
        sample = (
            "<2026-10-27T07:00:00.000Z> [Notice] <Requesting Transition> "
            "Loading | Ready | Stanton | host [1] | "
            "Transitioning from zone Stanton3 in Stanton to zone RR_HUR_Lorville in Stanton [Team][Loading]"
        )
        got = parse_line(sample)
        assert got and got["code"] == "RR_HUR_Lorville" and got["system"] == "Stanton", got
        assert got.get("server") == "1", got
        assert host_of("[SessionIDManager] shard id: shard1") == ""
        assert host_of("[Trace] @host_session: 'local_shard'") == ""
        assert host_of(
            "Ready | Stanton | pub-sc-alpha-1 [48291] | Transitioning from zone A in Stanton"
        ) == "48291"
        loaded = ingest(sample)
        assert loaded and loaded["code"] == "RR_HUR_Lorville" and SERVER == "1", (loaded, SERVER)
        assert parse_line("ordinary engine line without a place") is None
        worn = ingest(
            "Player[Pilot] Attachment[item_1, rrs_specialist_heavy_core_04_03_01, 1] "
            "Status[persistent] Port[Armor_Torso]"
        )
        assert worn is None and WORN["Armor_Torso"].startswith("RRS ")
        assert version_tuple("1.2.3") == (1, 2, 3)
        assert version_tuple("starfix-1.2.3") == (1, 2, 3)
        assert version_tuple("starfix-" + "a" * 40) is None
        assert version_tuple("1.0.1") > version_tuple("1.0.0")
        assert version_tuple(VERSION) is not None
        assert parse_tasklist_pids('"Starfix.exe","4321","Console","1","12,345 K"\nINFO: none\n') == [4321]
        assert parse_tasklist_pids('"notepad.exe","1","Console","1","1 K"') == []
        assert log_kind("") == "missing"
        assert log_kind(r"D:\no-such-starfix-log.log") == "missing"
        assert WORN_CLS["Armor_Torso"] == "rrs_specialist_heavy_core_04_03_01"
        assert gear_list()[0]["cls"] == "rrs_specialist_heavy_core_04_03_01"
        here = ingest(
            "CSCItemNavigation::CalculateRoute|Projected Start Location is HUR L4 for route"
        )
        assert here and here["code"] == "RR_HUR_L4", here
        ship_line = (
            "AEGS_Idris_M_876820722641|CSCItemNavigation::OnPlayerSelectedQuantumTarget|"
            "selected point LOC_RR_S1_L2"
        )
        ingest(ship_line)
        assert SHIP == "Aegis Idris-M", SHIP
        assert DEST and DEST["code"] == "RR_HUR_L2", DEST
        assert TRAVEL and TRAVEL["mode"] == "aim" and TRAVEL["to_raw"] == "RR_HUR_L2", TRAVEL
        aimed = snapshot(DEST)
        assert aimed["travel"]["to"] == "HUR-L2" and aimed["server"] == "1", aimed
        ingest(
            "<2026-10-26T00:20:00.000Z> AEGS_Idris_M_903672034572|CSCItemNavigation::CalculateRoute|"
            "Projected Start Location is 赫 HUR L3 for pilot to destination LOC_RR_S1_L4"
        )
        assert TRAVEL["mode"] == "jump" and TRAVEL["to"] == "HUR-L4" and TRAVEL["to_raw"] == "RR_HUR_L4", TRAVEL
        assert "HUR L3" in TRAVEL["from"]
        ingest("OnQuantumDriveArrived arrived at final destination")
        assert TRAVEL is None
        trail = history.new_state()
        bought = history.parse(
            "<2026-10-27T10:53:23.969Z> SendShopBuyRequest shopName[SCShop_LiveFire_Truckstop02-001] "
            "client_price[400.000000] itemName[nvtc_optics_rdot_x1_s1] quantity[1]",
            trail,
        )
        assert bought == [] and trail["buy"]["item"] == "nvtc_optics_rdot_x1_s1"
        done = history.parse(
            "<2026-10-27T10:53:24.579Z> RmShopFlowResponse result[Success] type[Buying]",
            trail,
        )
        assert done and done[0]["kind"] == "buy" and done[0]["qty"] == 1 and done[0]["price"] == 400
        jumped = history.parse(
            "<2026-10-26T00:20:00.000Z> AEGS_Idris_M_903672034572|CSCItemNavigation::CalculateRoute|"
            "Projected Start Location is 赫 HUR L3 for pilot to destination LOC_RR_S1_L4",
            trail,
        )
        jump = next(row for row in jumped if row["kind"] == "jump")
        assert jump["start"] == "赫 HUR L3" and jump["code"] == "RR_HUR_L4" and jump["dest"] == "HUR-L4"
        assert jump["ship"] == "Aegis Idris-M"
        beacon = history.parse(
            "<2026-10-26T00:22:00.000Z> AEGS_Idris_M_903672034572|CSCItemNavigation::CalculateRoute|"
            "Projected Start Location is 赫 HUR L5 for pilot to destination MISSION_QT_Quantum_Beacon_ShortRange_Salvage_1",
            trail,
        )
        beacon_jump = next(row for row in beacon if row["kind"] == "jump")
        assert beacon_jump["destKind"] == "beacon" and beacon_jump["code"] == ""
        asset = history.parse(
            "<2026-10-27T11:30:23.000Z> RSI_Constellation_Mk5_Centaurus_904444518961|"
            "CSCItemNavigation::CalculateRoute|Projected Start Location is 赫 HUR L4 for pilot "
            "to destination arccorp_cluster_001_frost_{C4F29ABD-9E68-4FD7-9A70-A0522884BF50}.socpak",
            trail,
        )
        asset_jump = next(row for row in asset if row["kind"] == "jump")
        assert asset_jump["dest"] == "" and asset_jump["code"] == ""
        rough = history.parse(
            "<2026-10-26T01:32:16.000Z> AEGS_Idris_M_903672034572|CSCItemNavigation::CalculateRoute|"
            "Projected Start Location is 赫 HUR L1 for pilot to destination ab_collector_gas_Stanton1",
            trail,
        )
        rough_jump = next(row for row in rough if row["kind"] == "jump")
        assert rough_jump["dest"] == "" and rough_jump["start"] == "赫 HUR L1"
        mission = history.parse(
            '<2026-10-26T00:21:00.000Z> Notification "新任务：返回 赫-L1 绿色林地站:" , Action: Next',
            trail,
        )
        assert mission and mission[0]["kind"] == "mission" and mission[0]["code"] == "RR_HUR_L1"
        assert history.parse(
            '<2026-10-26T00:21:01.000Z> Notification "飞船启动: 找到按钮" , Action: Next',
            trail,
        ) == []
        assert history.parse(
            "<2026-10-26T00:18:39.366Z> Legacy login success",
            trail,
        )[0]["kind"] == "online"
        print("parser ok", got, SHIP, WORN["Armor_Torso"])
    else:
        main()
