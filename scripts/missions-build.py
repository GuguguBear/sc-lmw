#!/usr/bin/env python3
# Baut data/missions.json: welche Missionsarten in welchem Gebiet angeboten werden, dazu Blueprint-Pools
# und Wikelo-Tauschgeschaefte. Quelle: scunpacked-data/contracts (Datamine je Patch), per git sparse
# checkout in .cache/scunpacked-data. Braucht die data/sys-*.json aus systems-build.py.
#
# Builds data/missions.json: which mission types are offered in which area, plus blueprint reward pools
# and Wikelo trade offers. Source: scunpacked-data/contracts (datamine per game patch), via git sparse
# checkout into .cache/scunpacked-data. Needs the data/sys-*.json files from systems-build.py.
#
# Aufruf/usage: python3 scripts/missions-build.py [ziel.json/target.json] [karten.json.../maps.json...]
# Schreibt nur bei plausiblem Ergebnis, sonst Exit 1. / Only writes if plausible, otherwise exits 1.
import glob
import json
import os
import re
import subprocess
import sys
import datetime

import _common as C

_args = [a for a in sys.argv[1:] if not a.startswith("--")]
OUT = _args[0] if _args else str(C.DATA_DIR / "missions.json")
MAPS = _args[1:] or sorted(glob.glob(str(C.DATA_DIR / "sys-*.json")))
REPO = str(C.SCU_REPO_DIR)
URL = C.SCU_REPO_URL


def git(*a): return subprocess.run(["git", "-C", REPO] + list(a), capture_output=True, text=True, timeout=900, check=True).stdout


C.ensure_dirs()
if not os.path.isdir(REPO + "/.git"):
    os.makedirs(os.path.dirname(REPO), exist_ok=True)
    subprocess.run(["git", "clone", "-q", "--depth", "1", "--filter=blob:none", "--sparse", URL, REPO], check=True, timeout=900)
    git("sparse-checkout", "set", "contracts")
else:
    git("fetch", "-q", "--depth", "1", "origin", "master"); git("reset", "-q", "--hard", "origin/master")
ver = git("log", "-1", "--format=%s").strip()

if not MAPS:
    print("ABBRUCH: keine data/sys-*.json gefunden -- erst systems-build.py laufen lassen.", file=sys.stderr)
    print("ABORT: no data/sys-*.json found -- run systems-build.py first.", file=sys.stderr)
    sys.exit(1)
objs = [o for m in MAPS for o in json.load(open(m, encoding="utf-8"))["objects"]]
# Kategorie je Item aus einem optionalen lokalen Item-Katalog (data/items.json). Dieses Projekt liefert
# noch keinen solchen Katalog mit; fehlt er, bleiben die Kategorien einfach leer (kein Abbruch).
# Category per item from an optional local item catalog (data/items.json). This project does not ship
# such a catalog yet; if it's missing, categories simply stay empty (not a hard failure).
cat = {}
try:
    for it in json.load(open(os.environ.get("LIVEMAP_ITEMS", str(C.DATA_DIR / "items.json")), encoding="utf-8"))["items"]:
        if it.get("n") and it.get("s"): cat.setdefault(it["n"].lower(), it["s"])
except Exception as ex:
    print("HINWEIS/NOTE: data/items.json nicht gefunden, Blueprint-Kategorien bleiben leer:", ex, file=sys.stderr)
oid = {o["id"] for o in objs}

BAD = re.compile(r"~mission|\[|UNINITIALIZED|NOT FOUND", re.I)
def resolve(s, tok):
    if not s: return ""
    for _ in range(3):
        s = re.sub(r"~mission\(([^()]+)\)|\[([^\[\]]+)\]",
                   lambda m: (tok.get(m.group(1) or m.group(2)) or [m.group(0)])[0]
                   if isinstance(tok.get(m.group(1) or m.group(2)), list) else m.group(0), s)
    s = s.strip()
    return "" if (not s or BAD.search(s)) else s

def giver(c):
    for g in (c.get("MissionGiver"), (c.get("Faction") or {}).get("Name")):
        if g and not BAD.search(g):
            g = g.replace("_", " ")
            return re.sub(r"(?<=[a-z])(?=[A-Z])", " ", g).strip()
    return "Unbekannt"

groups = {}
wikelo, favor_src = [], {}
# Je Blueprint: welche Mission (Titel/Art/Auftraggeber) ihn gibt, Pool-Chance, Poolgroesse, Gebiete
bps = {}
for f in glob.glob(REPO + "/contracts/*.json"):
    c = json.load(open(f, encoding="utf-8"))
    if c.get("NotForRelease") or c.get("WorkInProgress"): continue
    # Wikelo: Tauschgeschaefte (was man bekommt, was man abgibt) + wer "Wikelo Favor" als Belohnung gibt
    mtn = (c.get("MissionType") or {}).get("Name") or ""
    rw_items = [(it.get("Name"), it.get("Amount") or 1) for ri in c.get("RewardItems") or [] for it in ri.get("Items") or [] if it.get("Name")]
    if mtn.startswith("Wikelo"):
        cost = [[h.get("Name"), (h.get("MinScu") or 0) if (h.get("Kind") == "Resource") else (h.get("MinAmount") or h.get("MaxAmount") or 0),
                 "scu" if h.get("Kind") == "Resource" else ""] for h in c.get("HaulingOrders") or [] if h.get("Name")]
        rep = sum(r.get("Amount") or 0 for r in c.get("ReputationGained") or [])
        pre = sorted({m.get("Title") for p in c.get("Prerequisites") or [] for m in p.get("RequiredMissions") or [] if m.get("Title")})
        if rw_items:
            wikelo.append({"k": "ship" if "Vehicle" in mtn else "item", "t": rw_items[0][0], "rw": [[n, a] for n, a in rw_items],
                           "cost": cost, "rep": rep, "pre": pre, "dbg": c.get("DebugName") or ""})
    if any(n == "Wikelo Favor" for n, _ in rw_items):
        tt = resolve(c.get("DisplayTitle") or c.get("Title"), c.get("MissionTokens") or {}) or mtn
        amt = sum(a for n, a in rw_items if n == "Wikelo Favor")
        fs = favor_src.setdefault(tt, {"t": tt, "ty": mtn, "g": giver(c), "amt": amt, "n": 0, "locs": set()})
        fs["n"] += 1; fs["amt"] = max(fs["amt"], amt)
        fs["locs"] |= {r["UUID"][:8] for a in c.get("AvailabilityLocations") or [] for r in (a.get("ResolvedLocations") or []) if r.get("UUID") and r["UUID"][:8] in oid}
    locs = {r["UUID"][:8] for a in c.get("AvailabilityLocations") or [] for r in (a.get("ResolvedLocations") or [])
            if r.get("UUID") and r["UUID"][:8] in oid}
    if not locs: continue
    ty = (c.get("MissionType") or {}).get("Name") or "Sonstige"
    key = (ty, giver(c), bool(c.get("Illegal")))
    g = groups.setdefault(key, {"ty": key[0], "g": key[1], "il": 1 if key[2] else 0, "n": 0, "t": [], "locs": set(), "bp": {}, "nbp": 0, "rw": {}})
    # Blueprints: Pool mit Chance, jedes Teil daraus moeglich. Hoechste Chance je Teil gewinnt.
    pools = c.get("Blueprints") or []
    if pools: g["nbp"] += 1
    for pool in pools:
        ch = pool.get("Chance") or 0
        for it in pool.get("PoolContents") or []:
            nm = it.get("ItemName")
            if nm and not BAD.search(nm): g["bp"][nm] = max(g["bp"].get(nm, 0), ch)
    for ri in c.get("RewardItems") or []:
        for it in ri.get("Items") or []:
            nm = it.get("Name")
            if nm and not BAD.search(nm): g["rw"][nm] = max(g["rw"].get(nm, 0), it.get("Amount") or 1)
    g["n"] += 1; g["locs"] |= locs
    t = resolve(c.get("DisplayTitle") or c.get("Title"), c.get("MissionTokens") or {})
    if t and t not in g["t"] and len(g["t"]) < 8: g["t"].append(t)
    if pools and t:
        tb = g.setdefault("tb", [])
        if t not in tb and len(tb) < 8: tb.append(t)
    for pool in pools:
        items = [it.get("ItemName") for it in pool.get("PoolContents") or [] if it.get("ItemName") and not BAD.search(it.get("ItemName"))]
        for nm in items:
            mk = (t or "", key[0], key[1], key[2])
            m = bps.setdefault(nm, {}).setdefault(mk, {"t": t or "", "ty": key[0], "g": key[1], "il": 1 if key[2] else 0,
                                                        "ch": 0, "ps": 999, "n": 0, "locs": set()})
            m["ch"] = max(m["ch"], pool.get("Chance") or 0); m["ps"] = min(m["ps"], len(items)); m["n"] += 1; m["locs"] |= locs

out = sorted(groups.values(), key=lambda g: (-g["n"], g["ty"], g["g"]))
for g in out:
    g["locs"] = sorted(g["locs"])
    g["bp"] = [[n, round(ch * 100), cat.get(n.lower(), "")] for n, ch in sorted(g["bp"].items(), key=lambda x: (-x[1], x[0]))]
    g["rw"] = [[n, a] for n, a in sorted(g["rw"].items())]
    if not g["bp"]: del g["bp"], g["nbp"]
    if not g["rw"]: del g["rw"]
if len(out) < 50 or sum(g["n"] for g in out) < 500:
    print("ABBRUCH, unplausibel:", len(out), "Gruppen", file=sys.stderr); sys.exit(1)
bpout, lsets, lidx = {}, [], {}
for nm, ms in bps.items():
    lst = []
    for m in ms.values():
        key_ = tuple(sorted(m.pop("locs")))
        if key_ not in lidx: lidx[key_] = len(lsets); lsets.append(list(key_))
        m["ch"] = round(m["ch"] * 100); m["l"] = lidx[key_]; lst.append(m)
    lst.sort(key=lambda m: (-m["ch"] / max(1, m["ps"]), m["ty"], m["t"]))
    bpout[nm] = {"cat": cat.get(nm.lower(), ""), "m": lst}
res = {"built": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"), "version": ver, "groups": out, "bps": bpout, "lsets": lsets,
       "wikelo": sorted(({**w, "cat": cat.get(w["t"].lower(), "")} for w in wikelo), key=lambda w: (w["k"], w["t"])),
       "favor": sorted(({**f, "locs": sorted(f["locs"])} for f in favor_src.values()), key=lambda f: -f["amt"])}
C.write_json(OUT, res)
print("ok", OUT, os.path.getsize(OUT), "bytes |", ver, "|", len(out), "Gruppen,", sum(g["n"] for g in out), "Auftraege,",
      sum(1 for g in out for _ in g["t"]), "Titel,", len({b[0] for g in out for b in g.get("bp", [])}), "Blueprints")
