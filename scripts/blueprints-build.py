#!/usr/bin/env python3
# Baut data/blueprints.json: ALLE Blueprints aus den Spieldaten (scunpacked-data/blueprints.json) mit
# Rezept: Baugruppen, Ressourcen (SCU) und Items (Stueck), Mindestqualitaet, was die Qualitaet
# beeinflusst, Craft-Zeit, und woher der Blueprint kommt (Standard / Belohnung / keine bekannte Quelle).
# Laeuft NACH missions-build.py (das klont/aktualisiert .cache/scunpacked-data per sparse checkout;
# in cone-Modus liegen Dateien im Repo-Root wie blueprints.json trotzdem mit da).
#
# Builds data/blueprints.json: ALL blueprints from the game data (scunpacked-data/blueprints.json) with
# their recipe: sub-assemblies, resources (SCU) and items (count), minimum quality, quality modifiers,
# craft time, and where the blueprint comes from (default / reward / no known source). Runs AFTER
# missions-build.py (which clones/updates .cache/scunpacked-data via sparse checkout; in cone mode,
# repo-root files such as blueprints.json are included regardless).
#
# Aufruf/usage: python3 scripts/blueprints-build.py [ziel.json/target.json]
# Schreibt nur bei plausiblem Ergebnis (mind. 500 Blueprints), sonst bleibt die alte Datei.
# Only writes if plausible (at least 500 blueprints), otherwise the previous file is kept.
import json
import os
import subprocess
import sys
import time

import _common as C

REPO = str(C.SCU_REPO_DIR)
_args = [a for a in sys.argv[1:] if not a.startswith("--")]
OUT = _args[0] if _args else str(C.DATA_DIR / "blueprints.json")
TYP = {"Char_Armor_Helmet": "Helm", "Char_Armor_Torso": "Rüstung Torso", "Char_Armor_Arms": "Rüstung Arme",
       "Char_Armor_Legs": "Rüstung Beine", "Char_Armor_Undersuit": "Unteranzug", "WeaponPersonal": "Handwaffe",
       "WeaponGun": "Schiffswaffe", "PowerPlant": "Kraftwerk", "Cooler": "Kühler", "Shield": "Schild",
       "Radar": "Radar", "QuantumDrive": "Quantenantrieb", "WeaponAttachment": "Waffenaufsatz",
       "Missile": "Rakete", "MissileLauncher": "Raketenwerfer", "Turret": "Geschützturm", "FPS_Consumable": "Verbrauchsgut"}


def num(v):
    try:
        return round(float(v), 3)
    except Exception:
        return None


def walk(node):
    """Rezeptbaum flachklopfen: je Baugruppe die Zutaten (auch aus verschachtelten Gruppen).
    Flatten the recipe tree: ingredients per sub-assembly (including nested groups)."""
    out = []
    for ch in (node or {}).get("Children") or []:
        k = ch.get("Kind")
        if k == "resource":
            out.append({"n": ch.get("Name") or "?", "scu": num(ch.get("QuantityScu")), "mq": ch.get("MinQuality")})
        elif k == "item":
            out.append({"n": ch.get("Name") or "?", "q": ch.get("Quantity"), "mq": ch.get("MinQuality")})
        elif k == "group":
            out += walk(ch)
    return out


def main():
    C.ensure_dirs()
    src = os.path.join(REPO, "blueprints.json")
    if not os.path.exists(src):
        print("ABBRUCH: %s fehlt -- erst missions-build.py laufen lassen (klont scunpacked-data)." % src, file=sys.stderr)
        print("ABORT: %s missing -- run missions-build.py first (it clones scunpacked-data)." % src, file=sys.stderr)
        sys.exit(1)
    B = json.load(open(src, encoding="utf-8"))
    try:
        ver = subprocess.run(["git", "-C", REPO, "log", "-1", "--format=%s"], capture_output=True, text=True, timeout=30).stdout.strip()
    except Exception:
        ver = ""
    bps = {}
    for b in B:
        o = b.get("Output")
        if isinstance(o, list):
            o = o[0] if o else {}
        o = o or {}
        name = o.get("Name")
        if not name:
            continue
        av = b.get("Availability") or {}
        pools = [p.get("Key") for p in av.get("RewardPools") or [] if p.get("Key")]
        tiers = b.get("Tiers") or []
        t0 = tiers[0] if tiers else {}
        groups = []
        for g in ((t0.get("Requirements") or {}).get("Children") or []):
            if g.get("Kind") == "group":
                groups.append({"n": g.get("Name") or g.get("Key") or "", "c": g.get("RequiredCount") or 1,
                               "it": walk(g), "mod": sorted({m.get("Name") for m in g.get("Modifiers") or [] if m.get("Name")})})
            elif g.get("Kind") in ("resource", "item"):
                groups.append({"n": "", "c": 1, "it": walk({"Children": [g]}), "mod": []})
        entry = {"t": TYP.get(o.get("Type"), o.get("Type") or ""), "g": o.get("Grade") or "",
                 "tm": t0.get("CraftTimeSeconds"), "tiers": len(tiers),
                 "src": "default" if av.get("Default") else ("reward" if pools else "none"),
                 "pools": pools[:12], "req": groups}
        key = name
        if key in bps:   # gleicher Name, anderes Teil (z.B. andere Stufe): unterscheidbar machen
            key = "%s (%s%s)" % (name, entry["t"] or "Variante", (" Stufe " + entry["g"]) if entry["g"] else "")
        bps[key] = entry
    if len(bps) < 500:
        print("FEHLER: nur %d Blueprints, alte Datei bleibt" % len(bps)); sys.exit(1)
    C.write_json(OUT, {"built": time.strftime("%Y-%m-%d %H:%M"), "version": ver, "count": len(bps), "bps": bps})
    src_c = {}
    for e in bps.values():
        src_c[e["src"]] = src_c.get(e["src"], 0) + 1
    print("OK blueprints.json: %d Blueprints %s, Stand %s" % (len(bps), src_c, ver))


if __name__ == "__main__":
    main()
