# SC LMW – Star Citizen LiveMap Wiki (Deutsch)

> **Inoffizielles Fan-Projekt. Nicht von Cloud Imperium Games oder Roberts Space Industries unterstützt, gesponsert oder mit ihnen verbunden. Star Citizen® ist eine Marke von Cloud Imperium Rights LLC.**

[English version](README.md)


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
- DE/EN-Umschaltung für die Oberfläche selbst (automatisch per Browsersprache,
  oder fest per `LANG`/`data-lang`/`mount(...,{lang})`), UND eine eigene,
  getrennte DE/EN-Umschaltung für Spieltexte.
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

### Oberflächensprache (Deutsch/Englisch)

Die ganze Oberfläche — Knöpfe, Panels, Suche, Legende, Fehlermeldungen,
Zeitangaben, Zahlenformat — ist zweisprachig, Deutsch und Englisch. Sie
erkennt automatisch die Browsersprache des Besuchers (`de*` → Deutsch, sonst
Englisch), und in der Karte selbst gibt es einen kleinen Sprach-Umschalter
(Globus-Symbol), der sie live wechselt, ohne Neuladen, und sich je Besucher
im eigenen Browser merkt. Du kannst sie auch fest vorgeben:

- `LANG` in `config.js`: `'auto'` (Standard), `'de'` oder `'en'`.
- `data-lang="de"` am `sc-lmw.js`-Script-Tag (Weg b, direkter Einbau).
- `mount(el, { lang: 'de' })`, falls du `SCLMW.mount()` selbst aufrufst.

Das ist eine **eigene, getrennte** Einstellung vom kleinen "DE"/"EN"-Knopf,
den es schon vorher in der Karte gab: dieser ältere Knopf übersetzt nur
Spieltexte (Missionstypen, Ausstattungsnamen, die deutsche
Community-Beschreibung) und bleibt davon unberührt. Die
Oberflächensprache ändert nie Spiel-/Orts-/Schiffs-/Item-Namen — die bleiben
immer so, wie das Spiel sie nennt, in welcher Sprache auch immer dein
Datenbau lief.

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
