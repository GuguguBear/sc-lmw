#!/usr/bin/env python3
# Spiegelt die FleetYards-Schiffsdaten (Masse, Speed, Crew, Fracht, Preise, Loaner, wo kaufen/mieten)
# nach data/fleet.json. Verlinkt optional gegen einen eigenen UEX-Schiffskatalog (data/vehicles.json),
# falls vorhanden -- fehlt er, bleibt der Link leer und js/starmap.js gleicht Schiffsnamen stattdessen
# per Namensabgleich direkt ab (siehe fleetShip() in js/holo.js). Die 3D-Modelldateien selbst werden NICHT
# kopiert, der Browser laedt sie direkt von FleetYards (CORS offen, siehe CREDITS.md fuer Namensnennung).
#
# Mirrors the FleetYards ship data (dimensions, speed, crew, cargo, prices, loaners, where to buy/rent)
# into data/fleet.json. Optionally links against your own UEX ship catalog (data/vehicles.json) if
# present -- if missing, the link table just stays empty and js/starmap.js falls back to matching ship
# names directly (see fleetShip() in js/holo.js). The 3D model files themselves are NOT copied; the browser
# loads them straight from FleetYards (CORS open, see CREDITS.md for attribution).
#
# Aufruf/usage: python3 scripts/fy-mirror.py
import json
import os
import re
import time
import urllib.request

import _common as C

API = "https://api.fleetyards.net/v1"
OUT = str(C.DATA_DIR / "fleet.json")
VEH = os.environ.get("LIVEMAP_VEHICLES", str(C.DATA_DIR / "vehicles.json"))
UA = C.UA["User-Agent"]


def get(path):
    req = urllib.request.Request(API + path, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode())


def norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def store_key(u):
    """RSI-Store-Link auf den Pfad reduzieren: beide Quellen fuehren ihn, stabilster Abgleich."""
    u = str(u or "").lower().split("?")[0].rstrip("/")
    m = re.search(r"/pledge/ships/(.+)$", u)
    return m.group(1) if m else ""


def url_of(x):
    return x.get("url") if isinstance(x, dict) else (x or "")


def shops(lst):
    """FleetYards fuehrt den Ort als Text "Laden - Ort" (z.B. "Astro Armada - Area 18")."""
    out = []
    for a in (lst or [])[:12]:
        out.append({"ort": a.get("location") or "", "preis": a.get("price"), "zeit": a.get("timeRange") or ""})
    return out


def slim(m):
    me = m.get("metrics") or {}
    sp = m.get("speeds") or {}
    md = m.get("media") or {}
    av = m.get("availability") or {}
    mf = m.get("manufacturer") or {}
    return {
        "slug": m.get("slug"), "name": m.get("name"), "mf": mf.get("name"), "mfc": mf.get("code"),
        "klasse": m.get("classificationLabel") or m.get("classification"), "fokus": m.get("focus"),
        "groesse": me.get("sizeLabel"), "crew": [(m.get("crew") or {}).get("min"), (m.get("crew") or {}).get("max")],
        "scu": me.get("cargo"), "l": me.get("length"), "b": me.get("beam"), "h": me.get("height"),
        "scm": sp.get("scmSpeed"), "max": sp.get("maxSpeed"),
        "preis": m.get("price"), "pledge": m.get("pledgePrice"), "status": m.get("productionStatus"),
        "loaner": [x.get("name") for x in (m.get("loaners") or []) if isinstance(x, dict)],
        "kaufen": shops(av.get("soldAt")), "mieten": shops(av.get("rentalAt")),
        "holo": m.get("holo") or url_of(md.get("holo")),
        "bild": url_of(md.get("storeImage")), "oben": url_of(md.get("topView")), "seite": url_of(md.get("sideView")),
        "store": (m.get("links") or {}).get("storeUrl"), "fy": (m.get("links") or {}).get("frontend"),
    }


def main():
    C.ensure_dirs()
    models, page = [], 1
    while True:
        d = get("/models?perPage=200&page=%d" % page)
        items = d if isinstance(d, list) else (d.get("items") or d.get("data") or [])
        if not items:
            break
        models += items
        if len(items) < 200:
            break
        page += 1
        time.sleep(1)
    # Die Liste traegt nicht alle Felder (Speed/Maße/Preis) -> je Modell das Detail, sanft (Limit 5000/h).
    full = []
    for m in models:
        try:
            full.append(get("/models/" + m["slug"]))
        except Exception:
            full.append(m)
        time.sleep(0.3)
    ships = [slim(m) for m in full if m.get("slug")]
    # Abgleich mit einem eigenen UEX-Schiffskatalog (optional): 1) RSI-Store-Link, 2) "Hersteller-Kurzname
    # + Modell", 3) Modellname allein, wenn eindeutig. Ohne data/vehicles.json bleibt "link" leer, das
    # Frontend gleicht dann selbst per Namen ab (fleetShip() in js/holo.js).
    by_store = {store_key(s["store"]): s["slug"] for s in ships if store_key(s["store"])}
    by_full, by_name = {}, {}
    for s in ships:
        first = (s["mf"] or "").split()[0] if s["mf"] else ""
        by_full[norm(first + s["name"])] = s["slug"]
        by_full[norm((s["mf"] or "") + s["name"])] = s["slug"]
        by_name.setdefault(norm(s["name"]), []).append(s["slug"])
    link, miss = {}, []
    try:
        veh = json.load(open(VEH)).get("ships", [])
    except Exception:
        veh = []
    for v in veh:
        sl = by_store.get(store_key(v.get("st"))) or by_full.get(norm(v.get("n")))
        if not sl:
            cand = [c for c in by_name.items() if norm(v.get("n")).endswith(c[0]) and len(c[1]) == 1 and len(c[0]) > 3]
            cand.sort(key=lambda c: -len(c[0]))
            sl = cand[0][1][0] if cand else None
        if not sl:
            # Sonderedition -> Grundschiff ("Drake Cutlass Black Best In Show Edition" -> Cutlass Black):
            # hinten Wort fuer Wort abschneiden, bis der Name passt. Module (Pods, Cargo Module) bleiben ohne.
            words = str(v.get("n") or "").split()
            if not re.search(r"module|pod\b", str(v.get("n")), re.I):
                for k in range(len(words) - 1, 1, -1):
                    sl = by_full.get(norm(" ".join(words[:k])))
                    if sl:
                        break
        if sl:
            link[v["n"]] = sl
        else:
            miss.append(v["n"])
    # Leichte Holo-Modelle: falls du separat ein "fy-lowpoly"-Verfahren betreibst, das Dateien nach
    # data/holo/<slug>.glb legt, wird die Verknuepfung hier mitgezogen. Standardmaessig leer.
    for s in ships:
        s["lo"] = "/data/holo/%s.glb" % s["slug"] if (C.DATA_DIR / "holo" / (s["slug"] + ".glb")).exists() else ""
    payload = {"updated": int(time.time()), "count": len(ships), "quelle": "fleetyards.net",
               "ships": {s["slug"]: s for s in ships}, "uex": link, "ohne": miss}
    old = 0
    try:
        old = int(json.load(open(OUT)).get("count", 0))
    except Exception:
        pass
    if not ships or (old and len(ships) < old * 0.5):
        print("FEHLER: nur %d Schiffe (alt %d) -> alte Datei bleibt" % (len(ships), old))
        return
    C.write_json(OUT, payload)
    print("OK fleet.json: %d Schiffe, %d mit Holo, %d von %d UEX-Namen verknuepft" % (
        len(ships), sum(1 for s in ships if s["holo"]), len(link), len(veh)))
    if miss:
        print("ohne Treffer:", ", ".join(miss[:40]))


if __name__ == "__main__":
    main()
