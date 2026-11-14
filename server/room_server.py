# Room server for SC LMW.
# Serves this site and /api/rooms. The site never reads the game folder.
# A player marks "I am here" by clicking a place on the map.
#
#   python server/room_server.py
#   then open http://127.0.0.1:8770/
#
#   python server/room_server.py --host 0.0.0.0
#   people on the same network open http://<this-computer>:8770/

import argparse
import json
import os
import re
import secrets
import socket
import sqlite3
import threading
import time
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
DB = Path(__file__).resolve().parent / "rooms.sqlite"
HOST = "127.0.0.1"
PORT = 8770
ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
# These stay on disk for local builds. The room site must not hand them out.
BLOCK_DIR = {"language", ".cache", ".git", ".test", "__pycache__", "server", "companion"}
BLOCK_EXT = {".sqlite", ".ini", ".pyc", ".spec"}
BLOCK_NAME = {"config.json"}
# Starfix stays lit for 90s after its last heartbeat. The game stays lit for
# 3 minutes after the chosen Game.log last grew. A quit clears both at once.
STARFIX_S = 90
GAME_S = 180
OPEN_S = 300
# Captain absence follows room polls, not the Starfix heartbeat.
CAPTAIN_GONE_S = 7 * 24 * 3600
POLL_LIVE_S = 120
LOCK = threading.Lock()
CHAT_LAST = {}

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".md": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".woff2": "font/woff2",
    ".webmanifest": "application/manifest+json",
}


def now():
    return time.time()


def iso(ts):
    return datetime.fromtimestamp(ts, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def db():
    con = sqlite3.connect(DB, timeout=5)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    with LOCK, db() as con:
        con.executescript(
            """
            CREATE TABLE IF NOT EXISTS member (
              id TEXT PRIMARY KEY,
              token TEXT UNIQUE NOT NULL,
              nickname TEXT NOT NULL,
              created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS room (
              code TEXT PRIMARY KEY,
              captain TEXT NOT NULL,
              route_mode TEXT NOT NULL DEFAULT 'captain',
              created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS membership (
              room TEXT NOT NULL,
              member TEXT NOT NULL,
              status TEXT NOT NULL,
              created REAL NOT NULL,
              PRIMARY KEY (room, member)
            );
            CREATE TABLE IF NOT EXISTS presence (
              room TEXT NOT NULL,
              member TEXT NOT NULL,
              location TEXT,
              system TEXT,
              code TEXT,
              seen REAL NOT NULL,
              PRIMARY KEY (room, member)
            );
            CREATE TABLE IF NOT EXISTS route (
              id TEXT PRIMARY KEY,
              room TEXT NOT NULL,
              author TEXT NOT NULL,
              title TEXT,
              note TEXT,
              points TEXT NOT NULL,
              published INTEGER NOT NULL DEFAULT 1,
              created REAL NOT NULL,
              updated REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS comment (
              id TEXT PRIMARY KEY,
              route TEXT NOT NULL,
              author TEXT NOT NULL,
              body TEXT NOT NULL,
              created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS broadcast (
              id TEXT PRIMARY KEY,
              room TEXT NOT NULL,
              author TEXT NOT NULL,
              body TEXT NOT NULL,
              created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS rally (
              room TEXT PRIMARY KEY,
              id TEXT NOT NULL,
              place TEXT NOT NULL,
              name TEXT NOT NULL,
              system TEXT,
              at REAL NOT NULL,
              created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS rally_rsvp (
              room TEXT NOT NULL,
              rally TEXT NOT NULL,
              member TEXT NOT NULL,
              going INTEGER NOT NULL,
              PRIMARY KEY (room, member)
            );
            CREATE TABLE IF NOT EXISTS lobby (
              member TEXT PRIMARY KEY,
              visible INTEGER NOT NULL DEFAULT 0,
              location TEXT,
              system TEXT,
              code TEXT,
              ship TEXT,
              host TEXT,
              seen REAL,
              starfix_seen REAL,
              game_seen REAL
            );
            CREATE TABLE IF NOT EXISTS lobby_chat (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              member TEXT NOT NULL,
              body TEXT NOT NULL,
              created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS board (
              id TEXT PRIMARY KEY,
              member TEXT NOT NULL,
              kind TEXT NOT NULL,
              title TEXT NOT NULL,
              detail TEXT,
              ship TEXT,
              place TEXT,
              name TEXT,
              system TEXT,
              at REAL,
              seats INTEGER,
              standing INTEGER NOT NULL DEFAULT 0,
              host TEXT,
              mission TEXT,
              speech TEXT,
              contact_kind TEXT,
              contact TEXT,
              created REAL NOT NULL,
              expires REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS board_rsvp (
              board TEXT NOT NULL,
              member TEXT NOT NULL,
              going INTEGER NOT NULL,
              note TEXT,
              PRIMARY KEY (board, member)
            );
            """
        )
        cols = {row[1] for row in con.execute("PRAGMA table_info(presence)")}
        if "ship" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN ship TEXT")
        if "gear" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN gear TEXT")
        if "host" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN host TEXT")
        if "travel" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN travel TEXT")
        if "card" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN card TEXT")
        if "starfix_seen" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN starfix_seen REAL")
        if "game_seen" not in cols:
            con.execute("ALTER TABLE presence ADD COLUMN game_seen REAL")
        room_cols = {row[1] for row in con.execute("PRAGMA table_info(room)")}
        if "open" not in room_cols:
            con.execute("ALTER TABLE room ADD COLUMN open INTEGER NOT NULL DEFAULT 0")
        if "open_at" not in room_cols:
            con.execute("ALTER TABLE room ADD COLUMN open_at REAL NOT NULL DEFAULT 0")
        if "recover" not in room_cols:
            con.execute("ALTER TABLE room ADD COLUMN recover TEXT")
        board_cols = {row[1] for row in con.execute("PRAGMA table_info(board)")}
        if "mission" not in board_cols:
            con.execute("ALTER TABLE board ADD COLUMN mission TEXT")
        if "speech" not in board_cols:
            con.execute("ALTER TABLE board ADD COLUMN speech TEXT")
        if "contact_kind" not in board_cols:
            con.execute("ALTER TABLE board ADD COLUMN contact_kind TEXT")
        if "contact" not in board_cols:
            con.execute("ALTER TABLE board ADD COLUMN contact TEXT")
        mem_cols = {row[1] for row in con.execute("PRAGMA table_info(membership)")}
        if "touched" not in mem_cols:
            con.execute("ALTER TABLE membership ADD COLUMN touched REAL")
            con.execute("UPDATE membership SET touched=? WHERE touched IS NULL", (now(),))


def clean_nick(raw):
    s = "".join(ch for ch in str(raw or "") if ch >= " " and ch != "\x7f").strip()
    if not s or len(s) > 32:
        return None
    return s


def clean_cast(raw):
    s = " ".join(str(raw or "").replace("\r", " ").replace("\n", " ").split())
    s = "".join(ch for ch in s if ch >= " " and ch != "\x7f").strip()
    if not s:
        return None
    return s[:120]


def clean_seats(raw):
    text = str(raw or "").strip()
    text = text.replace("－", "-").replace("—", "-").replace("–", "-").replace("~", "-").replace("～", "-")
    text = re.sub(r"\s+", "", text)
    if text in ("", "0"):
        return ""
    match = re.fullmatch(r"(\d{1,4})(?:-(\d{1,4}))?", text)
    if not match:
        return None
    low = int(match.group(1))
    high = int(match.group(2) or low)
    if low < 1 or high > 9999 or low > high:
        return None
    if low == high:
        return str(low)
    return f"{low}-{high}"


def clean_label(raw, limit):
    s = " ".join(str(raw or "").replace("\r", " ").replace("\n", " ").split())
    s = "".join(ch for ch in s if ch >= " " and ch != "\x7f").strip()
    if not s:
        return None
    return s[:limit]


def _contact_url(raw):
    text = str(raw or "").strip()
    if not re.match(r"https?://", text, re.I) or any(ch.isspace() for ch in text):
        return None
    try:
        url = urlparse(text)
    except ValueError:
        return None
    if url.scheme.lower() not in ("http", "https") or url.username or url.password or url.port:
        return None
    return url


def _contact_host(url):
    host = (url.hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def _contact_path(url):
    return [part for part in url.path.split("/") if part]


def contact_link(kind, raw):
    """A canonical invite link, '' when the text is a link we will not keep, or None."""
    text = str(raw or "").strip()
    if kind == "heibox" and re.fullmatch(r"(?=.*[a-z])(?=.*\d)[a-z0-9]{6,10}", text):
        return "https://chat.xiaoheihe.cn/" + text
    url = _contact_url(text)
    if url is None:
        return None
    host = _contact_host(url)
    seg = _contact_path(url)
    if kind == "heibox":
        if host == "chat.xiaoheihe.cn" and len(seg) == 1 and re.fullmatch(r"[A-Za-z0-9]{4,16}", seg[0]):
            return "https://chat.xiaoheihe.cn/" + seg[0]
        return ""
    if kind == "kook":
        if host in ("kook.top", "kook.vip") and len(seg) == 1 and re.fullmatch(r"[A-Za-z0-9]{4,16}", seg[0]):
            return "https://kook.top/" + seg[0]
        if host == "kookapp.cn" and len(seg) >= 2 and seg[-2] == "invite" and re.fullmatch(r"[A-Za-z0-9]{4,16}", seg[-1]):
            return "https://kook.top/" + seg[-1]
        return ""
    if kind == "discord":
        code = seg[0] if host == "discord.gg" and len(seg) == 1 else ""
        if host in ("discord.com", "discordapp.com") and len(seg) == 2 and seg[0] == "invite":
            code = seg[1]
        if re.fullmatch(r"(?=.*[A-Za-z0-9])[A-Za-z0-9-]{2,32}", code or ""):
            return "https://discord.gg/" + code
        return ""
    if kind == "qq":
        code = seg[1] if host == "qm.qq.com" and seg[:1] == ["q"] and len(seg) >= 2 else ""
        if not code and host in ("qm.qq.com", "jq.qq.com"):
            code = (parse_qs(url.query).get("k") or [""])[0]
        if re.fullmatch(r"[A-Za-z0-9]{4,24}", code or ""):
            return "https://qm.qq.com/q/" + code
        return ""
    if kind == "telegram":
        if host not in ("t.me", "telegram.me"):
            return ""
        if len(seg) == 1 and seg[0].startswith("+") and re.fullmatch(r"[A-Za-z0-9_-]{8,32}", seg[0][1:]):
            return "https://t.me/+" + seg[0][1:]
        if len(seg) == 2 and seg[0] == "joinchat" and re.fullmatch(r"[A-Za-z0-9_-]{8,32}", seg[1]):
            return "https://t.me/joinchat/" + seg[1]
        if len(seg) == 1 and re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{4,31}", seg[0]):
            return seg[0]
        return ""
    if kind == "whatsapp":
        if host == "chat.whatsapp.com" and len(seg) == 1 and re.fullmatch(r"[A-Za-z0-9]{10,32}", seg[0]):
            return "https://chat.whatsapp.com/" + seg[0]
        if host == "wa.me" and len(seg) == 1:
            return "".join(ch for ch in seg[0] if ch.isdigit())
        if host == "api.whatsapp.com" and seg[:1] == ["send"]:
            return "".join(ch for ch in (parse_qs(url.query).get("phone") or [""])[0] if ch.isdigit())
        return ""
    return None


def clean_contact(kind, raw):
    kind = (clean_label(kind, 16) or "").lower()
    text = clean_label(raw, 240) or ""
    if kind not in ("spectrum", "qq", "wechat", "discord", "telegram", "kook", "heibox", "whatsapp", "mail") or not text:
        return None
    linked = contact_link(kind, text)
    if linked == "":
        return None
    if linked and linked.startswith("https://"):
        return kind, linked
    if linked:
        text = linked
    if kind in ("telegram", "discord") and text.startswith("@"):
        text = text[1:]
    if kind == "qq":
        text = "".join(text.split())
    if kind == "whatsapp" and not text.startswith("https://"):
        lead = "+" if text.strip().startswith("+") else ""
        text = lead + "".join(ch for ch in text if ch.isdigit())
    if kind == "heibox" and not text.startswith("https://"):
        compact = "".join(text.split())
        if compact.isdigit():
            text = compact
    if kind == "mail":
        text = text.lower()
    ok = {
        "spectrum": bool(re.fullmatch(r"[\w.\- ]{2,40}", text)) and re.search(r"\w", text),
        "qq": bool(re.fullmatch(r"[1-9]\d{4,10}", text)),
        "wechat": bool(re.fullmatch(r"[A-Za-z][-_A-Za-z0-9]{5,19}", text)),
        "discord": bool(re.fullmatch(r"[A-Za-z0-9._]{2,32}(?:#\d{4})?", text)),
        "telegram": bool(re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{4,31}", text)),
        "kook": bool(re.fullmatch(r"(?:[A-Za-z0-9_]{2,32}(?:#\d{4})?|\d{5,12})", text)),
        "heibox": bool(re.fullmatch(r"(?:\d{4,10}|(?=.*[A-Za-z\u4e00-\u9fff])[\w\u4e00-\u9fff·]{2,32})", text)),
        "whatsapp": bool(re.fullmatch(r"\+?[1-9]\d{7,14}", text)),
        "mail": bool(re.fullmatch(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}", text)),
    }[kind]
    if not ok:
        return None
    return kind, text


class _InviteRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


_INVITE_CACHE = {}
_INVITE_LOCK = threading.Lock()


def _invite_count(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, str) and value.isdigit():
        value = int(value)
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    if isinstance(value, int) and 0 <= value <= 10_000_000:
        return value
    return None


def _invite_json(url, host):
    req = urllib.request.Request(url, headers={"User-Agent": "sc-lmw", "Accept": "application/json"})
    opener = urllib.request.build_opener(_InviteRedirect)
    try:
        with opener.open(req, timeout=3) as res:
            if urlparse(res.geturl()).hostname != host:
                return None
            raw = res.read(65536)
    except Exception:
        return None
    try:
        data = json.loads(raw.decode("utf-8", "replace"))
    except (UnicodeError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _invite_fields(name, channel, online, members):
    out = {}
    name = clean_label(name, 40)
    channel = clean_label(channel, 40)
    if name:
        out["name"] = name
    if channel and channel != name:
        out["channel"] = channel
    online = _invite_count(online)
    members = _invite_count(members)
    if online is not None:
        out["online"] = online
    if members is not None:
        out["members"] = members
    return out


def _fetch_invite(kind, contact):
    code = contact.rstrip("/").rsplit("/", 1)[-1]
    if kind == "discord":
        data = _invite_json(
            "https://discord.com/api/v10/invites/" + quote(code) + "?with_counts=true",
            "discord.com",
        )
        guild = data.get("guild") if isinstance(data, dict) and isinstance(data.get("guild"), dict) else None
        if not guild:
            return {}
        channel = data.get("channel") if isinstance(data.get("channel"), dict) else {}
        return _invite_fields(guild.get("name"), channel.get("name"), data.get("approximate_presence_count"), data.get("approximate_member_count"))
    if kind == "kook":
        data = _invite_json("https://www.kookapp.cn/api/v3/invite/view?url_code=" + quote(code), "www.kookapp.cn")
        payload = data.get("data") if isinstance(data, dict) and data.get("code") in (0, "0") and isinstance(data.get("data"), dict) else None
        if payload is None:
            data = _invite_json("https://www.kookapp.cn/api/v2/invites/" + quote(code), "www.kookapp.cn")
            payload = data.get("data") if isinstance(data, dict) and data.get("code") in (0, "0") and isinstance(data.get("data"), dict) else None
        if not isinstance(payload, dict):
            return {}
        guild = payload.get("guild") if isinstance(payload.get("guild"), dict) else payload
        channel = payload.get("channel") if isinstance(payload.get("channel"), dict) else {}
        return _invite_fields(
            guild.get("name"),
            channel.get("name"),
            guild.get("online_count", payload.get("online_count")),
            guild.get("user_count", payload.get("user_count")),
        )
    return {}


def invite_card(kind, contact):
    found = clean_contact(kind, contact)
    if not found or not found[1].startswith("https://") or found[0] not in ("discord", "kook"):
        return {}
    key = found[0] + " " + found[1]
    stamp = time.time()
    with _INVITE_LOCK:
        hit = _INVITE_CACHE.get(key)
        if hit and hit[0] > stamp:
            return hit[1]
    card = _fetch_invite(found[0], found[1])
    with _INVITE_LOCK:
        _INVITE_CACHE[key] = (stamp + (120 if card else 45), card)
        if len(_INVITE_CACHE) > 200:
            fresh = {k: v for k, v in _INVITE_CACHE.items() if v[0] > stamp}
            _INVITE_CACHE.clear()
            _INVITE_CACHE.update(fresh)
    return card


def clean_when(raw):
    try:
        at = float(raw)
    except (TypeError, ValueError):
        return None
    if at > 10_000_000_000:
        at = at / 1000.0
    stamp = now()
    if at < stamp - 3600 or at > stamp + 8 * 24 * 3600:
        return None
    return at


def rally_view(con, code, me_id):
    row = con.execute("SELECT * FROM rally WHERE room=?", (code,)).fetchone()
    if not row:
        return None
    replies = []
    mine = None
    for person in con.execute(
        """
        SELECT v.member, v.going, m.nickname
        FROM rally_rsvp v JOIN member m ON m.id=v.member
        WHERE v.room=? AND v.rally=?
        ORDER BY m.nickname
        """,
        (code, row["id"]),
    ):
        going = bool(person["going"])
        replies.append(
            {"id": person["member"], "nickname": person["nickname"] or "", "going": going}
        )
        if person["member"] == me_id:
            mine = going
    return {
        "id": row["id"],
        "place": row["place"],
        "name": row["name"],
        "system": row["system"] or "",
        "at": int(row["at"]),
        "mine": mine,
        "replies": replies,
    }


def latest_cast(con, code):
    row = con.execute(
        """
        SELECT b.id, b.body, b.created, m.nickname
        FROM broadcast b JOIN member m ON m.id=b.author
        WHERE b.room=?
        ORDER BY b.created DESC
        LIMIT 1
        """,
        (code,),
    ).fetchone()
    if not row:
        return None
    return {"id": row["id"], "body": row["body"], "name": row["nickname"] or "", "at": row["created"]}


def new_code(con):
    for _ in range(20):
        raw = "".join(secrets.choice(ALPH) for _ in range(8))
        code = raw[:4] + "-" + raw[4:]
        if not con.execute("SELECT 1 FROM room WHERE code=?", (code,)).fetchone():
            return code
    raise RuntimeError("code")


def new_recover():
    raw = "".join(secrets.choice(ALPH) for _ in range(12))
    return raw[:4] + "-" + raw[4:8] + "-" + raw[8:]


def clean_recover(raw):
    chars = [ch for ch in str(raw or "").upper() if ch in ALPH]
    if len(chars) != 12:
        return ""
    raw = "".join(chars)
    return raw[:4] + "-" + raw[4:8] + "-" + raw[8:]


def touch_member(con, code, mid):
    con.execute(
        "UPDATE membership SET touched=? WHERE room=? AND member=?",
        (now(), code, mid),
    )


def earliest_member(con, code, skip):
    return con.execute(
        """
        SELECT member FROM membership
        WHERE room=? AND status='member' AND member!=?
        ORDER BY created LIMIT 1
        """,
        (code, skip or ""),
    ).fetchone()


def settle_room(con, code):
    """Hand the room on after the captain's browser has been gone for seven days.

    A room poll refreshes that clock. The ten-minute location flag does not.
    With other confirmed members, the earliest one becomes captain and the
    previous captain stays in the room. With nobody else, the room is removed.
    """
    room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
    if not room:
        return False
    cap = con.execute(
        """
        SELECT touched, created FROM membership
        WHERE room=? AND member=? AND status='member'
        """,
        (code, room["captain"]),
    ).fetchone()
    if not cap:
        other = earliest_member(con, code, room["captain"])
        if other:
            con.execute("UPDATE room SET captain=? WHERE code=?", (other["member"], code))
            return True
        wipe_room(con, code)
        return False
    stamp = cap["touched"] if cap["touched"] is not None else cap["created"]
    if stamp is None or now() - float(stamp) < CAPTAIN_GONE_S:
        return True
    other = earliest_member(con, code, room["captain"])
    if other:
        con.execute("UPDATE room SET captain=? WHERE code=?", (other["member"], code))
        return True
    wipe_room(con, code)
    return False


def ensure_recover(con, room):
    current = room["recover"] if "recover" in room.keys() else ""
    if current:
        return current
    secret = new_recover()
    con.execute("UPDATE room SET recover=? WHERE code=?", (secret, room["code"]))
    return secret


def bearer(header):
    h = header or ""
    if h.lower().startswith("bearer "):
        return h[7:].strip()
    return ""


def member_by_token(con, token):
    if not token:
        return None
    return con.execute("SELECT * FROM member WHERE token=?", (token,)).fetchone()


def gear_items(raw):
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return []
    if not isinstance(data, list):
        return []
    out = []
    for item in data[:12]:
        if not isinstance(item, dict):
            continue
        port = str(item.get("port") or "")[:40]
        name = str(item.get("name") or "")[:80]
        cls = str(item.get("cls") or "")[:80]
        if port and name:
            row = {"port": port, "name": name}
            if cls:
                row["cls"] = cls
            out.append(row)
    return out


def clean_gear(raw):
    return json.dumps(gear_items(json.dumps(raw if isinstance(raw, list) else [])), ensure_ascii=False)


def clean_host(raw):
    return "".join(ch for ch in str(raw or "") if ch.isalnum() or ch in "_-")[:80]


def clean_travel(raw):
    if not isinstance(raw, dict):
        return ""
    mode = raw.get("mode")
    if mode not in ("aim", "jump"):
        return ""

    def clip(key):
        text = "".join(ch for ch in str(raw.get(key) or "") if ch >= " " and ch != "\x7f").strip()
        return text[:80]

    out = {"mode": mode, "from": clip("from"), "to": clip("to"), "to_raw": clip("to_raw")}
    if not out["to"] and not out["to_raw"]:
        return ""
    return json.dumps(out, ensure_ascii=False, separators=(",", ":"))


def clean_card(raw):
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except (TypeError, json.JSONDecodeError):
            return ""
    if not isinstance(raw, dict):
        return ""

    def clip(value):
        text = "".join(ch for ch in str(value or "") if ch >= " " and ch != "\x7f").strip()
        return text[:80]

    out = {}
    if isinstance(raw.get("arm"), bool):
        out["arm"] = raw["arm"]
    if isinstance(raw.get("watch"), bool):
        out["watch"] = raw["watch"]
    names = []
    for item in raw.get("contracts") or []:
        title = clip(item)
        if title and title not in names:
            names.append(title)
        if len(names) == 8:
            break
    if names:
        out["contracts"] = names
    tracked = clip(raw.get("track"))
    if tracked:
        out["track"] = tracked
    if isinstance(raw.get("board"), bool):
        out["board"] = raw["board"]
    crime = raw.get("crime")
    if isinstance(crime, int) and not isinstance(crime, bool) and 0 <= crime <= 5:
        out["crime"] = crime
    fps = raw.get("fps")
    if isinstance(fps, int) and not isinstance(fps, bool) and 1 <= fps <= 1000:
        out["fps"] = fps
    crash = clip(raw.get("crash"))
    if crash in ("gpu", "freeze", "ram", "vram", "fault"):
        out["crash"] = crash
    for key in ("kills", "wrecks"):
        num = raw.get(key)
        if isinstance(num, int) and not isinstance(num, bool) and 0 < num <= 9999:
            out[key] = num
    down = clip(raw.get("down"))
    if down in ("down", "player", "npc"):
        out["down"] = down
    if not out:
        return ""
    return json.dumps(out, ensure_ascii=False, separators=(",", ":"))


def card_obj(raw):
    text = clean_card(raw)
    if not text:
        return None
    return json.loads(text)


def travel_obj(raw):
    if not raw:
        return None
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except (TypeError, json.JSONDecodeError):
            return None
    text = clean_travel(raw)
    if not text:
        return None
    return json.loads(text)


def presence_lights(starfix_seen, game_seen, at=None):
    # The game light needs Starfix itself to be on. Nobody is watching the log otherwise.
    at = now() if at is None else at
    starfix = bool(starfix_seen and at - starfix_seen < STARFIX_S)
    game = bool(starfix and game_seen and at - game_seen < GAME_S)
    return starfix, game


def clean_note(raw, limit):
    s = str(raw or "").replace("\r\n", "\n").replace("\r", "\n")
    s = "".join(ch for ch in s if ch == "\n" or (" " <= ch and ch != "\x7f"))
    s = s.strip()
    return s[:limit] if s else ""


def lobby_row(con, member):
    return con.execute("SELECT * FROM lobby WHERE member=?", (member,)).fetchone()


def latest_presence(con, member):
    return con.execute(
        """
        SELECT location, system, code, ship, host, starfix_seen, game_seen
        FROM presence WHERE member=?
        ORDER BY COALESCE(seen, 0) DESC LIMIT 1
        """,
        (member,),
    ).fetchone()


def mirror_lobby(con, member, loc, sys, code, ship, host, starfix_seen, game_seen, seen):
    row = lobby_row(con, member)
    if not row or not row["visible"]:
        return
    con.execute(
        """
        UPDATE lobby
        SET location=?, system=?, code=?, ship=?, host=?, starfix_seen=?, game_seen=?, seen=?
        WHERE member=?
        """,
        (loc or "", sys or "", code or "", ship or "", host or "", starfix_seen, game_seen, seen or now(), member),
    )


def set_lobby(con, me, body):
    visible = 1 if isinstance(body, dict) and body.get("on") in (True, 1, "1") else 0
    prev = lobby_row(con, me["id"])
    presence = latest_presence(con, me["id"])
    loc = (prev["location"] if prev else "") or ""
    sys = (prev["system"] if prev else "") or ""
    code = (prev["code"] if prev else "") or ""
    ship = (prev["ship"] if prev else "") or ""
    host = (prev["host"] if prev else "") or ""
    starfix_seen = prev["starfix_seen"] if prev else None
    game_seen = prev["game_seen"] if prev else None
    if presence:
        loc = presence["location"] or loc
        sys = presence["system"] or sys
        code = presence["code"] or code
        ship = presence["ship"] or ship
        host = presence["host"] or host
        starfix_seen = presence["starfix_seen"]
        game_seen = presence["game_seen"]
    if isinstance(body, dict) and clean_label(body.get("code"), 80):
        loc = clean_label(body.get("location"), 80) or loc
        sys = (clean_label(body.get("system"), 24) or "").lower()
        if sys not in ("", "stanton", "pyro", "nyx"):
            sys = ""
        code = clean_label(body.get("code"), 80) or code
        named = clean_label(body.get("ship"), 40)
        if named:
            ship = named
    con.execute(
        """
        INSERT INTO lobby (member, visible, location, system, code, ship, host, seen, starfix_seen, game_seen)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(member) DO UPDATE SET
          visible=excluded.visible, location=excluded.location, system=excluded.system,
          code=excluded.code, ship=excluded.ship, host=excluded.host, seen=excluded.seen,
          starfix_seen=excluded.starfix_seen, game_seen=excluded.game_seen
        """,
        (me["id"], visible, loc, sys, code, ship, host, now() if visible else (prev["seen"] if prev else None), starfix_seen, game_seen),
    )


def chat_lines(con, me, after, limit):
    if after > 0:
        rows = con.execute(
            """
            SELECT c.id, c.body, c.created, c.member, m.nickname
            FROM lobby_chat c JOIN member m ON m.id=c.member
            WHERE c.id>? ORDER BY c.id ASC LIMIT ?
            """,
            (after, limit),
        ).fetchall()
    else:
        rows = con.execute(
            """
            SELECT c.id, c.body, c.created, c.member, m.nickname
            FROM lobby_chat c JOIN member m ON m.id=c.member
            ORDER BY c.id DESC LIMIT ?
            """,
            (limit,),
        ).fetchall()
        rows = list(reversed(rows))
    return [
        {
            "id": int(row["id"]),
            "nickname": row["nickname"] or "",
            "body": row["body"],
            "at": int(row["created"]),
            "mine": row["member"] == me["id"],
        }
        for row in rows
    ]


def add_chat(con, me, body):
    text = clean_label(body.get("body") if isinstance(body, dict) else None, 240)
    if not text:
        return None, "empty"
    stamp = now()
    prev = CHAT_LAST.get(me["id"], 0)
    if stamp - prev < 1.2:
        return None, "fast"
    CHAT_LAST[me["id"]] = stamp
    cur = con.execute(
        "INSERT INTO lobby_chat (member, body, created) VALUES (?,?,?)",
        (me["id"], text, stamp),
    )
    top = con.execute("SELECT MAX(id) AS n FROM lobby_chat").fetchone()
    if top and top["n"] and int(top["n"]) > 400:
        con.execute("DELETE FROM lobby_chat WHERE id<?", (int(top["n"]) - 400,))
    return {
        "id": int(cur.lastrowid),
        "nickname": me["nickname"] or "",
        "body": text,
        "at": int(stamp),
        "mine": True,
    }, None


KEEP_SECONDS = (900, 1800, 3600, 10800, 21600, 32400, 43200, 86400, 172800, 345600, 604800)


def clean_keep(body):
    raw = body.get("keep")
    if raw in (None, ""):
        try:
            raw = int(body.get("hours") or 0) * 3600
        except (TypeError, ValueError):
            raw = 0
    try:
        keep = int(raw)
    except (TypeError, ValueError):
        keep = 0
    if keep not in KEEP_SECONDS:
        return 21600
    return keep


def sweep_board(con):
    stamp = now()
    gone = [row["id"] for row in con.execute("SELECT id FROM board WHERE expires<=?", (stamp,))]
    if not gone:
        return
    con.executemany("DELETE FROM board_rsvp WHERE board=?", [(bid,) for bid in gone])
    con.execute("DELETE FROM board WHERE expires<=?", (stamp,))


def board_posts(con, me):
    sweep_board(con)
    stamp = now()
    posts = []
    rows = con.execute(
        """
        SELECT b.*, m.nickname
        FROM board b JOIN member m ON m.id=b.member
        WHERE b.expires>?
        ORDER BY b.created DESC LIMIT 40
        """,
        (stamp,),
    ).fetchall()
    for row in rows:
        replies = []
        mine_going = None
        for person in con.execute(
            """
            SELECT v.member, v.going, v.note, m.nickname
            FROM board_rsvp v JOIN member m ON m.id=v.member
            WHERE v.board=? ORDER BY m.nickname
            """,
            (row["id"],),
        ):
            going = bool(person["going"])
            replies.append(
                {
                    "nickname": person["nickname"] or "",
                    "going": going,
                    "note": person["note"] or "",
                    "mine": person["member"] == me["id"],
                }
            )
            if person["member"] == me["id"]:
                mine_going = going
        posts.append(
            {
                "id": row["id"],
                "kind": row["kind"],
                "title": row["title"],
                "detail": row["detail"] or "",
                "ship": row["ship"] or "",
                "place": row["place"] or "",
                "name": row["name"] or "",
                "system": row["system"] or "",
                "at": int(row["at"] or 0),
                "seats": clean_seats(row["seats"]) or "",
                "standing": bool(row["standing"]),
                "server": row["host"] or "",
                "mission": row["mission"] or "" if "mission" in row.keys() else "",
                "speech": (row["speech"] or "") if "speech" in row.keys() else "",
                "contactKind": (row["contact_kind"] or "") if "contact_kind" in row.keys() else "",
                "contact": (row["contact"] or "") if "contact" in row.keys() else "",
                "nickname": row["nickname"] or "",
                "mine": row["member"] == me["id"],
                "expires": int(row["expires"]),
                "going": mine_going,
                "replies": replies,
            }
        )
    return posts


def add_board(con, me, body):
    if not isinstance(body, dict):
        return "board"
    if body.get("clear"):
        bid = clean_label(body.get("id"), 40)
        if not bid:
            return "board"
        con.execute("DELETE FROM board_rsvp WHERE board=?", (bid,))
        con.execute("DELETE FROM board WHERE id=? AND member=?", (bid, me["id"]))
        return None
    kind = body.get("kind")
    if kind not in ("ship", "job", "roam"):
        return "board"
    title = clean_label(body.get("title"), 60)
    if not title:
        return "title"
    n = con.execute(
        "SELECT COUNT(*) AS n FROM board WHERE member=? AND expires>?",
        (me["id"], now()),
    ).fetchone()["n"]
    if int(n) >= 2:
        return "limit"
    standing = 1 if body.get("standing") in (True, 1, "1") else 0
    sweep_board(con)
    keep = clean_keep(body)
    seats = clean_seats(body.get("seats"))
    if seats is None:
        return "seats"
    at = 0
    if body.get("at") not in (None, "", 0):
        parsed = clean_when(body.get("at"))
        if parsed is None:
            return "time"
        at = parsed
    system = (clean_label(body.get("system"), 24) or "").lower()
    if system not in ("", "stanton", "pyro", "nyx"):
        system = ""
    host = clean_label(body.get("server"), 16) or ""
    if host not in ("", "asia", "us", "aus", "eu"):
        host = ""
    speech = clean_label(body.get("speech"), 16) or ""
    if speech not in ("", "zh", "en", "other"):
        speech = ""
    found = clean_contact(body.get("contactKind"), body.get("contact"))
    if not found:
        return "contact"
    contact_kind, contact = found
    stamp = now()
    con.execute(
        """
        INSERT INTO board (id, member, kind, title, detail, ship, place, name, system, at, seats, standing, host, mission, speech, contact_kind, contact, created, expires)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            secrets.token_hex(8),
            me["id"],
            kind,
            title,
            clean_note(body.get("detail"), 400),
            clean_label(body.get("ship"), 80) or "",
            clean_label(body.get("place"), 80) or "",
            clean_label(body.get("name"), 80) or "",
            system,
            at,
            seats,
            standing,
            host,
            clean_label(body.get("mission"), 80) or "",
            speech,
            contact_kind,
            contact,
            stamp,
            stamp + keep,
        ),
    )
    return None


def set_board_rsvp(con, me, body):
    if not isinstance(body, dict):
        return "board"
    bid = clean_label(body.get("id"), 40)
    going = body.get("going")
    if not bid or going not in (True, False, 0, 1):
        return "board"
    row = con.execute("SELECT id FROM board WHERE id=? AND expires>?", (bid, now())).fetchone()
    if not row:
        return "board"
    con.execute(
        """
        INSERT INTO board_rsvp (board, member, going, note) VALUES (?,?,?,?)
        ON CONFLICT(board, member) DO UPDATE SET going=excluded.going, note=excluded.note
        """,
        (bid, me["id"], 1 if going else 0, clean_label(body.get("note"), 80) or ""),
    )
    return None


def plaza_view(con, me, after):
    row = lobby_row(con, me["id"])
    visible = bool(row and row["visible"])
    if visible:
        con.execute("UPDATE lobby SET seen=? WHERE member=?", (now(), me["id"]))
    fresh = now() - 15 * 60
    people = []
    for person in con.execute(
        """
        SELECT l.*, m.nickname
        FROM lobby l JOIN member m ON m.id=l.member
        WHERE l.visible=1 AND l.seen>?
        ORDER BY m.nickname
        """,
        (fresh,),
    ):
        starfix, game = presence_lights(person["starfix_seen"], person["game_seen"])
        people.append(
            {
                "id": person["member"],
                "nickname": person["nickname"] or "",
                "location": person["location"] or "",
                "system": person["system"] or "",
                "code": person["code"] or "",
                "ship": person["ship"] or "",
                "server": person["host"] or "",
                "starfix": starfix,
                "game": game,
                "mine": person["member"] == me["id"],
            }
        )
    return {
        "on": visible,
        "people": people,
        "chat": chat_lines(con, me, after, 80),
        "posts": board_posts(con, me),
    }


def save_presence(con, room, member, body):
    if not isinstance(body, dict):
        return False
    old = con.execute(
        "SELECT location, system, code, seen, ship, gear, host, travel, card, starfix_seen, game_seen FROM presence WHERE room=? AND member=?",
        (room, member),
    ).fetchone()
    if "starfix" in body and not body.get("starfix"):
        if old:
            con.execute(
                "UPDATE presence SET starfix_seen=NULL, game_seen=NULL WHERE room=? AND member=?",
                (room, member),
            )
        con.execute(
            "UPDATE lobby SET starfix_seen=NULL, game_seen=NULL WHERE member=?",
            (member,),
        )
        return True
    sent_loc = str(body.get("location") or "")[:80]
    sent_code = str(body.get("code") or "")[:80]
    sent_place = bool(sent_loc or sent_code or "card" in body)
    loc = sent_loc
    sys = str(body.get("system") or "")[:40]
    code_loc = sent_code
    if not loc and not code_loc and old:
        loc = old["location"] or ""
        sys = old["system"] or sys
        code_loc = old["code"] or ""
    if "ship" in body:
        ship_name = str(body.get("ship") or "")[:80]
    else:
        ship_name = (old["ship"] if old and old["ship"] else "") or ""
    if "gear" in body:
        worn = clean_gear(body.get("gear"))
    else:
        worn = (old["gear"] if old and old["gear"] else "") or "[]"
    if "server" in body:
        host_id = clean_host(body.get("server"))
    else:
        host_id = (old["host"] if old and old["host"] else "") or ""
    if "travel" in body:
        travel = clean_travel(body.get("travel")) if isinstance(body.get("travel"), dict) else ""
    else:
        travel = (old["travel"] if old and old["travel"] else "") or ""
    if "card" in body:
        card = clean_card(body.get("card"))
    else:
        card = (old["card"] if old and old["card"] else "") or ""
    starfix_on = body.get("starfix") is True
    if not sent_place and not starfix_on:
        return False
    ts = now()
    place_seen = ts if sent_place else ((old["seen"] if old and old["seen"] else 0) or 0)
    starfix_seen = ts if starfix_on else (old["starfix_seen"] if old else None)
    game_seen = ts if body.get("game") is True else (old["game_seen"] if old else None)
    con.execute(
        """
        INSERT INTO presence (room, member, location, system, code, seen, ship, gear, host, travel, card, starfix_seen, game_seen)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(room, member) DO UPDATE SET
          location=excluded.location, system=excluded.system,
          code=excluded.code, seen=excluded.seen,
          ship=excluded.ship, gear=excluded.gear,
          host=excluded.host, travel=excluded.travel,
          card=excluded.card,
          starfix_seen=excluded.starfix_seen, game_seen=excluded.game_seen
        """,
        (room, member, loc, sys, code_loc, place_seen, ship_name, worn, host_id, travel, card, starfix_seen, game_seen),
    )
    mirror_lobby(con, member, loc, sys, code_loc, ship_name, host_id, starfix_seen, game_seen, place_seen or ts)
    return True


def room_state(con, code, me):
    room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
    if not room:
        return None
    ship = con.execute(
        "SELECT * FROM membership WHERE room=? AND member=?", (code, me["id"])
    ).fetchone()
    if not ship:
        return {"error": "forbidden"}
    if ship["status"] == "rejected":
        return {"error": "rejected"}
    role = "captain" if room["captain"] == me["id"] else "member"
    rows = con.execute(
        """
        SELECT m.id, m.nickname, s.status, p.location, p.system, p.code, p.seen, p.ship, p.gear, p.host, p.travel, p.card, p.starfix_seen, p.game_seen
        FROM membership s
        JOIN member m ON m.id = s.member
        LEFT JOIN presence p ON p.room = s.room AND p.member = s.member
        WHERE s.room=?
        ORDER BY s.created
        """,
        (code,),
    ).fetchall()
    members = []
    for r in rows:
        if r["status"] != "member" and role != "captain":
            continue
        if r["status"] == "rejected":
            continue
        starfix_on, game_on = presence_lights(r["starfix_seen"], r["game_seen"])
        members.append(
            {
                "id": r["id"],
                "nickname": r["nickname"],
                "status": r["status"],
                "location": r["location"] or "",
                "system": r["system"] or "",
                "code": r["code"] or "",
                "seen": int(r["seen"]) if r["seen"] else None,
                "ship": r["ship"] or "",
                "gear": gear_items(r["gear"]),
                "server": r["host"] or "",
                "travel": travel_obj(r["travel"]),
                "card": card_obj(r["card"]),
                "starfix": starfix_on,
                "game": game_on,
                "online": game_on,
            }
        )
    routes = []
    if ship["status"] == "member":
        for rt in con.execute(
            "SELECT * FROM route WHERE room=? AND published=1 ORDER BY updated DESC",
            (code,),
        ):
            comments = []
            for c in con.execute(
                """
                SELECT c.id, c.body, c.created, m.nickname
                FROM comment c JOIN member m ON m.id=c.author
                WHERE c.route=? ORDER BY c.created
                """,
                (rt["id"],),
            ):
                comments.append(
                    {"id": c["id"], "authorName": c["nickname"], "body": c["body"]}
                )
            author = con.execute(
                "SELECT nickname FROM member WHERE id=?", (rt["author"],)
            ).fetchone()
            routes.append(
                {
                    "id": rt["id"],
                    "author": rt["author"],
                    "authorName": author["nickname"] if author else "",
                    "title": rt["title"] or "",
                    "note": rt["note"] or "",
                    "points": json.loads(rt["points"] or "[]"),
                    "comments": comments,
                }
            )
    state = {
        "code": code,
        "role": role,
        "captain": room["captain"],
        "status": ship["status"],
        "me": {"id": me["id"], "nickname": me["nickname"]},
        "routeMode": room["route_mode"],
        "open": room_is_open(room),
        "openWait": open_wait(room),
        "members": members,
        "routes": routes,
        "cast": latest_cast(con, code),
        "rally": rally_view(con, code, me["id"]) if ship["status"] == "member" else None,
    }
    if role == "captain" and ship["status"] == "member":
        state["recover"] = ensure_recover(con, room)
    return state


def room_is_open(room):
    try:
        return int(room["open"] or 0) == 1
    except (KeyError, IndexError, TypeError, ValueError):
        return False


def open_wait(room):
    try:
        at = float(room["open_at"] or 0)
    except (KeyError, IndexError, TypeError, ValueError):
        return 0
    if at <= 0:
        return 0
    left = int(at + OPEN_S - now() + 0.999)
    return left if left > 0 else 0


def want_open(raw):
    if isinstance(raw, bool):
        return raw
    if raw in (0, 1):
        return bool(raw)
    if isinstance(raw, str) and raw.lower() in ("1", "true", "public"):
        return True
    if isinstance(raw, str) and raw.lower() in ("0", "false", "private"):
        return False
    return None


def set_room_open(con, room, want):
    want_i = 1 if want else 0
    if want_i == (1 if room_is_open(room) else 0):
        return None
    wait = open_wait(room)
    if wait > 0:
        return {"error": "cooldown", "wait": wait}
    con.execute(
        "UPDATE room SET open=?, open_at=? WHERE code=?",
        (want_i, now(), room["code"]),
    )
    if want_i:
        con.execute(
            "UPDATE membership SET status='member' WHERE room=? AND status='pending'",
            (room["code"],),
        )
    return None


def join_status(room, me, existing):
    if room["captain"] == me["id"] or (existing and existing["status"] == "member") or room_is_open(room):
        return "member"
    return "pending"


def public_rooms(con):
    for row in con.execute("SELECT code FROM room WHERE open=1"):
        settle_room(con, row["code"])
    rows = con.execute(
        """
        SELECT r.code,
               (SELECT nickname FROM member WHERE id=r.captain) AS captain,
               (SELECT COUNT(*) FROM membership s WHERE s.room=r.code AND s.status='member') AS members
        FROM room r
        WHERE r.open=1
        ORDER BY members DESC, r.created ASC
        LIMIT 100
        """
    ).fetchall()
    return [
        {"code": r["code"], "captain": r["captain"] or "", "members": int(r["members"])}
        for r in rows
    ]


def room_brief(con, code):
    if not settle_room(con, code):
        return {"code": code, "exists": False, "online": 0, "members": 0}
    room = con.execute("SELECT code FROM room WHERE code=?", (code,)).fetchone()
    if not room:
        return {"code": code, "exists": False, "online": 0, "members": 0}
    members = con.execute(
        "SELECT COUNT(*) AS n FROM membership WHERE room=? AND status='member'",
        (code,),
    ).fetchone()["n"]
    online = con.execute(
        """
        SELECT COUNT(*) AS n FROM membership s
        JOIN presence p ON p.room=s.room AND p.member=s.member
        WHERE s.room=? AND s.status='member' AND p.starfix_seen>?
        """,
        (code, now() - STARFIX_S),
    ).fetchone()["n"]
    return {"code": code, "exists": True, "online": int(online), "members": int(members)}


def release_other_rooms(con, me, keep=None):
    rows = con.execute(
        "SELECT room, status FROM membership WHERE member=? AND status!='rejected'",
        (me["id"],),
    ).fetchall()
    for row in rows:
        code = row["room"]
        if keep and code == keep:
            continue
        room = con.execute("SELECT captain FROM room WHERE code=?", (code,)).fetchone()
        if not room:
            drop_member(con, code, me["id"])
            continue
        if room["captain"] == me["id"] and row["status"] == "member":
            other = con.execute(
                """
                SELECT member FROM membership
                WHERE room=? AND status='member' AND member!=?
                ORDER BY created LIMIT 1
                """,
                (code, me["id"]),
            ).fetchone()
            if other:
                con.execute("UPDATE room SET captain=? WHERE code=?", (other["member"], code))
                drop_member(con, code, me["id"])
            else:
                wipe_room(con, code)
        else:
            drop_member(con, code, me["id"])


def wipe_room(con, code):
    for rt in con.execute("SELECT id FROM route WHERE room=?", (code,)):
        con.execute("DELETE FROM comment WHERE route=?", (rt["id"],))
    con.execute("DELETE FROM route WHERE room=?", (code,))
    con.execute("DELETE FROM presence WHERE room=?", (code,))
    con.execute("DELETE FROM broadcast WHERE room=?", (code,))
    con.execute("DELETE FROM rally_rsvp WHERE room=?", (code,))
    con.execute("DELETE FROM rally WHERE room=?", (code,))
    con.execute("DELETE FROM membership WHERE room=?", (code,))
    con.execute("DELETE FROM room WHERE code=?", (code,))


def drop_member(con, code, mid):
    con.execute("DELETE FROM presence WHERE room=? AND member=?", (code, mid))
    con.execute("DELETE FROM rally_rsvp WHERE room=? AND member=?", (code, mid))
    con.execute("DELETE FROM membership WHERE room=? AND member=?", (code, mid))
    left = con.execute(
        "SELECT 1 FROM membership WHERE room=? AND status='member'", (code,)
    ).fetchone()
    if left:
        return False
    wipe_room(con, code)
    return True


def players_json(con, code, me):
    st = room_state(con, code, me)
    if not st or st.get("error") or st.get("status") != "member":
        return None
    out = []
    for m in st["members"]:
        if m["status"] != "member":
            continue
        seen = con.execute(
            "SELECT seen FROM presence WHERE room=? AND member=?", (code, m["id"])
        ).fetchone()
        if not seen:
            continue
        stamp = seen["seen"] or None
        out.append(
            {
                "id": m["id"],
                "name": m["nickname"],
                "online": m["game"],
                "starfix": m["starfix"],
                "game": m["game"],
                "last_seen": iso(stamp) if stamp else "",
                "when": iso(stamp) if stamp else "",
                "code": m["code"],
                "location": m["location"],
                "system": m["system"],
                "ship": m.get("ship") or None,
                "gear": m.get("gear") or [],
                "server": m.get("server") or "",
                "travel": m.get("travel"),
                "card": m.get("card"),
            }
        )
    return {"players": out}


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        return

    def _cors(self):
        origin = self.headers.get("Origin")
        if not origin:
            return
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")

    def send_json(self, code, obj):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self._cors()
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self._cors()
        self.end_headers()

    def read_json(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return {}
        if n <= 0 or n > 200_000:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            return {}

    def me(self, con):
        return member_by_token(con, bearer(self.headers.get("Authorization")))

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/api/health":
            self.send_json(200, {"ok": True})
            return
        if path.startswith("/api/"):
            self.api_get(path)
            return
        self.static(path)

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        if not path.startswith("/api/"):
            self.send_json(404, {"error": "not found"})
            return
        body = self.read_json()
        parts = [p for p in path.split("/") if p]
        with LOCK, db() as con:
            me = self.me(con)
            if parts == ["api", "session"]:
                nick = clean_nick(body.get("nickname"))
                if not nick:
                    self.send_json(400, {"error": "nickname"})
                    return
                if me:
                    con.execute("UPDATE member SET nickname=? WHERE id=?", (nick, me["id"]))
                    token = me["token"]
                    mid = me["id"]
                else:
                    token = secrets.token_hex(24)
                    mid = secrets.token_hex(8)
                    con.execute(
                        "INSERT INTO member (id, token, nickname, created) VALUES (?,?,?,?)",
                        (mid, token, nick, now()),
                    )
                self.send_json(200, {"token": token, "id": mid, "nickname": nick})
                return
            if not me:
                self.send_json(401, {"error": "auth"})
                return
            if parts == ["api", "lobby"]:
                set_lobby(con, me, body if isinstance(body, dict) else {})
                self.send_json(200, plaza_view(con, me, 0))
                return
            if parts == ["api", "lobby", "chat"]:
                line, err = add_chat(con, me, body if isinstance(body, dict) else {})
                if err:
                    self.send_json(400 if err == "empty" else 429, {"error": err})
                    return
                self.send_json(200, {"line": line})
                return
            if parts == ["api", "board"]:
                err = add_board(con, me, body if isinstance(body, dict) else {})
                if err:
                    code = 409 if err == "limit" else 400
                    self.send_json(code, {"error": err})
                    return
                self.send_json(200, plaza_view(con, me, 0))
                return
            if parts == ["api", "board", "rsvp"]:
                err = set_board_rsvp(con, me, body if isinstance(body, dict) else {})
                if err:
                    self.send_json(400, {"error": err})
                    return
                self.send_json(200, plaza_view(con, me, 0))
                return
            if parts == ["api", "rooms", "lookup"]:
                raw = body.get("codes") if isinstance(body, dict) else None
                if not isinstance(raw, list):
                    raw = []
                codes = []
                seen = set()
                for item in raw[:90]:
                    code = "".join(ch for ch in str(item or "").upper() if ch.isalnum() or ch == "-")[:12]
                    if code and code not in seen:
                        seen.add(code)
                        codes.append(code)
                self.send_json(200, {"rooms": [room_brief(con, code) for code in codes]})
                return
            if parts == ["api", "rooms"]:
                release_other_rooms(con, me)
                code = new_code(con)
                stamp = now()
                con.execute(
                    "INSERT INTO room (code, captain, route_mode, created, recover) VALUES (?,?,?,?,?)",
                    (code, me["id"], "captain", stamp, new_recover()),
                )
                con.execute(
                    "INSERT INTO membership (room, member, status, created, touched) VALUES (?,?,?,?,?)",
                    (code, me["id"], "member", stamp, stamp),
                )
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "rooms" and parts[3] == "join":
                code = parts[2].upper()
                if not settle_room(con, code):
                    self.send_json(404, {"error": "room"})
                    return
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                if not room:
                    self.send_json(404, {"error": "room"})
                    return
                release_other_rooms(con, me, keep=code)
                existing = con.execute(
                    "SELECT status FROM membership WHERE room=? AND member=?",
                    (code, me["id"]),
                ).fetchone()
                status = join_status(room, me, existing)
                stamp = now()
                con.execute(
                    """
                    INSERT INTO membership (room, member, status, created, touched) VALUES (?,?,?,?,?)
                    ON CONFLICT(room, member) DO UPDATE SET
                      status=excluded.status, touched=excluded.touched
                    """,
                    (code, me["id"], status, stamp, stamp),
                )
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[0] == "api" and parts[1] == "rooms" and parts[3] == "recover":
                code = parts[2].upper()
                if not settle_room(con, code):
                    self.send_json(404, {"error": "room"})
                    return
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                if not room:
                    self.send_json(404, {"error": "room"})
                    return
                secret = clean_recover(body.get("recover"))
                stored = room["recover"] or ""
                if (
                    not secret
                    or not stored
                    or len(secret) != len(stored)
                    or not secrets.compare_digest(secret, stored)
                ):
                    self.send_json(403, {"error": "recover"})
                    return
                if room["captain"] != me["id"]:
                    release_other_rooms(con, me, keep=code)
                    old_id = room["captain"]
                    old = con.execute(
                        "SELECT touched FROM membership WHERE room=? AND member=? AND status='member'",
                        (code, old_id),
                    ).fetchone()
                    stamp = now()
                    con.execute(
                        """
                        INSERT INTO membership (room, member, status, created, touched) VALUES (?,?,?,?,?)
                        ON CONFLICT(room, member) DO UPDATE SET
                          status='member', touched=excluded.touched
                        """,
                        (code, me["id"], "member", stamp, stamp),
                    )
                    con.execute("UPDATE room SET captain=? WHERE code=?", (me["id"], code))
                    if old and old_id != me["id"]:
                        idle_for = now() - float(old["touched"] or 0)
                        if idle_for > POLL_LIVE_S:
                            drop_member(con, code, old_id)
                self.send_json(200, room_state(con, code, me))
                return
            if (
                len(parts) == 6
                and parts[:2] == ["api", "rooms"]
                and parts[3] == "members"
            ):
                code, mid, action = parts[2].upper(), parts[4], parts[5]
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                if not room or room["captain"] != me["id"]:
                    self.send_json(403, {"error": "captain"})
                    return
                if action == "kick":
                    if mid == me["id"]:
                        self.send_json(400, {"error": "member"})
                        return
                    row = con.execute(
                        """
                        SELECT member FROM membership
                        WHERE room=? AND member=? AND status='member'
                        """,
                        (code, mid),
                    ).fetchone()
                    if not row:
                        self.send_json(404, {"error": "member"})
                        return
                    drop_member(con, code, mid)
                    self.send_json(200, room_state(con, code, me))
                    return
                if action not in ("approve", "reject"):
                    self.send_json(400, {"error": "action"})
                    return
                status = "member" if action == "approve" else "rejected"
                cur = con.execute(
                    "UPDATE membership SET status=? WHERE room=? AND member=? AND member!=?",
                    (status, code, mid, me["id"]),
                )
                if cur.rowcount == 0:
                    self.send_json(404, {"error": "member"})
                    return
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[3] in ("leave", "captain", "dissolve"):
                code = parts[2].upper()
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                ship = con.execute(
                    "SELECT status FROM membership WHERE room=? AND member=?",
                    (code, me["id"]),
                ).fetchone()
                if not room or not ship or ship["status"] == "rejected":
                    self.send_json(404, {"error": "room"})
                    return
                kind = parts[3]
                if kind == "dissolve":
                    if room["captain"] != me["id"]:
                        self.send_json(403, {"error": "captain"})
                        return
                    wipe_room(con, code)
                    self.send_json(200, {"dissolved": True})
                    return
                if kind == "captain":
                    if room["captain"] != me["id"] or ship["status"] != "member":
                        self.send_json(403, {"error": "captain"})
                        return
                    target = str(body.get("member") or "")
                    row = con.execute(
                        """
                        SELECT member FROM membership
                        WHERE room=? AND member=? AND status='member' AND member!=?
                        """,
                        (code, target, me["id"]),
                    ).fetchone()
                    if not row:
                        self.send_json(404, {"error": "member"})
                        return
                    con.execute("UPDATE room SET captain=? WHERE code=?", (target, code))
                    self.send_json(200, room_state(con, code, me))
                    return
                if ship["status"] != "member":
                    drop_member(con, code, me["id"])
                    self.send_json(200, {"left": True})
                    return
                if room["captain"] != me["id"]:
                    gone = drop_member(con, code, me["id"])
                    self.send_json(200, {"left": True, "dissolved": gone})
                    return
                if body.get("dissolve"):
                    wipe_room(con, code)
                    self.send_json(200, {"dissolved": True})
                    return
                target = str(body.get("transfer") or "")
                if target:
                    row = con.execute(
                        """
                        SELECT member FROM membership
                        WHERE room=? AND member=? AND status='member' AND member!=?
                        """,
                        (code, target, me["id"]),
                    ).fetchone()
                    if not row:
                        self.send_json(404, {"error": "member"})
                        return
                    con.execute("UPDATE room SET captain=? WHERE code=?", (target, code))
                    drop_member(con, code, me["id"])
                    self.send_json(200, {"left": True})
                    return
                others = con.execute(
                    """
                    SELECT member FROM membership
                    WHERE room=? AND status='member' AND member!=?
                    """,
                    (code, me["id"]),
                ).fetchone()
                self.send_json(409, {"error": "handoff" if others else "solo"})
                return
            if len(parts) == 4 and parts[3] == "open":
                code = parts[2].upper()
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                if not room or room["captain"] != me["id"]:
                    self.send_json(403, {"error": "captain"})
                    return
                want = want_open(body.get("open") if isinstance(body, dict) else None)
                if want is None:
                    self.send_json(400, {"error": "open"})
                    return
                blocked = set_room_open(con, room, want)
                if blocked:
                    self.send_json(429, blocked)
                    return
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[3] == "settings":
                code = parts[2].upper()
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                if not room or room["captain"] != me["id"]:
                    self.send_json(403, {"error": "captain"})
                    return
                mode = body.get("routeMode")
                if mode not in ("captain", "members"):
                    self.send_json(400, {"error": "mode"})
                    return
                con.execute("UPDATE room SET route_mode=? WHERE code=?", (mode, code))
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[3] == "broadcast":
                code = parts[2].upper()
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                ship = con.execute(
                    "SELECT status FROM membership WHERE room=? AND member=?",
                    (code, me["id"]),
                ).fetchone()
                if not room or not ship or ship["status"] != "member" or room["captain"] != me["id"]:
                    self.send_json(403, {"error": "captain"})
                    return
                text = clean_cast(body.get("body") if isinstance(body, dict) else None)
                if not text:
                    self.send_json(400, {"error": "empty"})
                    return
                bid = secrets.token_hex(8)
                con.execute(
                    "INSERT INTO broadcast (id, room, author, body, created) VALUES (?,?,?,?,?)",
                    (bid, code, me["id"], text, now()),
                )
                con.execute(
                    "DELETE FROM broadcast WHERE room=? AND id!=?",
                    (code, bid),
                )
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[3] == "rally":
                code = parts[2].upper()
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                ship = con.execute(
                    "SELECT status FROM membership WHERE room=? AND member=?",
                    (code, me["id"]),
                ).fetchone()
                if not room or not ship or ship["status"] != "member" or room["captain"] != me["id"]:
                    self.send_json(403, {"error": "captain"})
                    return
                if isinstance(body, dict) and body.get("clear"):
                    con.execute("DELETE FROM rally_rsvp WHERE room=?", (code,))
                    con.execute("DELETE FROM rally WHERE room=?", (code,))
                    self.send_json(200, room_state(con, code, me))
                    return
                place = clean_label(body.get("place") if isinstance(body, dict) else None, 80)
                name = clean_label(body.get("name") if isinstance(body, dict) else None, 80)
                system = clean_label(body.get("system") if isinstance(body, dict) else None, 24) or ""
                at = clean_when(body.get("at") if isinstance(body, dict) else None)
                if not place or not name or at is None:
                    self.send_json(400, {"error": "rally"})
                    return
                if system.lower() not in ("", "stanton", "pyro", "nyx"):
                    system = ""
                rid = secrets.token_hex(8)
                con.execute("DELETE FROM rally_rsvp WHERE room=?", (code,))
                con.execute("DELETE FROM rally WHERE room=?", (code,))
                con.execute(
                    "INSERT INTO rally (room, id, place, name, system, at, created) VALUES (?,?,?,?,?,?,?)",
                    (code, rid, place, name, system.lower(), at, now()),
                )
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 5 and parts[3] == "rally" and parts[4] == "rsvp":
                code = parts[2].upper()
                room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
                ship = con.execute(
                    "SELECT status FROM membership WHERE room=? AND member=?",
                    (code, me["id"]),
                ).fetchone()
                row = con.execute("SELECT id FROM rally WHERE room=?", (code,)).fetchone()
                if not room or not ship or ship["status"] != "member" or not row:
                    self.send_json(403, {"error": "forbidden"})
                    return
                going = body.get("going") if isinstance(body, dict) else None
                if going not in (True, False, 0, 1):
                    self.send_json(400, {"error": "going"})
                    return
                con.execute(
                    """
                    INSERT INTO rally_rsvp (room, rally, member, going) VALUES (?,?,?,?)
                    ON CONFLICT(room, member) DO UPDATE SET rally=excluded.rally, going=excluded.going
                    """,
                    (code, row["id"], me["id"], 1 if going else 0),
                )
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 4 and parts[3] == "presence":
                code = parts[2].upper()
                st = room_state(con, code, me)
                if not st or st.get("error") or st.get("status") != "member":
                    self.send_json(403, {"error": "forbidden"})
                    return
                if not save_presence(con, code, me["id"], body):
                    self.send_json(400, {"error": "location"})
                    return
                self.send_json(200, {"ok": True})
                return
            if len(parts) == 4 and parts[3] == "routes":
                code = parts[2].upper()
                if not self.can_draw(con, code, me):
                    self.send_json(403, {"error": "route"})
                    return
                pts = self.clean_points(body.get("points"))
                if len(pts) < 2:
                    self.send_json(400, {"error": "points"})
                    return
                rid = secrets.token_hex(8)
                con.execute(
                    """
                    INSERT INTO route (id, room, author, title, note, points, published, created, updated)
                    VALUES (?,?,?,?,?,?,1,?,?)
                    """,
                    (
                        rid,
                        code,
                        me["id"],
                        str(body.get("title") or "")[:40],
                        str(body.get("note") or "")[:500],
                        json.dumps(pts, ensure_ascii=False),
                        now(),
                        now(),
                    ),
                )
                self.send_json(200, room_state(con, code, me))
                return
            if len(parts) == 6 and parts[3] == "routes" and parts[5] == "comments":
                code, rid = parts[2].upper(), parts[4]
                st = room_state(con, code, me)
                if not st or st.get("status") != "member":
                    self.send_json(403, {"error": "forbidden"})
                    return
                text = "".join(ch for ch in str(body.get("body") or "") if ch >= " ").strip()
                if not text or len(text) > 300:
                    self.send_json(400, {"error": "body"})
                    return
                rt = con.execute(
                    "SELECT id FROM route WHERE id=? AND room=? AND published=1", (rid, code)
                ).fetchone()
                if not rt:
                    self.send_json(404, {"error": "route"})
                    return
                con.execute(
                    "INSERT INTO comment (id, route, author, body, created) VALUES (?,?,?,?,?)",
                    (secrets.token_hex(8), rid, me["id"], text, now()),
                )
                self.send_json(200, room_state(con, code, me))
                return
        self.send_json(404, {"error": "not found"})

    def do_DELETE(self):
        path = unquote(urlparse(self.path).path)
        parts = [p for p in path.split("/") if p]
        if not (len(parts) == 5 and parts[:2] == ["api", "rooms"] and parts[3] == "routes"):
            self.send_json(404, {"error": "not found"})
            return
        code, rid = parts[2].upper(), parts[4]
        with LOCK, db() as con:
            me = self.me(con)
            if not me:
                self.send_json(401, {"error": "auth"})
                return
            room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
            rt = con.execute(
                "SELECT * FROM route WHERE id=? AND room=?", (rid, code)
            ).fetchone()
            if not room or not rt:
                self.send_json(404, {"error": "route"})
                return
            if rt["author"] != me["id"] and room["captain"] != me["id"]:
                self.send_json(403, {"error": "forbidden"})
                return
            con.execute("DELETE FROM comment WHERE route=?", (rid,))
            con.execute("DELETE FROM route WHERE id=?", (rid,))
            self.send_json(200, room_state(con, code, me))

    def api_get(self, path):
        parts = [p for p in path.split("/") if p]
        if parts == ["api", "rooms", "public"]:
            with LOCK, db() as con:
                self.send_json(200, {"rooms": public_rooms(con)})
            return
        if parts == ["api", "invite"]:
            with LOCK, db() as con:
                me = self.me(con)
            if not me:
                self.send_json(401, {"error": "auth"})
                return
            qs = parse_qs(urlparse(self.path).query)
            self.send_json(200, invite_card((qs.get("kind") or [""])[0], (qs.get("contact") or [""])[0]))
            return
        with LOCK, db() as con:
            me = self.me(con)
            if not me:
                self.send_json(401, {"error": "auth"})
                return
            if parts == ["api", "plaza"]:
                try:
                    after = int(parse_qs(urlparse(self.path).query).get("after", ["0"])[0] or 0)
                except (TypeError, ValueError):
                    after = 0
                if after < 0:
                    after = 0
                self.send_json(200, plaza_view(con, me, after))
                return
            if len(parts) == 3 and parts[:2] == ["api", "rooms"]:
                code = parts[2].upper()
                touch_member(con, code, me["id"])
                if not settle_room(con, code):
                    self.send_json(404, {"error": "room"})
                    return
                st = room_state(con, code, me)
                if not st:
                    self.send_json(404, {"error": "room"})
                elif st.get("error"):
                    self.send_json(403, st)
                else:
                    self.send_json(200, st)
                return
            if len(parts) == 4 and parts[3] == "players":
                data = players_json(con, parts[2].upper(), me)
                if data is None:
                    self.send_json(403, {"error": "forbidden"})
                else:
                    self.send_json(200, data)
                return
        self.send_json(404, {"error": "not found"})

    def can_draw(self, con, code, me):
        room = con.execute("SELECT * FROM room WHERE code=?", (code,)).fetchone()
        ship = con.execute(
            "SELECT status FROM membership WHERE room=? AND member=?", (code, me["id"])
        ).fetchone()
        if not room or not ship or ship["status"] != "member":
            return False
        if room["route_mode"] == "members":
            return True
        return room["captain"] == me["id"]

    def clean_points(self, raw):
        if not isinstance(raw, list):
            return []
        out = []
        for p in raw[:40]:
            if not isinstance(p, dict):
                continue
            pid = str(p.get("id") or "")[:80]
            name = str(p.get("n") or "")[:80]
            sy = str(p.get("sy") or "")[:40]
            if pid and name:
                out.append({"id": pid, "n": name, "sy": sy})
        return out

    def static(self, path):
        rel = path.lstrip("/") or "index.html"
        if rel.endswith("/"):
            rel += "index.html"
        target = (ROOT / rel).resolve()
        if ROOT not in target.parents and target != ROOT:
            self.send_error(403)
            return
        try:
            parts = target.relative_to(ROOT).parts
        except ValueError:
            self.send_error(403)
            return
        if (parts and parts[0].lower() in BLOCK_DIR) or target.suffix.lower() in BLOCK_EXT or target.name.lower() in BLOCK_NAME or target.name.startswith("."):
            self.send_error(404)
            return
        if not target.is_file() or target == DB or "rooms.sqlite" in target.name:
            self.send_error(404)
            return
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", MIME.get(target.suffix.lower(), "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)


def lan_ip():
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        return ip
    except OSError:
        return ""


def main():
    env_port = os.environ.get("PORT")
    ap = argparse.ArgumentParser(description="Serve SC LMW and team rooms")
    ap.add_argument("--host", default="0.0.0.0" if env_port else HOST)
    ap.add_argument("--port", type=int, default=int(env_port or PORT))
    args = ap.parse_args()
    init_db()
    ThreadingHTTPServer.allow_reuse_address = True
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print("SC LMW  port %d" % args.port)
    if args.host in ("0.0.0.0", "::") and not env_port:
        ip = lan_ip()
        if ip and not ip.startswith("127."):
            print("same network  http://%s:%d/" % (ip, args.port))
    httpd.serve_forever()


if __name__ == "__main__":
    main()
