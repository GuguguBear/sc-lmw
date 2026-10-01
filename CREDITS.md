# Credits / Danksagung

*(English below / Deutsch weiter unten)*

## English

This project stands on the shoulders of several open communities and public
APIs. Please keep this file, and the attributions inside the app, when you
fork or redistribute this project.

- **three.js** (`vendor/three/`) — MIT License, © three.js authors.
  https://threejs.org / https://github.com/mrdoob/three.js
  Includes `GLTFLoader.js`, `OrbitControls.js`, `DRACOLoader.js` and the Draco
  decoder from the same project's `examples/js/` tree, and the Draco codec
  itself, © Google, Apache-2.0 (https://github.com/google/draco).

- **UEX Corp** (`api.uexcorp.space`) — commodity, item and terminal price
  data is fetched live, at runtime, directly from the UEX Corp public API.
  Not included in this repository. https://uexcorp.space — please respect
  their API terms if you build on this project.

- **FleetYards.net** — ship specs and 3D ship models ("Holo") are fetched
  live, at runtime, directly from the FleetYards public API and CDN. Not
  included in this repository. https://fleetyards.net — 3D models and ship
  data © their respective copyright holders, served with FleetYards'
  permission for community tools; please keep the in-app source link.

- **scunpacked-data** — the base game data (systems, celestial bodies,
  items, ships, missions, blueprints) that `scripts/build-all.py` turns into
  this project's `data/` files comes from the community-maintained
  scunpacked-data export of Star Citizen's game files. See
  `scripts/build-all.py` for the exact source repository used. Not included
  in this repository (built locally, git-ignored).

- **Star Citizen Deutsch (`global_de.ini`)** — the optional German in-game
  text translation, fetched only with `--with-de`, is maintained by the
  Star Citizen Deutsch community and licensed CC BY-NC-SA 4.0
  (https://creativecommons.org/licenses/by-nc-sa/4.0/). See
  `scripts/README_DE_INI.md` for the exact source. Not included in this
  repository (built locally, git-ignored, and only on request).

- **starcitizen.tools** — gameplay procedures of the Contested Zones, the Executive Hangar and the big loops, and
  the route maps and photos in `img/guides/` (resized), by Terada, Kerast, T00dled00 and Banon, licensed
  CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). The Checkmate map has no stated license and is
  only linked, not included. https://starcitizen.tools

- **exec.xyxyll.com** (Xyxyll) — Executive Hangar cycle (anchor, drift, phase lengths), MIT License.
  `scripts/exec-build.py` reads it at build time. https://exec.xyxyll.com

- **exectimer.com** — respawn times of keycard printers and boards in the Contested Zones. https://exectimer.com

- **Friendly Fire Department** — loot locations per item (`scripts/loot-build.py`, opt-in with `--with-loot`),
  from their export of the game data. Not included in this repository; built locally only.
  https://thefriendlyfiredepartment.org

- **Cloud Imperium Games / Roberts Space Industries** — Star Citizen, all
  game assets, ship names, location names and the "Star Citizen" brand are
  their intellectual property. This project only displays publicly available
  game information; it does not include or redistribute any game assets.

## Trademark / brand notice

This is an unofficial, fan-made project. It is not endorsed by, sponsored
by, or affiliated with Cloud Imperium Games or Roberts Space Industries.
"Star Citizen" is a registered trademark of Cloud Imperium Rights LLC.

---

## Deutsch

Dieses Projekt steht auf den Schultern mehrerer offener Communitys und
öffentlicher APIs. Bitte lass diese Datei und die Quellenangaben in der App
stehen, wenn du das Projekt forkst oder weitergibst.

- **three.js** (`vendor/three/`) — MIT-Lizenz, © three.js authors.
  https://threejs.org / https://github.com/mrdoob/three.js
  Enthält `GLTFLoader.js`, `OrbitControls.js`, `DRACOLoader.js` und den
  Draco-Decoder aus demselben `examples/js/`-Baum, sowie den Draco-Codec
  selbst, © Google, Apache-2.0 (https://github.com/google/draco).

- **UEX Corp** (`api.uexcorp.space`) — Waren-, Item- und Terminal-Preise
  werden zur Laufzeit direkt von der öffentlichen UEX-Corp-API geladen, nicht
  Teil dieses Repos. https://uexcorp.space — bitte deren API-Bedingungen
  einhalten, wenn du darauf aufbaust.

- **FleetYards.net** — Schiffsdaten und 3D-Modelle ("Holo") werden zur
  Laufzeit direkt von der öffentlichen FleetYards-API und ihrem CDN geladen,
  nicht Teil dieses Repos. https://fleetyards.net — 3D-Modelle und
  Schiffsdaten © der jeweiligen Rechteinhaber, von FleetYards für
  Community-Tools freigegeben; bitte den Quellenlink in der App erhalten.

- **scunpacked-data** — die Basis-Spieldaten (Systeme, Himmelskörper, Items,
  Schiffe, Missionen, Blueprints), aus denen `scripts/build-all.py` die
  `data/`-Dateien dieses Projekts baut, stammen aus dem community-gepflegten
  scunpacked-data-Export der Star-Citizen-Spieldateien. Die genaue
  Quell-Repository steht in `scripts/build-all.py`. Nicht Teil dieses Repos
  (wird lokal gebaut, per .gitignore ausgeschlossen).

- **Star Citizen Deutsch (`global_de.ini`)** — die optionale deutsche
  Übersetzung der Spieltexte, nur mit `--with-de` geladen, wird von der
  Star-Citizen-Deutsch-Community gepflegt und steht unter CC BY-NC-SA 4.0
  (https://creativecommons.org/licenses/by-nc-sa/4.0/). Genaue Quelle in
  `scripts/README_DE_INI.md`. Nicht Teil dieses Repos (wird lokal und nur auf
  Wunsch gebaut, per .gitignore ausgeschlossen).

- **starcitizen.tools** — Abläufe der Contested Zones, des Executive Hangars und der großen Loops, dazu die
  Laufroutenkarten und Fotos in `img/guides/` (verkleinert), von Terada, Kerast, T00dled00 und Banon, Lizenz
  CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). Die Checkmate-Karte hat keine angegebene Lizenz
  und ist nur verlinkt, nicht enthalten. https://starcitizen.tools

- **exec.xyxyll.com** (Xyxyll) — Zyklus des Executive Hangars (Anker, Drift, Phasenlängen), MIT-Lizenz.
  `scripts/exec-build.py` liest ihn beim Bauen. https://exec.xyxyll.com

- **exectimer.com** — Respawn-Zeiten der Keycard-Drucker und Boards in den Contested Zones. https://exectimer.com

- **Friendly Fire Department** — Beute-Fundorte je Item (`scripts/loot-build.py`, nur mit `--with-loot`), aus deren
  Export der Spieldaten. Nicht in diesem Repository enthalten, wird nur lokal gebaut.
  https://thefriendlyfiredepartment.org

- **Cloud Imperium Games / Roberts Space Industries** — Star Citizen, alle
  Spiel-Assets, Schiffs- und Ortsnamen sowie die Marke "Star Citizen" sind
  deren geistiges Eigentum. Dieses Projekt zeigt nur öffentlich verfügbare
  Spielinformationen an, es enthält und verbreitet keine Spiel-Assets.

## Marken-Hinweis

Dies ist ein inoffizielles Fan-Projekt. Es wird von Cloud Imperium Games
oder Roberts Space Industries weder unterstützt noch gesponsert, und steht
in keiner Verbindung zu ihnen. „Star Citizen“ ist eine eingetragene Marke
der Cloud Imperium Rights LLC.
