# SC LMW – Star Citizen LiveMap Wiki

**Version 0.9.0**

*(English below / Deutsch weiter unten)*

> **Unofficial fan project. Not endorsed by, sponsored by, or affiliated with
> Cloud Imperium Games or Roberts Space Industries. Star Citizen® is a
> trademark of Cloud Imperium Rights LLC.**
> The same notice is shown inside the app itself (footer).

## Screenshots

| System overview | Planet view |
|---|---|
| ![System overview: Stanton, Pyro and Nyx with jump routes](docs/img/01-system-overview.png) | ![Planet view: Hurston with Lorville and a player group marker](docs/img/02-planet-view.png) |

| Search & live UEX prices | Player group |
|---|---|
| ![Search results and a live UEX commodity price list at a terminal](docs/img/03-search-prices.png) | ![Player list showing five fictional demo players and a group marker](docs/img/04-player-group.png) |

*(All screenshots show the fictional demo players from `players.example.json` — no real names.)*

## English

A standalone, static, login-free 3D map of the Star Citizen universe
(Stanton, Pyro, Nyx): systems, planets, moons, stations, jump points, full
search across locations/ores/items/ships/commodities/blueprints/missions,
live commodity prices from the UEX Corp API, and live 3D ship models from
FleetYards. Runs entirely in the browser — the only "backend" is a single
JSON file (or your own small endpoint) with your community's player
positions, which is entirely optional.

This is an open-source extraction of the Live Map feature originally built
for a private Star Citizen organization site. Everything specific to that
site — its domain, its members-only login system, Discord ids, member
profiles, community "place knowledge" notes, a report-to-our-server button —
has been removed. See [`CREDITS.md`](CREDITS.md) for full attribution and
licenses of everything this project builds on.

### Features

- Full 3D star map: Stanton, Pyro, Nyx — planets, moons, stations, jump points.
- Search across locations, ores, items, ships, commodities, blueprints (with recipes), missions.
- Live commodity/item prices straight from the UEX Corp API, no key needed.
- Live 3D ship models ("Holo") straight from FleetYards, with credit.
- Optional player positions from a URL you control, with automatic grouping
  when two or more players share a location.
- DE/EN toggle for in-game text.
- No login, no build step for the frontend, no server beyond a static file host.

### Quick start

```sh
# 1. Build the game data locally (clones scunpacked-data, fetches UEX/FleetYards
#    reference lists, writes ./data/*.json — nothing here is committed to git):
python3 scripts/build-all.py

# 2. Serve the project (any static file server works):
python3 -m http.server 8000

# 3. Open it:
#    http://localhost:8000/
```

No build step is needed for the frontend itself — it's plain HTML/CSS/JS,
three.js is vendored under `vendor/three/`.

### Embedding this in another website

SC LMW is built to drop into an existing site two ways, both fully scoped
under a `.sc-lmw` root (own CSS variables, own `window.SCLMW` global, sized
to its container via `ResizeObserver`, no styling of `body`/`html`):

**(a) iframe — the simplest way, one line:**

```html
<iframe src="https://your-host/live-map/index.html" style="width:100%;height:640px;border:0" allow="fullscreen"></iframe>
```

**(b) Directly in the page — a container and one script tag:**

```html
<div id="sc-lmw"></div>
<script src="https://your-host/live-map/js/sc-lmw.js" data-players-url="https://your-host/live-map/players.example.json"></script>
```

Working, tested examples of both (against a deliberately "hostile" guest
page with its own generic CSS) live in [`examples/iframe.html`](examples/iframe.html)
and [`examples/embed.html`](examples/embed.html). For the full step-by-step —
including sample backend snippets for your own players endpoint (Node/Express,
Python/Flask, PHP), CORS notes, and the AGPL obligations that apply once you
modify the code — see [`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md). It's
written as a ready-to-paste prompt for an AI coding assistant, so you can hand
the whole integration off to one.

### Showing players on the map

Out of the box, the map shows five fictional demo players from
`players.example.json`, so you can see it work with zero setup. To show your
own community's real players, point `PLAYERS_URL` in `config.js` (or
`data-players-url` on the `sc-lmw.js` script tag) at your own small
backend/bot that returns the same JSON shape. The full format is documented
in [`docs/PLAYERS_API.md`](docs/PLAYERS_API.md) — in short: id, name,
online/offline, last seen, an in-game location code, system, ship, and an
optional travel destination. Two or more players at the same location are
shown as a group automatically.

### Project layout

```
index.html              standalone entry point, wires config/css/js together
config.js                the only file most forks need to edit (PLAYERS_URL, ...)
players.example.json     5 fictional demo players (see docs/PLAYERS_API.md)
js/starmap.js            the 3D map engine, search, categories, UEX prices, blueprints, missions
js/holo.js               FleetYards 3D ship models ("Holo")
js/sc-lmw.js             one-script-tag loader for embedding into another site
css/starmap.css          map-specific styles, all scoped under .sc-lmw
vendor/three/            three.js r128 + GLTFLoader/OrbitControls/DRACOLoader (MIT), vendored
data/                    built game data (git-ignored, run scripts/build-all.py)
scripts/                 data build pipeline (Python)
examples/                working iframe.html + embed.html examples, with a hostile guest CSS test
docs/PLAYERS_API.md      the players-JSON contract, in full
docs/AI_INTEGRATION.md   copy-paste prompt for an AI to integrate this into your site
LICENSE                  AGPL-3.0
CREDITS.md               attribution for every data source and library
package.json / VERSION  project name ("sc-lmw") and version (0.9.0), no build tooling needed
```

### Data sources used at runtime (not shipped)

- `api.uexcorp.space` — commodity/item prices, fetched live from the browser.
- `fleetyards.net` — ship specs and 3D models, fetched live from the browser.
- Your own `PLAYERS_URL` — optional, for showing real players.

### Building the game data yourself

`scripts/build-all.py` clones the community `scunpacked-data` export of Star
Citizen's game files into `.cache/`, then runs the individual build scripts
that turn it into the JSON files under `data/`. It needs network access to
GitHub, UEX and FleetYards. It intentionally does **not** download or store
any images from the RSI star map — systems are shown without that image.
An optional German in-game text translation can be fetched with
`python3 scripts/build-all.py --with-de` (CC BY-NC-SA, see
`scripts/README_DE_INI.md`).

### Contributing / show us what you build

This is meant to be forked, adapted and improved. If you build something
with it — your own community map, a new feature, a bugfix — we'd love to
hear about it: please open an issue on this project's GitHub page (see
GitHub Issues) and tell us. No pressure, just curious.

### License

AGPL-3.0, see [`LICENSE`](LICENSE). This means: if you run a modified version
of this on a server that other people use, you must offer them the modified
source code too. See [`CREDITS.md`](CREDITS.md) for the licenses of the
third-party code and data this project depends on (three.js is MIT; game
data comes from community projects under their own terms).

---

## Deutsch

Eine eigenständige, statische, loginfreie 3D-Karte des Star-Citizen-Universums
(Stanton, Pyro, Nyx): Systeme, Planeten, Monde, Stationen, Sprungpunkte,
komplette Suche über Orte/Erze/Items/Schiffe/Waren/Blueprints/Missionen,
Live-Warenpreise von der UEX-Corp-API und Live-3D-Schiffsmodelle von
FleetYards. Läuft komplett im Browser — das einzige "Backend" ist eine
einzelne JSON-Datei (oder dein eigener kleiner Endpunkt) mit den
Spielerpositionen deiner Community, und das ist vollkommen optional.

Dies ist eine Open-Source-Auskopplung der Live-Map-Funktion, die
ursprünglich für die private Website einer Star-Citizen-Organisation gebaut
wurde. Alles, was speziell zu dieser Website gehörte — ihre Domain, ihr
eigenes Mitglieder-Login, Discord-IDs, Mitgliederprofile, das
Community-„Orts-Wissen", ein Melde-Knopf an unseren Server — wurde entfernt.
Vollständige Quellenangaben und Lizenzen aller Bausteine stehen in
[`CREDITS.md`](CREDITS.md).

### Funktionen

- Volle 3D-Sternenkarte: Stanton, Pyro, Nyx — Planeten, Monde, Stationen, Sprungpunkte.
- Suche über Orte, Erze, Items, Schiffe, Waren, Blueprints (mit Rezept), Missionen.
- Live-Waren-/Item-Preise direkt von der UEX-Corp-API, kein Schlüssel nötig.
- Live-3D-Schiffsmodelle ("Holo") direkt von FleetYards, mit Quellenangabe.
- Optionale Spielerpositionen aus einer selbst bestimmten URL, automatische
  Gruppierung ab zwei Spielern am selben Ort.
- DE/EN-Umschaltung für Spieltexte.
- Kein Login, kein Build-Schritt fürs Frontend, kein Server außer einem
  statischen Datei-Host.

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
