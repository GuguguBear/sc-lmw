# Personal timeline parsed from Game.log on this computer.
# Events stay in history.jsonl on this computer. They are not posted to a room.
# The Store package keeps that file under LocalAppData. The GitHub exe keeps it beside itself.

import json
import re
import threading
from datetime import datetime
from pathlib import Path

MAKER_NAME = {
    "AEGS": "Aegis", "ANVL": "Anvil", "CRUS": "Crusader", "MISC": "MISC",
    "ORIG": "Origin", "RSI": "RSI", "DRAK": "Drake", "BANU": "Banu",
    "XIAN": "Aopoa", "TMBL": "Tumbril", "GRIN": "Greycat", "KRIG": "Kruger",
    "CNOU": "Consolidated", "ESPR": "Esperia", "GAMA": "Gatac",
    "VNCL": "Vanduul", "MRAI": "Mirai",
}
BODY_N = {"1": "HUR", "2": "CRU", "3": "ARC", "4": "MIC"}
MISSION_PREFIX = ("已接受合约", "新任务", "任务完成", "合约完成", "合约失败", "任务撤销", "合约共享")
KEEP = 12000

TIME_RE = re.compile(r"<(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)>")
SHIP_RE = re.compile(
    r"\b((?:AEGS|ANVL|CRUS|MISC|ORIG|RSI|DRAK|BANU|XIAN|TMBL|GRIN|KRIG|CNOU|ESPR|GAMA|VNCL|MRAI)(?:_[A-Za-z][A-Za-z0-9]*)+)_\d{6,}"
)
BUY_RE = re.compile(
    r"SendShop(Buy|Sell)Request\b.*?shopName\[([^\]]*)\].*?client_price\[([0-9.]+)\].*?itemName\[([^\]]*)\].*?quantity\[(\d+)\]"
)
FLOW_RE = re.compile(r"RmShopFlowResponse\b.*?result\[(\w+)\].*?type\[(Buying|Selling)\]")
NOTE_RE = re.compile(r'Notification "(.*?)"')
JUMP_RE = re.compile(r"Projected Start Location is (.+?) for .+? to destination (\S+)")
LAG_RE = re.compile(r"\bLOC_RR_S([1-4])_L(\d+)\b", re.I)
LAG_WORD = re.compile(r"\b(HUR|CRU|ARC|MIC)\s*[- ]?\s*L(\d+)\b", re.I)
TRANS = re.compile(
    r"Transitioning from zone [\w.-]+ in [\w.-]+ to zone ([\w.-]+) in [\w.-]+",
    re.I,
)
END_RE = re.compile(r"CompletionType\[(Complete|Abandon|Fail)\]")
GEN_RE = re.compile(r"Generated Locations - .*?\(([^\[\]()]{1,40}) \[\d+\] \[[A-Za-z0-9_]+\]\)")

NICK_RE = re.compile(r'nickname="([^"]+)"')
KILL_RE = re.compile(r"CActor::Kill: '([^']+)' \[\d+\] in zone '[^']*' killed by '([^']+)'")
WRECK_RE = re.compile(r"advanced from destroy level \d to (?P<to>\d) caused by '([^']+)'")
ID_SUFFIX = re.compile(r"_\d{9,}$")
CRASH_HOW = (
    ("Is GPU crash: Yes", "gpu"),
    ("Is Timeout: Yes", "freeze"),
    ("Is out of system memory: Yes", "ram"),
    ("Is out of video memory: Yes", "vram"),
    ("Exception ACCESS_VIOLATION", "fault"),
)

LOCK = threading.Lock()
EVENTS = []
SEEN = set()
STORE = None
REV = 0


def new_state():
    return {
        "buy": None, "ship": "", "dest": "", "destKind": "", "destCode": "",
        "armistice": "", "watch": "", "law": "", "universe": False, "hurt": False,
    }


LIVE = new_state()


def reset():
    global LIVE, EVENTS, SEEN, STORE, REV
    with LOCK:
        LIVE = new_state()
        EVENTS = []
        SEEN = set()
        STORE = None
        REV += 1


def open_store(path):
    global STORE, EVENTS, SEEN
    file = Path(path)
    rows = []
    seen = set()
    if file.is_file():
        try:
            for line in file.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(row, dict) and row.get("id"):
                    rows.append(row)
                    seen.add(row["id"])
        except OSError:
            rows = []
            seen = set()
    with LOCK:
        STORE = file
        EVENTS = rows[-KEEP:]
        SEEN = seen


def public(limit=400):
    with LOCK:
        rows = EVENTS[-limit:]
    out = []
    for row in reversed(rows):
        item = {k: v for k, v in row.items() if k != "id"}
        out.append(item)
    return out


def note(line, state=None):
    st = state if state is not None else LIVE
    if st is None:
        return []
    found = []
    for row in parse(line or "", st):
        sig = row["kind"] + "|" + json.dumps(
            {k: v for k, v in row.items() if k not in ("id", "t")},
            ensure_ascii=False, sort_keys=True,
        )
        if st.get("echo") == sig:
            continue
        st["echo"] = sig
        found.append(row)
    if found:
        remember(found)
    return found


def backfill(log_path):
    path = Path(log_path) if log_path else None
    files = []
    if path is not None:
        folder = path.parent / "logbackups"
        if folder.is_dir():
            try:
                files.extend(sorted(folder.glob("*.log"), key=lambda item: item.stat().st_mtime))
            except OSError:
                pass
        if path.is_file():
            files.append(path)
    state = new_state()
    count = 0
    for file in files:
        try:
            handle = file.open("r", encoding="utf-8", errors="replace")
        except OSError:
            continue
        with handle:
            for line in handle:
                count += len(note(line, state))
    return count


def remember(rows):
    global EVENTS, SEEN, REV
    with LOCK:
        added = False
        for row in rows:
            if row["id"] in SEEN:
                continue
            SEEN.add(row["id"])
            EVENTS.append(row)
            added = True
            REV += 1
            if STORE is not None:
                try:
                    with STORE.open("a", encoding="utf-8") as handle:
                        handle.write(json.dumps(row, ensure_ascii=False) + "\n")
                except OSError:
                    pass
        if added and len(EVENTS) > KEEP:
            EVENTS = EVENTS[-KEEP:]
            SEEN = {row["id"] for row in EVENTS}
            if STORE is not None:
                try:
                    STORE.write_text(
                        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in EVENTS),
                        encoding="utf-8",
                    )
                except OSError:
                    pass


def parse(line, state):
    when = TIME_RE.search(line)
    stamp = when.group(1) if when else ""
    rows = []
    if "Legacy login success" in line:
        rows.append(event(stamp, "online"))
    zone = TRANS.search(line)
    if zone:
        rows.append(event(stamp, "place", code=zone.group(1)))
    end = END_RE.search(line)
    if end and "EndMission" in line:
        rows.append(event(stamp, "contract", result=end.group(1).lower()))
    gen = GEN_RE.search(line)
    if gen:
        site = gen.group(1).strip()
        if site and site != state.get("target"):
            state["target"] = site
            rows.append(event(stamp, "mission", say=site[:180], code=""))
    if "Action: Next" in line:
        note = NOTE_RE.search(line)
        if note:
            say = note.group(1).strip().rstrip(":：").strip()
            if say.startswith(MISSION_PREFIX):
                code, _label = code_in_text(say)
                rows.append(event(stamp, "mission", say=say[:180], code=code))
    buy = BUY_RE.search(line)
    if buy:
        kind = "buy" if buy.group(1).lower() == "buy" else "sell"
        try:
            price = float(buy.group(3))
        except ValueError:
            price = 0
        state["buy"] = {
            "t": stamp,
            "kind": kind,
            "shop": buy.group(2)[:80],
            "price": int(price) if price == int(price) else price,
            "item": buy.group(4)[:80],
            "qty": int(buy.group(5)),
        }
    flow = FLOW_RE.search(line)
    pending = state.get("buy")
    if flow and pending:
        result, flow_kind = flow.group(1), flow.group(2)
        same = (pending["kind"] == "buy" and flow_kind == "Buying") or (
            pending["kind"] == "sell" and flow_kind == "Selling"
        )
        if same and result == "Success":
            rows.append(event(
                pending["t"] or stamp,
                pending["kind"],
                shop=pending["shop"],
                price=pending["price"],
                item=pending["item"],
                qty=pending["qty"],
            ))
        state["buy"] = None
    if "CSCItemNavigation::" in line:
        found = SHIP_RE.search(line)
        ship = pretty_ship(found.group(1)) if found else ""
        if ship and ship != state.get("ship"):
            jumping = "Projected Start Location is " in line or "arrived at final destination" in line.lower()
            if not jumping:
                rows.append(event(stamp, "ship", ship=ship))
            state["ship"] = ship
        lag = LAG_RE.search(line)
        if lag and "selected point" in line.lower():
            code, label = lagrange(lag.group(1), lag.group(2))
            state["dest"], state["destKind"], state["destCode"] = label, "place", code
            rows.append(event(stamp, "aim", dest=label, destKind="place", code=code, ship=state.get("ship") or ""))
        jump = JUMP_RE.search(line)
        if jump:
            start = jump.group(1).strip()[:80]
            token = jump.group(2).strip(".,)")
            dest, dest_kind, dest_code = destination(token)
            state["dest"], state["destKind"], state["destCode"] = dest, dest_kind, dest_code
            rows.append(event(
                stamp, "jump",
                start=start, dest=dest, destKind=dest_kind,
                code=dest_code, ship=state.get("ship") or "",
            ))
        if "arrived at final destination" in line.lower():
            rows.append(event(
                stamp, "arrive",
                dest=state.get("dest") or "",
                destKind=state.get("destKind") or "",
                code=state.get("destCode") or "",
                ship=state.get("ship") or "",
            ))
    named = NICK_RE.search(line)
    if named:
        state["nick"] = named.group(1)[:80]
    if "Added notification" in line or 'Notification "' in line:
        quoted = re.search(r'notification "(.*?)"', line, re.I)
        title = quoted.group(1) if quoted else ""
        rows.extend(hud(title, stamp, state))
    if "CSystem::Quit invoked" in line:
        state["universe"] = False
        rows.append(event(stamp, "leave"))
    if "{Join PU}" in line and not state.get("universe"):
        state["universe"] = True
        rows.append(event(stamp, "universe"))
    if "ClearDriver:" in line and "Local client" in line:
        rows.append(event(stamp, "unseat"))
    if "Perform surgery event Success" in line:
        state["hurt"] = False
        rows.append(event(stamp, "heal"))
    for marker, how in CRASH_HOW:
        if marker in line:
            rows.append(event(stamp, "crash", how=how))
            break
    nick = state.get("nick") or ""
    killed = KILL_RE.search(line)
    if killed and nick:
        victim, killer = killed.group(1), killed.group(2)
        if killer == nick and victim != nick:
            rows.append(event(stamp, "strike"))
        elif victim == nick and killer != nick:
            npc = bool(ID_SUFFIX.search(killer) or killer.startswith("PU_") or "NPC" in killer or "_AI_" in killer)
            rows.append(event(stamp, "down", by="npc" if npc else "player"))
    if "<Vehicle Destruction>" in line and nick:
        wrecked = WRECK_RE.search(line)
        if wrecked and wrecked.group("to") == "2" and wrecked.group(2) == nick:
            rows.append(event(stamp, "wreck"))
    return rows


def _named(title, prefixes):
    for prefix in prefixes:
        if title.startswith(prefix):
            name = title[len(prefix):].strip().lstrip(":：").strip()
            if name.endswith(":") or name.endswith("："):
                name = name[:-1].strip()
            return name[:80]
    return ""


def _pact(state, stamp, phase, title):
    # The HUD repeats the same contract line. One beat per minute is the trip.
    sig = phase + "|" + title
    minute = (stamp or "")[:16]
    if state.get("pact") == sig and state.get("pact_t") == minute:
        return []
    state["pact"] = sig
    state["pact_t"] = minute
    return [event(stamp, "pact", phase=phase, title=title)]


def _changed(state, key, value):
    if state.get(key) == value:
        return False
    state[key] = value
    return True


def hud(title, stamp, state):
    # The HUD title is the player's own client text. Names of other people
    # are not taken from it. A repeated status is kept once until it changes.
    rows = []
    if not title:
        return rows
    if "犯罪等级已清除" in title or "CrimeStat Cleared" in title:
        rows.append(event(stamp, "crime", level=0))
    elif "犯罪等级" in title or title.startswith("CrimeStat"):
        digit = re.search(r"(\d)", title)
        rows.append(event(stamp, "crime", level=int(digit.group(1)) if digit else 1))
    accepted = _named(title, ("已接受合约", "Contract Accepted"))
    finished = _named(title, ("合约完成", "Contract Complete"))
    failed = _named(title, ("合约失败", "Contract Failed"))
    shared = _named(title, ("合约共享", "Contract Shared"))
    if accepted:
        rows.extend(_pact(state, stamp, "accept", accepted))
    elif finished:
        rows.extend(_pact(state, stamp, "done", finished))
    elif failed:
        rows.extend(_pact(state, stamp, "fail", failed))
    elif shared:
        rows.extend(_pact(state, stamp, "share", shared))
    compact = title.replace(" ", "")
    law = re.match(r"^(?:已)?进入(.+?)管辖区", compact)
    if not law:
        law = re.match(r"^Entered(.+?)Jurisdiction", title, re.I)
    if law and _changed(state, "law", law.group(1).strip()[:40]):
        rows.append(event(stamp, "law", where=law.group(1).strip()[:40]))
    if "禁火区" in compact or "Armistice" in title:
        side = "out" if ("远离" in compact or "Leaving" in title) else "in"
        if _changed(state, "armistice", side):
            rows.append(event(stamp, "armistice", side=side))
    elif "监管区域" in compact or "Monitored Space" in title:
        side = "out" if ("离开" in compact or "Exited" in title) else "in"
        if _changed(state, "watch", side):
            rows.append(event(stamp, "watch", side=side))
    if compact.startswith("机库出入申请已批准"):
        rows.append(event(stamp, "hangar", step="ask"))
    elif compact.startswith("机库请求已完成") or title.startswith("Hangar Request Completed"):
        rows.append(event(stamp, "hangar", step="ready"))
    if compact.startswith("局部瘫痪") or title.startswith("Incapacitated"):
        if not state.get("hurt"):
            state["hurt"] = True
            rows.append(event(stamp, "hurt"))
    return rows


def revision():
    with LOCK:
        return REV


def local_day(stamp):
    if not stamp:
        return ""
    text = stamp[:-1] + "+00:00" if str(stamp).endswith("Z") else str(stamp)
    try:
        return datetime.fromisoformat(text).astimezone().strftime("%Y-%m-%d")
    except ValueError:
        return str(stamp)[:10]


def _pack_session(events, index):
    places = []
    ships = []
    contracts = {"complete": 0, "fail": 0, "abandon": 0}
    bought = 0
    sold = 0
    missions = 0
    for row in events:
        if row.get("kind") == "place" and row.get("code") and row["code"] not in places:
            places.append(row["code"])
        ship = row.get("ship") or ""
        if ship and ship not in ships:
            ships.append(ship)
        if row.get("kind") == "contract":
            result = row.get("result") or "complete"
            if result not in contracts:
                result = "complete"
            contracts[result] += 1
        if row.get("kind") == "buy":
            bought += 1
        if row.get("kind") == "sell":
            sold += 1
        if row.get("kind") == "mission":
            missions += 1
    start = events[0].get("t") or ""
    kept = []
    for row in events:
        if row.get("kind") == "mission":
            say = row.get("say") or ""
            if say.startswith(MISSION_PREFIX) or say.startswith("新的任务") or say.startswith("New Objective"):
                continue
        kept.append(row)
    shown = kept if len(kept) <= 400 else [kept[0]] + kept[-399:]
    visible = [{k: v for k, v in row.items() if k != "id"} for row in shown]
    return {
        "key": "%s|%s" % (index, start),
        "day": local_day(start),
        "start": start,
        "end": events[-1].get("t") or start,
        "places": places[:8],
        "ships": ships[:4],
        "contracts": contracts,
        "bought": bought,
        "sold": sold,
        "missions": missions,
        "count": len(events),
        "events": visible,
    }


def group_days(rows):
    sessions = []
    current = None
    for row in rows:
        if not isinstance(row, dict):
            continue
        if current is None or row.get("kind") == "online":
            current = []
            sessions.append(current)
        current.append(row)
    buckets = {}
    order = []
    for index, events in enumerate(sessions):
        if not events:
            continue
        packed = _pack_session(events, index)
        day = packed["day"] or "?"
        if day not in buckets:
            buckets[day] = []
            order.append(day)
        buckets[day].append(packed)
    def day_key(day):
        text = str(day or "")
        if len(text) == 10 and text[4] == "-" and text[7] == "-":
            return text
        return ""
    order.sort(key=day_key, reverse=True)
    for day in order:
        buckets[day].sort(key=lambda sess: sess.get("start") or "")
    return [{"day": day, "sessions": buckets[day]} for day in order]


def days():
    with LOCK:
        rows = list(EVENTS)
    return group_days(rows)


def destination(token):
    lag = LAG_RE.fullmatch(token)
    if lag:
        code, label = lagrange(lag.group(1), lag.group(2))
        return label, "place", code
    if token.startswith("MISSION_"):
        return "", "beacon", ""
    if "{" in token or ".soc" in token or "_" in token:
        return "", "raw", ""
    if token.startswith("OOC_"):
        return token.split("_")[-1][:80], "raw", ""
    return token[:80], "raw", ""


def lagrange(body, lag):
    name = BODY_N.get(str(body), str(body).upper())
    if name not in ("HUR", "CRU", "ARC", "MIC"):
        return "", ""
    return "RR_%s_L%s" % (name, lag), "%s-L%s" % (name, lag)


def code_in_text(text):
    found = LAG_WORD.search(text or "")
    if found:
        return lagrange(found.group(1).upper(), found.group(2))
    if "赫" in (text or ""):
        found = re.search(r"L(\d+)", text)
        if found:
            return lagrange("HUR", found.group(1))
    return "", ""


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


def event(stamp, kind, **fields):
    row = {"t": stamp, "kind": kind}
    row.update(fields)
    row["id"] = stamp + "|" + kind + "|" + json.dumps(fields, ensure_ascii=False, sort_keys=True)
    return row
