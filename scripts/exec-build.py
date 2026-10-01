#!/usr/bin/env python3
# Executive-Hangar-Zyklus (PYAM-EXHANG-0-1): holt Anker, Drift und Phasen aus exec.xyxyll.com/app.js (MIT, Xyxyll) und legt sie
# als data/exec.json ab. Optional: ohne die Datei rechnet js/guides.js mit dem eingebauten Stand. Gern per Cron stuendlich.
# EN: fetches the Executive Hangar cycle from exec.xyxyll.com (MIT) into data/exec.json. Optional; without it js/guides.js
#     uses its built-in values. Run hourly via cron if you like.
# Passt ein Wert nicht, bleibt die alte Datei liegen und der Fehler geht laut ins Log: lieber alter Anker als geratener.
import json, re, sys, urllib.request, datetime, os
SRC = "https://exec.xyxyll.com/app.js"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "exec.json")
js = urllib.request.urlopen(urllib.request.Request(SRC, headers={"User-Agent": "SC LMW (github.com/nico-gordon-gilles/sc-lmw)"}), timeout=20).read().decode()
def num(name):
    m = re.search(r"const\s+" + name + r"\s*=\s*(\d+)\s*;", js)
    if not m: sys.exit("exec-mirror: %s fehlt in app.js" % name)
    return int(m.group(1))
m = re.search(r"INITIAL_OPEN_TIME\s*=\s*new Date\('([^']+)'\)", js)
if not m: sys.exit("exec-mirror: INITIAL_OPEN_TIME fehlt in app.js")
anchor = datetime.datetime.fromisoformat(m.group(1))
on, off, drift = num("DESIGN_ONLINE_MIN"), num("DESIGN_OFFLINE_MIN"), num("CYCLE_DRIFT_MS")
if not (30 <= on <= 180 and 30 <= off <= 300 and 0 <= drift < 60000): sys.exit("exec-mirror: Werte unplausibel %s/%s/%s" % (on, off, drift))
ver = (re.search(r"@version\s+(\S+)", js) or [None, "?"])[1]
d = {"anchor_ms": int(anchor.timestamp() * 1000), "online_min": on, "offline_min": off, "drift_ms": drift,
     "source": "exec.xyxyll.com", "version": ver, "fetched": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")}
os.makedirs(os.path.dirname(OUT), exist_ok=True); tmp = OUT + ".tmp"; json.dump(d, open(tmp, "w")); os.chmod(tmp, 0o644); os.replace(tmp, OUT)
print("exec-mirror ok", json.dumps(d))
