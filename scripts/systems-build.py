#!/usr/bin/env python3
# Baut die Karten-Daten fuer Stanton, Pyro und Nyx: data/sys-<system>.json je System plus data/galaxy.json
# (Lage der Systeme, Sprungverbindungen). Quellen: scunpacked-data (Datamine je Patch), UEX 2.0 (Orte +
# Terminals). Deutsche Texte sind optional, siehe _common.WITH_DE.
#
# Builds the map data for Stanton, Pyro and Nyx: data/sys-<system>.json per system plus data/galaxy.json
# (system layout, jump links). Sources: scunpacked-data (datamine per game patch), UEX 2.0 (locations +
# terminals). German text is optional, see _common.WITH_DE.
#
# Aufruf/usage: python3 scripts/systems-build.py [zielordner/target-dir] [--with-de]
# Je System wird nur geschrieben, wenn es plausibel ist; sonst bleibt der alte Stand liegen (Exit 1 am Ende).
# Only writes a system if the result looks plausible; otherwise the previous file is kept (exits 1 at the end).
import math
import re
import statistics
import sys
import datetime

import _common as C

PUB = C.cli_path(C.DATA_DIR)
SYSTEMS = {  # Schluessel: UEX-ID, Anzeigename, Mindestbestand fuer die Plausibilitaet, Mindestzahl UEX-Treffer
    "stanton": {"uex": 68, "n": "Stanton", "need": {"star": 1, "planet": 4, "moon": 12, "station": 5, "reststop": 15, "city": 4}, "uexmin": 100},
    "pyro":    {"uex": 64, "n": "Pyro",    "need": {"star": 1, "planet": 6, "moon": 6, "station": 5}, "uexmin": 15},
    "nyx":     {"uex": 55, "n": "Nyx",     "need": {"star": 1, "planet": 3, "station": 5}, "uexmin": 3},
}


def get(url, data=None):
    return C.get(url, data=data, timeout=120)


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def fuzzy(s):
    # UEX schreibt in Mining-Base-Codes oft O statt 0 und I statt 1; "(Stanton)" o. ae. haengt an Gateways.
    s = re.sub(r"\s*\((stanton|pyro|nyx)\)\s*$", "", (s or ""), flags=re.I)
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
ALIAS = {"Grim HEX": "Green Imperial Housing Exchange", "Deakins Research Outpost": "Deakins Research",
         "Hickes Research Outpost": "Hickes Research", "Shady Glen Farms": "Shady Glen",
         "UGF_TheGarden": "The Garden", "UGF_Connors": "Connor's", "UGF_TPF": "TPF", "UGF_OldSecDep": "Old Security Depot"}
# Guertel ohne eigene Geometrie: aus vielen gleichnamigen Missionsorten abgeleitet
BELTS = {"Keeger Belt Mission Location": "Keeger Belt", "Glaciem Ring Mission Location": "Glaciem Ring"}
EXTRA_BODIES = {"nyx": {"Delamar": "Levski"}}
GROUPS = {"SpaceShip_Mineables": "Schiffs-Mining", "GroundVehicle_Mineables": "ROC-Mining", "FPS_Mineables": "Hand-Mining",
          "FPS mineables": "Hand-Mining", "Harvestables": "Sammelbar"}


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
        # Stanton: Lagrange-Raststationen (HUR-L1 ...). Pyro/Nyx: echte Stationen (Ruin Station, Checkmate ...)
        if "Wikelo" in n: return "wikelo"
        return "reststop" if re.search(r"-L\d\b", n) else "station"
    if t.startswith("Outpost"): return "outpost"
    if t.startswith("Asteroid"):
        if n.startswith("Mining Base") or n == "Miner's Lament": return "miningbase"
        if re.match(r"^(HUR|CRU|ARC|MIC|PYR\d) L\d$", n) or n.startswith("Cluster ") or t == "Asteroid_ValidQT": return "lagrange"
        return "asteroid"
    return "poi"


def mining_for(sysname):
    mining, loc2prov, nofix = {}, {}, {}
    for p in prov:
        names = [l["Name"] for l in p.get("Locations", []) if (l.get("System") or "").lower() == sysname]
        if not names: continue
        key = p["Provider"]["Name"]; groups = []
        for g in p["Groups"]:
            gname = g.get("GroupName") or g.get("Name")
            if gname not in GROUPS: continue
            tot = sum(d["RelativeProbability"] for d in g["Deposits"]) or 1; deps = []
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
               for l in p.get("Locations", []) if (l.get("System") or "").lower() == sysname):
            nofix[key] = names[0]
        for n in names:
            lst = loc2prov.setdefault(norm(MINE_ALIAS.get(n, n)), [])
            if key not in lst: lst.append(key)
    suf = "_" + sysname.capitalize()   # Hoehlen gibt es doppelt (mit/ohne _Stanton, _Pyro): die System-Variante gewinnt
    for k, lst in loc2prov.items(): loc2prov[k] = [x for x in lst if not (x + suf) in lst]
    return mining, loc2prov, nofix


def uex_for(sid):
    uex = {}
    for ep, k in (("planets", "planet"), ("moons", "moon"), ("space_stations", "space_station"), ("cities", "city"),
                  ("outposts", "outpost"), ("poi", "poi")):
        uex[k] = get(C.UEX_API + ep + "?id_star_system=%d" % sid).get("data") or []
    terms = get(C.UEX_API + "terminals?id_star_system=%d" % sid).get("data") or []
    idx = {}
    for k, rows in uex.items():
        for r in rows:
            for nm in (r.get("name"), r.get("nickname")):
                if nm: idx.setdefault(fuzzy(nm), (k, r["id"]))
    term_by = {}
    for t in terms:
        if not t.get("is_available_live", t.get("is_available")): continue
        for k in ("space_station", "outpost", "city", "poi", "moon", "planet"):
            if t.get("id_" + k):
                term_by.setdefault((k, t["id_" + k]), []).append({"id": t["id"], "n": t.get("name") or t.get("displayname"), "t": t.get("type")})
                break
    return idx, term_by


def build(sysname, cfg):
    E = [e for e in pos["entities"] if e["system"] == sysname and not DROP.match(e["name"])]
    # Eindeutige IDs: gleiche UUID mehrfach (Vorlagen-Instanzen in Nyx) bekommt Nummern-Suffix
    ids, seen, first = [], {}, {}
    for e in E:
        s = e["uuid"][:8]; c = seen.get(s, 0); seen[s] = c + 1
        ids.append(s if c == 0 else "%s.%d" % (s, c)); first.setdefault(e["uuid"], ids[-1])
    mining, loc2prov, nofix = mining_for(sysname)
    uexidx, term_by = uex_for(cfg["uex"])
    objs, matched, unmatched, belts = [], 0, [], {}
    for e, oid in zip(E, ids):
        if e["name"] in BELTS:   # nicht als Einzelpunkte ausgeben, nur Guertel ableiten
            belts.setdefault(BELTS[e["name"]], []).append(e); continue
        m = meta.get(e["uuid"], {}); k = kind(e); nm = display(e["name"])
        o = {"id": oid, "n": nm, "k": k, "p": first.get(e["parent_uuid"]),
             "x": round(e["x"] / 1000, 3), "y": round(e["y"] / 1000, 3), "z": round(e["z"] / 1000, 3)}
        if e.get("hidden"): o["h"] = 1
        if m.get("Size"): o["r"] = round(m["Size"] / 1000, 3)
        desc = (m.get("Description") or "").strip()
        if desc and not desc.startswith("$%"):
            o["d"] = desc
            if en2de.get(desc): o["dde"] = en2de[desc]
        if m.get("Amenities"): o["am"] = [a.get("Name") if isinstance(a, dict) else a for a in m["Amenities"]]
        if (m.get("Jurisdiction") or {}).get("Name"): o["ju"] = m["Jurisdiction"]["Name"]
        tag = (m.get("LocationHierarchyTag") or {}).get("Name")
        if tag: o["tag"] = tag   # Spiel-Kennung (Stanton2b = Daymar), fuer die Zuordnung von rohen Ortscodes (siehe docs/PLAYERS_API.md)
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
    byid = {o["id"]: o for o in objs}
    # Koerper ohne eigene Koordinaten, aber mit bekanntem Ort darauf (Delamar: Levski sitzt darauf).
    # Mittelpunkt = Ankerort + Radius, von der Sonne weg (Naeherung, die Lage auf dem Koerper steht nicht in den Daten).
    for bname, anchor in EXTRA_BODIES.get(sysname, {}).items():
        mb = next((m for m in meta.values() if m.get("Name") == bname and (m.get("Type") or {}).get("Name") == "Moon"), None)
        an = next((o for o in objs if o["n"] == anchor), None)
        if not mb or not an or any(o["n"] == bname for o in objs): continue
        r = (mb.get("Size") or 0) / 1000; d = math.dist((an["x"], an["y"], an["z"]), (0, 0, 0)) or 1
        bo = {"id": mb["UUID"][:8], "n": bname, "k": "moon", "p": an["p"], "r": round(r, 3), "approx": 1,
              "x": round(an["x"] * (1 + r / d), 3), "y": round(an["y"] * (1 + r / d), 3), "z": round(an["z"] * (1 + r / d), 3)}
        desc = (mb.get("Description") or "").strip()
        if desc and not desc.startswith("$%"):
            bo["d"] = desc
            if en2de.get(desc): bo["dde"] = en2de[desc]
        pk = loc2prov.get(norm(bname))
        if pk: bo["mine"] = pk
        objs.append(bo); an["p"] = bo["id"]
    byid = {o["id"]: o for o in objs}
    # Guertel: Ring um das Elternobjekt aus den Abstaenden der Missionsorte, dazu ein anklickbarer Guertel-Ort
    for bn, es in belts.items():
        par = byid.get(first.get(es[0]["parent_uuid"])) or next(o for o in objs if o["k"] == "star")
        ds = sorted(math.dist((e["x"] / 1000, e["y"] / 1000, e["z"] / 1000), (par["x"], par["y"], par["z"])) for e in es)
        rin, rout = ds[int(len(ds) * 0.05)], ds[int(len(ds) * 0.95) - 1]
        zs = [e["z"] / 1000 - par["z"] for e in es]
        rep = min(es, key=lambda e: abs(math.dist((e["x"] / 1000, e["y"] / 1000, e["z"] / 1000), (par["x"], par["y"], par["z"])) - statistics.median(ds)))
        bo = {"id": "belt-" + norm(bn), "n": bn, "k": "belt", "p": par["id"], "x": round(rep["x"] / 1000, 3), "y": round(rep["y"] / 1000, 3),
              "z": round(rep["z"] / 1000, 3), "belt": {"in": round(rin), "out": round(rout), "depth": round(max(1, statistics.pstdev(zs) * 2))}}
        pk = loc2prov.get(norm(bn))
        if pk: bo["mine"] = pk
        objs.append(bo)
    used = {k for o in objs for k in o.get("mine", [])}
    mining = {k: v for k, v in mining.items() if k in used or k in nofix}
    nofix = {k: v for k, v in nofix.items() if k not in used}
    if len({o["id"] for o in objs}) != len(objs): return None, "doppelte ID"
    cnt = {}
    for o in objs: cnt[o["k"]] = cnt.get(o["k"], 0) + 1
    bad = [k for k, v in cfg["need"].items() if cnt.get(k, 0) < v]
    if bad or matched < cfg["uexmin"]: return None, "unplausibel: %s uex %d" % (bad, matched)
    return {"sys": sysname, "name": cfg["n"], "built": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
            "version": ver, "unit": "km", "objects": objs, "mining": mining, "nofix": nofix, "counts": cnt,
            "de_texts": sum(1 for o in objs if o.get("dde")), "uex_unmatched": unmatched}, "ok"


C.ensure_dirs()
failed = []
built = {}
for key, cfg in SYSTEMS.items():
    try:
        data, why = build(key, cfg)
    except Exception as ex:
        data, why = None, "Fehler: %s" % ex
    if data is None:
        failed.append(key); print("ABBRUCH", key, why, "-> alter Stand bleibt", file=sys.stderr); continue
    outp = PUB / ("sys-%s.json" % key)
    C.write_json(outp, data); built[key] = data
    print("ok", key, outp.stat().st_size, "bytes |", data["counts"], "| mining", len(data["mining"]),
          "| uex", sum(1 for o in data["objects"] if o.get("uex")), "| deutsch", data["de_texts"])

# ---- Galaxie: Lage der Systeme (RSI ARK, Lichtjahre) + Sprungverbindungen. ----
# ---- Galaxy: system layout (RSI ARK, light-years) + jump links. ----
# HINWEIS: Anders als im Original laedt dieses Skript KEINE Sternenkarten-Bilder von RSI herunter
# (urheberrechtlich riskant fuer ein Fan-Projekt). Das Frontend zeigt Systeme ohne Bild.
# NOTE: unlike the original, this script does NOT download any RSI starmap images (copyright risk
# for a fan project). The frontend renders systems without an image.
try:
    ark = get("https://robertsspaceindustries.com/api/starmap/bootup", data=b"{}")["data"]
    S = {s["name"].lower(): s for s in ark["systems"]["resultset"]}
    sid = {int(s["id"]): s["name"].lower() for s in ark["systems"]["resultset"]}
    systems = []
    for key, cfg in SYSTEMS.items():
        s = S[key]
        systems.append({"k": key, "n": cfg["n"], "ly": [float(s["position_x"]), float(s["position_y"]), float(s["position_z"])],
                        "img": "", "d": (s.get("description") or "").strip(), "dde": en2de.get((s.get("description") or "").strip(), "")})
    # Spieldaten-Verbindungen (live) ueber die Sprungpunkte -> sichtbares Gateway (Elternobjekt)
    byu = {e["uuid"]: e for e in pos["entities"]}
    def gate(u):
        e = byu.get(u); p = byu.get(e["parent_uuid"]) if e else None
        if p and "Gateway" in p["name"]: return p["uuid"][:8]
        # Sprungpunkt haengt am Stern: Gateway des Systems suchen, das zum Zielsystem fuehrt
        return None
    links = []
    for c in pos.get("connections", []):
        a, b = gate(c["entry_uuid"]), gate(c["exit_uuid"])
        sa, sb = c["entry_system"], c["exit_system"]
        if not a: a = next((e["uuid"][:8] for e in pos["entities"] if e["system"] == sa and e["name"] == sb.capitalize() + " Gateway"), None)
        if not b: b = next((e["uuid"][:8] for e in pos["entities"] if e["system"] == sb and e["name"] == sa.capitalize() + " Gateway"), None)
        if a and b and sa in SYSTEMS and sb in SYSTEMS: links.append({"a": a, "sa": sa, "b": b, "sb": sb, "live": 1})
    # Weitere Tunnel der RSI-Sternenkarte: echt, wenn beide Tore im Spiel als sichtbare Station existieren
    #    (Stanton-Nyx: "Nyx Gateway" in Stanton und "Stanton Gateway" in Nyx), sonst gestrichelt
    have = {frozenset((l["sa"], l["sb"])) for l in links}
    for t in ark["tunnels"]["resultset"]:
        sa, sb = sid.get(int(t["entry"]["star_system_id"])), sid.get(int(t["exit"]["star_system_id"]))
        if sa in SYSTEMS and sb in SYSTEMS and frozenset((sa, sb)) not in have:
            ea = next((e for e in pos["entities"] if e["system"] == sa and e["name"] == sb.capitalize() + " Gateway"), None)
            eb = next((e for e in pos["entities"] if e["system"] == sb and e["name"] == sa.capitalize() + " Gateway"), None)
            if ea and eb:
                live = 0 if (ea.get("hidden") or eb.get("hidden")) else 1
                links.append({"a": ea["uuid"][:8], "sa": sa, "b": eb["uuid"][:8], "sb": sb, "live": live, "src": "tore"}); have.add(frozenset((sa, sb)))
    if len(systems) == 3 and links:
        C.write_json(PUB / "galaxy.json", {"built": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
                                    "systems": systems, "links": links})
        print("ok galaxy |", [(l["sa"], l["sb"], l["live"]) for l in links])
    else:
        failed.append("galaxy"); print("ABBRUCH galaxy: unvollstaendig", file=sys.stderr)
except Exception as ex:
    failed.append("galaxy"); print("ABBRUCH galaxy:", ex, "-> alter Stand bleibt", file=sys.stderr)
sys.exit(1 if failed else 0)
