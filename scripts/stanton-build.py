#!/usr/bin/env python3
# HINWEIS: fuer die drei Systeme (Stanton/Pyro/Nyx) baut heute systems-build.py, das die neueren
# data/sys-<system>.json + data/galaxy.json schreibt und von missions-build.py vorausgesetzt wird.
# Dieses Skript baut NUR Stanton, in einem aelteren, flacheren Format (data/stanton.json). Es steht
# noch hier, weil die urspruengliche Quelle es enthielt, ist aber im Standard-Build (build-all.py)
# NICHT eingebunden. Nuetzlich, wenn du nur Stanton allein brauchst, ohne die anderen Systeme zu bauen.
#
# NOTE: for the three systems (Stanton/Pyro/Nyx), systems-build.py is the current script; it writes
# the newer data/sys-<system>.json + data/galaxy.json files that missions-build.py expects. This
# script builds ONLY Stanton, in an older, flatter format (data/stanton.json). It is kept because the
# original source included it, but it is NOT wired into the default pipeline (build-all.py). Useful if
# you only want Stanton on its own, without building the other systems.
#
# Aufruf/usage: python3 scripts/stanton-build.py [ziel.json/target.json]
# Schreibt nur, wenn der neue Stand plausibel ist (sonst bleibt der alte liegen, Exit 1).
# Only writes if the new result looks plausible (otherwise the previous file is kept, exits 1).
import re
import sys
import datetime

import _common as C

OUT = C.cli_path(C.DATA_DIR / "stanton.json")


def get(url):
    return C.get(url, timeout=90)


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def fuzzy(s):
    # UEX schreibt in Mining-Base-Codes oft O statt 0 und I statt 1; "(Stanton)" haengt an Gateways.
    s = re.sub(r"\s*\(stanton\)\s*$", "", (s or ""), flags=re.I)
    return norm(s).replace("o", "0").replace("i", "1")


pos = get(C.SCU_RAW + "starmap_positions.json")
meta = {o["UUID"]: o for o in get(C.SCU_RAW + "starmap.json")}
res = {r["UUID"]: r for r in get(C.SCU_RAW + "resources/resources.json")}
prov = get(C.SCU_RAW + "resources/locations.json")

en2de = {}
if C.WITH_DE:
    try:
        en_labels = get(C.SCU_RAW + "labels.json")
        en2de = C.load_de_translations(en_labels)
    except Exception as ex:
        print("WARNUNG/WARNING: labels.json nicht geladen / not loaded:", ex, file=sys.stderr)

try:
    ver = get("https://api.github.com/repos/StarCitizenWiki/scunpacked-data/commits/master")["commit"]["message"].splitlines()[0]
except Exception:
    ver = "unbekannt"

DROP = re.compile(r"^(jumppoint(locationsecurity|turrets)|<= UNINITIALIZED =>)", re.I)
MINE_ALIAS = {"Terminus": "Yela"}   # Yela-Asteroidenguertel heisst im Mining-Datensatz "Terminus"
E = [e for e in pos["entities"] if e["system"] == "stanton" and not DROP.match(e["name"])]
by = {e["uuid"]: e for e in E}

# Interne Datamine-Namen -> Namen wie im Spiel (und wie UEX sie fuehrt)
ALIAS = {"Grim HEX": "Green Imperial Housing Exchange", "Deakins Research Outpost": "Deakins Research",
         "Hickes Research Outpost": "Hickes Research", "Shady Glen Farms": "Shady Glen",
         "UGF_TheGarden": "The Garden", "UGF_Connors": "Connor's", "UGF_TPF": "TPF", "UGF_OldSecDep": "Old Security Depot"}
def display(n):
    if n in ALIAS and n.startswith("UGF_"): return ALIAS[n]
    m = re.match(r"^UGF_SP_(.+)$", n)
    if m: return "Security Post " + m.group(1)
    m = re.match(r"^UGF_(.+)$", n)
    if m: return m.group(1)
    return n


def kind(e):
    t, n = e["type"], e["name"]
    if t in ("Star", "Planet", "Moon"): return t.lower()
    if t == "LandingZone": return "city"
    if t == "JumpPoint": return "jump"
    if t == "Manmade":
        if n.startswith("Comm Array"): return "comm"
        if "Gateway" in n: return "gateway"
        return "station"
    if t == "Manmade_VisibleOnInteraction":
        return "wikelo" if "Wikelo" in n else "reststop"
    if t == "Outpost": return "outpost"
    if t == "Asteroid":
        if n.startswith("Mining Base") or n == "Miner's Lament": return "miningbase"
        if re.match(r"^(HUR|CRU|ARC|MIC) L\d$", n): return "lagrange"
        return "asteroid"
    return "poi"


# ---- Mining: Provider -> Gruppen -> Gesteinsarten -> Erze ----
GROUPS = {"SpaceShip_Mineables": "Schiffs-Mining", "GroundVehicle_Mineables": "ROC-Mining", "FPS_Mineables": "Hand-Mining",
          "FPS mineables": "Hand-Mining", "Harvestables": "Sammelbar"}
mining, loc2prov, nofix = {}, {}, {}
for p in prov:
    names = [l["Name"] for l in p.get("Locations", []) if (l.get("System") or "").lower() == "stanton"]
    if not names: continue
    key = p["Provider"]["Name"]
    groups = []
    for g in p["Groups"]:
        gname = g.get("GroupName") or g.get("Name")
        if gname not in GROUPS: continue
        tot = sum(d["RelativeProbability"] for d in g["Deposits"]) or 1
        deps = []
        for d in g["Deposits"]:
            r = res.get(d["ResourceUUID"])
            if not r: continue
            comp = r.get("Composition") or {}
            parts = [{"ore": pt.get("Name") or pt.get("Key"), "min": pt.get("MinPercentage"), "max": pt.get("MaxPercentage"),
                      "p": pt.get("Probability"),
                      "q": [pt.get("QualityRange", {}).get("EffectiveMin"), pt.get("QualityRange", {}).get("EffectiveMax")]}
                     for pt in comp.get("Parts", [])]
            deps.append({"rock": comp.get("DepositName") or r.get("Name"), "tier": r.get("Tier"), "kind": r.get("Kind"),
                         "rel": round(100 * d["RelativeProbability"] / tot, 1), "parts": parts})
        deps.sort(key=lambda x: -x["rel"])
        if deps: groups.append({"g": GROUPS[gname], "p": g.get("GroupProbability"), "deps": deps})
    if not groups: continue
    mining[key] = groups
    if all((l.get("MatchStrategy") or "none") == "none" and (l.get("Type") in ("cluster", "lagrange"))
           for l in p.get("Locations", []) if (l.get("System") or "").lower() == "stanton"):
        nofix[key] = names[0]
    for n in names:
        lst = loc2prov.setdefault(norm(MINE_ALIAS.get(n, n)), [])
        if key not in lst: lst.append(key)
# Hoehlen gibt es doppelt (mit und ohne _Stanton): die Stanton-Variante gewinnt
for k, lst in loc2prov.items():
    loc2prov[k] = [x for x in lst if not (x + "_Stanton") in lst]

# ---- UEX: Orte und Terminals ----
uex = {}
for ep, k in (("planets", "planet"), ("moons", "moon"), ("space_stations", "space_station"), ("cities", "city"),
              ("outposts", "outpost"), ("poi", "poi")):
    rows = get(C.UEX_API + ep + "?id_star_system=68").get("data") or []
    uex[k] = rows
terms = get(C.UEX_API + "terminals?id_star_system=68").get("data") or []
uexidx = {}
for k, rows in uex.items():
    for r in rows:
        for nm in (r.get("name"), r.get("nickname")):
            if nm: uexidx.setdefault(fuzzy(nm), (k, r["id"]))
term_by = {}
for t in terms:
    if not t.get("is_available_live", t.get("is_available")): continue
    for k in ("space_station", "outpost", "city", "poi", "moon", "planet"):
        if t.get("id_" + k):
            term_by.setdefault((k, t["id_" + k]), []).append(
                {"id": t["id"], "n": t.get("name") or t.get("displayname"), "t": t.get("type")})
            break

# ---- Objekte ----
objs, matched, unmatched = [], 0, []
for e in E:
    m = meta.get(e["uuid"], {})
    k = kind(e)
    nm = display(e["name"])
    o = {"id": e["uuid"][:8], "n": nm, "k": k, "p": by[e["parent_uuid"]]["uuid"][:8] if e["parent_uuid"] in by else None,
         "x": round(e["x"] / 1000, 3), "y": round(e["y"] / 1000, 3), "z": round(e["z"] / 1000, 3)}
    if e.get("hidden"): o["h"] = 1
    if m.get("Size"): o["r"] = round(m["Size"] / 1000, 3)
    desc = (m.get("Description") or "").strip()
    if desc and not desc.startswith("$%"):
        o["d"] = desc
        if en2de.get(desc): o["dde"] = en2de[desc]
    if m.get("Amenities"): o["am"] = [a.get("Name") if isinstance(a, dict) else a for a in m["Amenities"]]
    if (m.get("Jurisdiction") or {}).get("Name"): o["ju"] = m["Jurisdiction"]["Name"]
    ring = m.get("AsteroidRing")
    if ring: o["ring"] = {"in": ring["InnerRadius"] / 1000, "out": ring["OuterRadius"] / 1000, "depth": ring["Depth"] / 1000}
    pk = loc2prov.get(norm(e["name"]))
    if pk: o["mine"] = pk
    u = uexidx.get(fuzzy(nm)) or uexidx.get(fuzzy(ALIAS.get(e["name"], "")))
    if u:
        o["uex"] = [u[0], u[1]]; matched += 1
        t = term_by.get((u[0], u[1]))
        if t: o["terms"] = t
    elif k not in ("asteroid", "comm") and not e.get("hidden"):
        unmatched.append(nm)
    objs.append(o)

# Nur Mining behalten, das an einem Kartenobjekt haengt oder ausdruecklich keinen festen Ort hat
used = {k for o in objs for k in o.get("mine", [])}
mining = {k: v for k, v in mining.items() if k in used or k in nofix}
nofix = {k: v for k, v in nofix.items() if k not in used}

# Kurz-IDs muessen eindeutig sein, sonst verschwindet ein Ort still
if len({o['id'] for o in objs}) != len(objs):
    print('ABBRUCH, doppelte Kurz-ID', file=sys.stderr); sys.exit(1)

# Plausibilitaet: sonst bleibt der alte Stand liegen
cnt = {}
for o in objs: cnt[o["k"]] = cnt.get(o["k"], 0) + 1
need = {"star": 1, "planet": 4, "moon": 12, "station": 5, "reststop": 15, "city": 4}
bad = [k for k, v in need.items() if cnt.get(k, 0) < v]
if bad or not mining or matched < 100:
    print("ABBRUCH, Daten unplausibel:", bad, "mining", len(mining), "uex", matched, file=sys.stderr); sys.exit(1)

out = {"built": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"), "version": ver, "unit": "km",
       "objects": objs, "mining": mining, "nofix": nofix, "counts": cnt, "de_texts": sum(1 for o in objs if o.get("dde")), "uex_unmatched": unmatched}
C.write_json(OUT, out)
print("ok", OUT, OUT.stat().st_size, "bytes |", ver, "|", cnt, "| mining", len(mining), "| uex", matched,
      "| ohne uex", len(unmatched), "| deutsch", out["de_texts"])
