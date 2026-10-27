# SC LMW – Star Citizen LiveMap Wiki (Deutsch)

> **Inoffizielles Fan-Projekt. Nicht von Cloud Imperium Games oder Roberts Space Industries unterstützt, gesponsert oder mit ihnen verbunden. Star Citizen® ist eine Marke von Cloud Imperium Rights LLC.**

[English](README.md) · Deutsch · [简体中文](README.md#简体中文) · [繁體中文](README.md#繁體中文) · [Was sich geändert hat](docs/WHATS_NEW.md)

**Website:** https://gugugubear.pythonanywhere.com/


Eine eigenständige, statische, loginfreie 3D-Karte des Star-Citizen-Universums
(Stanton, Pyro, Nyx): Systeme, Planeten, Monde, Stationen, Sprungpunkte,
komplette Suche über Orte/Erze/Items/Schiffe/Waren/Blueprints/Missionen,
Live-Warenpreise von der UEX-Corp-API und Live-3D-Schiffsmodelle von
FleetYards. Läuft komplett im Browser — das einzige "Backend" ist eine
einzelne JSON-Datei (oder dein eigener kleiner Endpunkt) mit den
Spielerpositionen deiner Community, und das ist vollkommen optional.

Vollständige Quellenangaben und Lizenzen aller Bausteine stehen in [`CREDITS.md`](CREDITS.md).

### Funktionen

- Volle 3D-Sternenkarte: Stanton, Pyro, Nyx — Planeten, Monde, Stationen, Sprungpunkte.
- Suche über Orte, Erze, Items, Schiffe, Waren, Blueprints (mit Rezept), Missionen.
- Live-Waren-/Item-Preise direkt von der UEX-Corp-API, kein Schlüssel nötig.
- Live-3D-Schiffsmodelle ("Holo") direkt von FleetYards, mit Quellenangabe.
- Optionale Spielerpositionen aus einer selbst bestimmten URL, automatische
  Gruppierung ab zwei Spielern am selben Ort.
- Oberfläche auf Deutsch, Englisch, vereinfachtem und traditionellem Chinesisch
  (automatisch per Browsersprache, oder fest per `LANG`/`data-lang`/`mount(...,{lang})`).
  Ein Knopf schaltet alles. Deutsch zeigt deutsche Spielnamen, Chinesisch zeigt chinesische Ortsnamen.
- Kein Login, kein Build-Schritt fürs Frontend, kein Server außer einem
  statischen Datei-Host.

- **Die großen Loops:** Contested Zones (Checkmate, Orbituary, Ruin Station), die Supervisor-Stationen und der Executive Hangar zeigen den ganzen Ablauf direkt am Ort: Live-Timer des Executive Hangars mit den 5 Lichtern, Tresortür-Timer der Ruin Station (einmal je Server abgleichen), Respawn-Timer zum Antippen, welche Keycards und Boards man bekommt oder braucht, und die Laufroutenkarten. Align & Mine, Storm Breaker (Apex-Valakkar), Siege of Orison und Jumptown stehen ebenfalls an ihren Orten, alles untereinander verlinkt.
- **Beute finden:** In der Item-Ansicht steht, in welchen Kisten- und Ortsarten ein Item liegen kann, sortiert nach bester Chance (optional, aus den Spieldaten der Friendly Fire Department, mit `--with-loot`).
- **Am Handy:** Die Bedienung sitzt unten in einem Dock, alle Knöpfe sind daumengroß, nichts überlappt.
### Schnellstart

```sh
# 1. Spieldaten einmal lokal bauen (klont scunpacked-data, holt UEX-/FleetYards-
#    Referenzlisten, schreibt ./data/*.json -- nichts davon kommt ins Git):
python3 scripts/build-all.py

# 2. Projekt ausliefern (jeder statische Webserver reicht):
python3 -m http.server 8000

# 3. Öffnen:
#    http://localhost:8000/
```

Das Frontend selbst braucht keinen Build-Schritt, es ist reines HTML/CSS/JS,
three.js liegt fertig unter `vendor/three/`.

### Einbau in eine andere Website

SC LMW ist so gebaut, dass es auf zwei Wegen in eine bestehende Seite passt,
beides vollständig unter einer Wurzelklasse `.sc-lmw` gekapselt (eigene
CSS-Variablen, ein einziges globales `window.SCLMW`, Größe folgt per
`ResizeObserver` dem eigenen Container, kein Zugriff auf `body`/`html`):

**(a) iframe — der einfachste Weg, eine Zeile:**

```html
<iframe src="https://dein-server/live-map/index.html" style="width:100%;height:640px;border:0" allow="fullscreen"></iframe>
```

**(b) Direkt in die Seite — ein Container und ein Script-Tag:**

```html
<div id="sc-lmw"></div>
<script src="https://dein-server/live-map/js/sc-lmw.js" data-players-url="https://dein-server/live-map/players.example.json"></script>
```

Funktionierende, getestete Beispiele beider Wege (gegen eine absichtlich
"feindliche" Gastseite mit eigenem, generischem CSS) liegen in
[`examples/iframe.html`](examples/iframe.html) und
[`examples/embed.html`](examples/embed.html). Die vollständige
Schritt-für-Schritt-Anleitung — inklusive Beispiel-Backends für deinen
eigenen Spieler-Endpunkt (Node/Express, Python/Flask, PHP), CORS-Hinweisen
und den AGPL-Pflichten, die bei eigenen Änderungen greifen — steht in
[`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md). Sie ist als fertiger,
einfügbarer Prompt für eine KI geschrieben, du kannst den ganzen Einbau also
auch an eine KI abgeben.

### Oberflächensprache

Die Oberfläche — Knöpfe, Panels, Suche, Legende, Fehlermeldungen, Zeitangaben,
Zahlenformat — gibt es auf Deutsch, Englisch, vereinfachtem Chinesisch und
traditionellem Chinesisch. Sie folgt der Browsersprache (`zh-TW` / `zh-HK` /
`zh-MO` → traditionell, anderes `zh*` → vereinfacht, `de*` → Deutsch, sonst
Englisch). Der Sprachknopf öffnet die Liste und wechselt live, ohne
Neuladen. Die Wahl bleibt in diesem Browser gespeichert.

- `LANG` in `config.js`: `'auto'` (Standard), `'de'`, `'en'`, `'zh-Hans'` oder `'zh-Hant'`.

### Darstellung

Fünf Themen, umschaltbar über den ▣-Knopf neben der Sprache, gemerkt im Browser:
Klassisch, Kompakt, Praktisch, Gehäuse und Science-Fiction. `THEME` in `config.js`
ist `'compact'` (Standard), `'classic'`, `'practical'`, `'chassis'` oder `'scifi'`.
Die eigene Wahl des Besuchers schlägt diese Vorgabe.
- `data-lang="de"` am `sc-lmw.js`-Script-Tag (Weg b, direkter Einbau).
- `mount(el, { lang: 'de' })`, falls du `SCLMW.mount()` selbst aufrufst.

Deutsch zeigt dazu deutsche Missions- und Ausstattungsnamen. Chinesisch zeigt
chinesische Ortsnamen. Englisch bleibt bei den englischen Namen. Für Besucher
steht das kurz in [docs/WHATS_NEW.md](docs/WHATS_NEW.md).

### Spieler auf der Karte zeigen

Ohne jede Einrichtung zeigt die Karte fünf erfundene Demo-Spieler aus
`players.example.json`, damit man sofort sieht, dass sie funktioniert. Für
echte Spieler deiner eigenen Community trägst du in `config.js` (oder als
`data-players-url` am `sc-lmw.js`-Script-Tag) deinen eigenen kleinen
Server/Bot ein, der dieselbe JSON-Form liefert. Das vollständige Format
steht in [`docs/PLAYERS_API.md`](docs/PLAYERS_API.md): kurz gesagt ID, Name,
online/offline, zuletzt gesehen, ein Ortscode aus dem Spiel, System, Schiff
und optional ein Reiseziel. Zwei oder mehr Spieler am selben Ort werden
automatisch als Gruppe gezeigt.

### Projektaufbau

Siehe Baum oben (englischer Abschnitt) — die Struktur ist sprachneutral.

### Zur Laufzeit genutzte Datenquellen (nicht mitgeliefert)

- `api.uexcorp.space` — Waren-/Item-Preise, direkt aus dem Browser geladen.
- `fleetyards.net` — Schiffsdaten und 3D-Modelle, direkt aus dem Browser geladen.
- Dein eigener `PLAYERS_URL` — optional, für echte Spieler.

**Guides und optionale Extras**

- Abläufe und Laufroutenkarten: [starcitizen.tools](https://starcitizen.tools) (Karten und Fotos CC BY-SA 4.0, siehe `img/guides/` und CREDITS.md).
- Zyklus des Executive Hangars: [exec.xyxyll.com](https://exec.xyxyll.com) (MIT). `scripts/exec-build.py` schreibt ihn nach `data/exec.json` (läuft in `build-all.py`; ohne die Datei rechnet die Karte mit eingebauten Werten).
- Respawn-Zeiten: [exectimer.com](https://exectimer.com).
- Beute-Fundorte: Spieldaten-Export der [Friendly Fire Department](https://thefriendlyfiredepartment.org), nur mit `python3 scripts/build-all.py --with-loot`. Wird nicht in diesem Repository verteilt.

### Spieldaten selbst bauen

`scripts/build-all.py` klont den community-gepflegten `scunpacked-data`-Export
der Star-Citizen-Spieldateien nach `.cache/` und ruft danach die einzelnen
Bau-Skripte auf, die daraus die JSON-Dateien unter `data/` machen. Dafür
braucht es Netzzugriff auf GitHub, UEX und FleetYards. Es lädt **absichtlich
keine** Bilder von der RSI-Sternenkarte herunter — Systeme werden ohne dieses
Bild dargestellt. Eine optionale deutsche Übersetzung der Spieltexte lässt
sich mit `python3 scripts/build-all.py --with-de` dazuholen (CC BY-NC-SA,
siehe `scripts/README_DE_INI.md`).

### Mitmachen / zeig uns, was du daraus machst

Das Projekt ist zum Forken, Anpassen und Weiterbauen gedacht. Wenn du damit
etwas baust, egal ob eigene Community-Karte, neues Feature oder Bugfix, freuen
wir uns über ein Issue auf der GitHub-Seite dieses Projekts (siehe GitHub
Issues). Ganz ohne Druck, nur aus Neugier.

### Lizenz

AGPL-3.0, siehe [`LICENSE`](LICENSE). Das heißt: läuft eine veränderte
Version davon auf einem Server, den andere Leute benutzen, muss ihnen auch
der veränderte Quellcode angeboten werden. Die Lizenzen der Bausteine, auf
denen dieses Projekt aufbaut, stehen in [`CREDITS.md`](CREDITS.md) (three.js
ist MIT, Spieldaten stammen aus Community-Projekten unter deren eigenen
Bedingungen).
