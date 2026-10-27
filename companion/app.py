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
import re
import sys
import threading
import time
import urllib.error
import urllib.request

import desk
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

def frozen():
    return bool(getattr(sys, "frozen", False))


BUNDLE = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
DATA = Path(sys.executable).resolve().parent if frozen() else Path(__file__).resolve().parent
ROOT = BUNDLE if frozen() else BUNDLE.parent
CONFIG = DATA / "config.json"
HOST = "127.0.0.1"
PORT = 8780

TRANS = re.compile(
    r"Transitioning from zone (?P<from_zone>[\w.-]+) in (?P<from_system>[\w.-]+) "
    r"to zone (?P<to_zone>[\w.-]+) in (?P<to_system>[\w.-]+)",
    re.I,
)
CODE = re.compile(r"\b((?:RR|Stanton|Pyro|Nyx|Terra)[A-Za-z0-9_]{2,80})\b")
HINT = re.compile(r"zone|location|quantum|jump", re.I)

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
        "apiBase": "http://127.0.0.1:8770",
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


def parse_line(line):
    found = TRANS.search(line or "")
    if found:
        code = found.group("to_zone")
        system = system_of(code, found.group("to_system"))
        return {"code": code, "location": code, "system": system}
    if not HINT.search(line or ""):
        return None
    codes = CODE.findall(line or "")
    if not codes:
        return None
    code = codes[-1]
    return {"code": code, "location": code, "system": system_of(code)}


def public_state():
    with LOCK:
        place = STATE["place"]
        log_path = CFG["logPath"]
        return {
            "apiBase": CFG["apiBase"],
            "room": CFG["room"],
            "tokenSet": bool(CFG["token"]),
            "logPath": log_path,
            "logExists": Path(log_path).is_file() if log_path else False,
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
    place = parse_line(line)
    if not place:
        return None
    with LOCK:
        prev = STATE["place"]
        same = prev and prev.get("code") == place["code"]
    if same:
        return place
    if send:
        post_place(place)
    else:
        with LOCK:
            STATE["place"] = place
            STATE["error"] = ""
    return place


def scan_tail():
    path = Path(CFG["logPath"])
    if not path.is_file():
        with LOCK:
            STATE["error"] = "找不到这份日志"
            STATE["status"] = "no log"
        return None
    data = path.read_bytes()
    tail = data[-400_000:]
    text = tail.decode("utf-8", "replace")
    found = None
    for line in text.splitlines():
        place = parse_line(line)
        if place:
            found = place
    with LOCK:
        STATE["offset"] = path.stat().st_size
        if found:
            STATE["place"] = found
            STATE["error"] = ""
            STATE["status"] = "seen " + found["code"]
        else:
            STATE["status"] = "no place in the recent log"
    return found


def watch():
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
        THREAD = threading.Thread(target=watch, daemon=True)
        THREAD.start()
        return
    STOP.set()
    with LOCK:
        STATE["running"] = False
        STATE["status"] = "stopped"


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def send_json(self, code, obj):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        origin = self.headers.get("Origin")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Content-Length", "0")
        origin = self.headers.get("Origin")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()

    def read_json(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > 100_000:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/api/status":
            self.send_json(200, public_state())
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
                self.send_json(200, {"ok": True})
                raise_window()
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


def raise_window():
    fn = RAISE
    if fn:
        fn()


def request_stop():
    STOP.set()

    def _stop():
        time.sleep(0.2)
        if HTTPD is not None:
            HTTPD.shutdown()

    threading.Thread(target=_stop, daemon=True).start()


def main():
    global HTTPD
    if port_open():
        try:
            req = urllib.request.Request(
                PAGE + "api/focus",
                data=b"{}",
                method="POST",
                headers={"Content-Type": "application/json"},
            )
            urllib.request.urlopen(req, timeout=1.5).read()
        except (OSError, urllib.error.URLError):
            tell("Starfix 已经在运行。")
        return
    ThreadingHTTPServer.allow_reuse_address = True
    try:
        httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError:
        tell("8780 端口被别的程序占用，Starfix 开不了。")
        return
    HTTPD = httpd
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    try:
        desk.open_window(sys.modules[__name__])
    finally:
        request_stop()
        httpd.server_close()


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
        assert parse_line("ordinary engine line without a place") is None
        print("parser ok", got)
    else:
        main()
