#!/usr/bin/env python3
# EN: builds data/loot.json (where items can be found as loot) from the Friendly Fire Department game data export.
#     Optional; without it the item view simply shows no loot block. Data (c) FFD, not redistributed in this repo.
# FUNDORTE (Beute) je Item fuer die Live Map: Quelle Friendly Fire Department, ffd-game-intel.json (aus den Spieldateien,
# Data.p4k/Game2.dcb). Je Item die Kisten-/Ortsarten, in denen es liegen kann. Keine konkreten Orte, keine echten Prozente:
# die Datei kennt je Kistenart nur das Gewicht der GRUPPE (z. B. "Heavy"), in der das Item steckt. Geschaetzt wird
#   Anteil ~ Gruppengewicht / Summe aller Gruppengewichte der Kistenart / Zahl der Items in der Gruppe
# (Annahme: innerhalb einer Gruppe gleich wahrscheinlich). Daraus nur eine RANGFOLGE je Item (r = 1 beste Chance), nie Prozente.
# Schreibt data/loot.json (Name klein ohne Sonderzeichen -> [[Kistenart, r], ...]); "cats" englisch, "cats_de" deutsch.
import json, re, os, collections, urllib.request
SRC = "https://thefriendlyfiredepartment.org/data/ffd-game-intel.json"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "loot.json")
DE = {"Personal Loadout Pools": "Ausrüstung von NPCs", "General Containers (Large)": "Allgemeine Kisten (groß)", "General Containers (Medium)": "Allgemeine Kisten (mittel)",
      "General Containers (Small)": "Allgemeine Kisten (klein)", "Armor Containers (Large)": "Rüstungskisten (groß)", "Armor Containers (Medium)": "Rüstungskisten (mittel)",
      "Armor Containers (Small)": "Rüstungskisten (klein)", "Military Outposts": "Militär-Außenposten", "Armor Shops": "Rüstungsläden (Kisten)", "Jumptown Event Caches": "Jumptown-Kisten",
      "Contested Zones": "Contested Zones", "Survival Bunkers": "Überlebensbunker", "Distribution Centers": "Distributionszentren", "Derelict Ships": "Schiffswracks",
      "Underground Bunkers": "Unterirdische Bunker", "Outpost General Loot": "Außenposten (allgemein)", "Clothing": "Kleidung", "Weapon Caches": "Waffenverstecke",
      "Weapon Containers (Large)": "Waffenkisten (groß)", "Weapon Containers (Medium)": "Waffenkisten (mittel)", "Weapon Containers (Small)": "Waffenkisten (klein)", "Weapon Containers": "Waffenkisten",
      "Firepower Shops": "Waffenläden (Kisten)", "General Weapon Pools": "Waffen allgemein", "Security Outposts": "Sicherheits-Außenposten", "General Loot Pools": "Beute allgemein",
      "Food & Drink (Small)": "Essen & Trinken (klein)", "Food & Drink": "Essen & Trinken", "Special Event Armor Sets": "Event-Rüstungssets", "Undersuits": "Unteranzüge",
      "Sniper-Focused Caches": "Scharfschützen-Verstecke", "Harvestable Resources": "Sammelbare Ressourcen", "Survival Gear": "Überlebensausrüstung", "Ammo & Medical Supplies": "Munition & Medizin",
      "Salvage": "Bergung", "Antiques & Rare Goods": "Antiquitäten & Seltenes", "Enemy NPC Drops": "Gegner-Beute", "Mining Gear": "Bergbauausrüstung", "Mining Gear (Large)": "Bergbauausrüstung (groß)",
      "Mining Gear (Medium)": "Bergbauausrüstung (mittel)", "Mining Gear (Small)": "Bergbauausrüstung (klein)", "Ammunition": "Munition", "Medical Supplies": "Medizin",
      "Medical Supplies (Small)": "Medizin (klein)", "Tools": "Werkzeug", "Repair Tools (Large)": "Reparaturwerkzeug (groß)", "Repair Tools (Medium)": "Reparaturwerkzeug (mittel)",
      "Repair Tools (Small)": "Reparaturwerkzeug (klein)", "Consumables": "Verbrauchsgüter", "Prison Loot": "Gefängnis-Beute", "Scrap": "Schrott", "Contraband": "Schmuggelware", "Other Loot Pools": "Sonstige Beute"}
norm = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())

def main():
    d = json.loads(urllib.request.urlopen(urllib.request.Request(SRC, headers={"User-Agent": "SC LMW (github.com/nico-gordon-gilles/sc-lmw)"}), timeout=120).read())
    items = d.get("lootItems") or []
    if len(items) < 1000: raise SystemExit("loot-mirror: nur %d Items, alte Datei bleibt" % len(items))
    gw, n = collections.defaultdict(dict), collections.Counter()   # Gruppengewicht je Kistenart, Items je Gruppe
    for x in items:
        for s in x["sources"]:
            k = (s["category"], s["entry"]); n[k] += 1; gw[s["category"]][s["entry"]] = max(gw[s["category"]].get(s["entry"], 0), s["weight"] or 0)
    tot = {c: sum(v.values()) for c, v in gw.items()}
    cats = sorted(tot); ci = {c: i for i, c in enumerate(cats)}
    out = {}
    for x in items:
        best = {}
        for s in x["sources"]:
            c = s["category"]; e = (s["weight"] or 0) / tot[c] / n[(c, s["entry"])] if tot.get(c) else 0
            best[c] = max(best.get(c, 0), e)
        if not best: continue
        top = max(best.values()) or 1
        out[norm(x["item"])] = [[ci[c], round(v / top, 2)] for c, v in sorted(best.items(), key=lambda kv: -kv[1])]
    m = d.get("meta") or {}
    res = {"src": "thefriendlyfiredepartment.org", "build": m.get("build"), "generated": m.get("generatedAt"), "cats": cats, "cats_de": [DE.get(c, c) for c in cats], "items": out}
    os.makedirs(os.path.dirname(OUT), exist_ok=True); tmp = OUT + ".tmp"; json.dump(res, open(tmp, "w"), ensure_ascii=False, separators=(",", ":")); os.chmod(tmp, 0o644); os.replace(tmp, OUT)
    print("loot-mirror ok: %d Items, %d Kistenarten, Build %s" % (len(out), len(cats), m.get("build")))

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1: OUT = sys.argv[1]
    main()
