# SC LMW – Star Citizen LiveMap Wiki

**Version 1.0.0** · AGPL-3.0 · [Deutsche Version](README.de.md)

**Your whole 'verse on one screen.** A free, open-source 3D map of Star Citizen: every system, planet, moon, station and jump point, a search that knows where to find every ore, item, ship, commodity, blueprint and mission, live trade prices, holographic 3D ships, and your own org's pilots flying around on it in real time.

Drop it into your org website with one line of HTML, or hand the included prompt to an AI and let it do the wiring for you.

> **Unofficial fan project.** Not endorsed by, sponsored by, or affiliated with Cloud Imperium Games or Roberts Space Industries. Star Citizen® is a trademark of Cloud Imperium Rights LLC. The same notice is shown inside the app.

| Stanton, Pyro and Nyx in one view | Down to the planet |
|---|---|
| ![System overview: Stanton, Pyro and Nyx with jump routes](docs/img/01-system-overview.png) | ![Planet view: Hurston with Lorville and a player group marker](docs/img/02-planet-view.png) |

| Search anything, see live prices | Your pilots, grouped by location |
|---|---|
| ![Search results and a live UEX commodity price list at a terminal](docs/img/03-search-prices.png) | ![Player list with fictional demo players and a group marker](docs/img/04-player-group.png) |

*All screenshots use the fictional demo pilots from `players.example.json`.*

---

## What you can do with it

- **Run your org like a fleet command.** See who is online and where they are: Levski, Orison, a Pyro rest stop or halfway through a quantum jump. Five pilots at the same station collapse into one clean marker ("Levski · 5 pilots, 2 online"); tap it for the list.
- **Find anything in seconds.** Type "Quantanium", "Arrow", "Laranite", "P4-AR" or "Lorville" and the map flies you there. The search covers locations, ores, items, ships, commodities, blueprints and missions.
- **Plan trade runs.** Open any terminal and see live buy and sell prices from UEX, straight from the source, no API key needed.
- **Hunt blueprints.** Every blueprint in the game data with its full crafting recipe (parts, resources, minimum quality), and which missions reward it.
- **Scout missions.** See which mission types are offered where and by whom, and which blueprints they can reward.
- **Go mining.** Find which planets, moons and belts carry the ore you are after.
- **Run the big loops.** Contested Zones (Checkmate, Orbituary, Ruin Station), the supervisor stations and the Executive Hangar show the full procedure right at the location: a live Executive Hangar timer with the 5 status lights, a Ruin vault door timer you sync once per server, tap-to-start respawn timers, which keycards and boards you get or need, and the route maps. Align & Mine, Storm Breaker (Apex Valakkar), Siege of Orison and Jumptown are explained at their locations too, all linked to each other.
- **Find loot.** Item view shows which container and location types an item can drop from, ranked from best to rarer chance (optional, built from the Friendly Fire Department game-data export with `--with-loot`).
- **Works on the phone.** On small screens the controls sit in one dock at the bottom, all buttons are thumb-sized and nothing overlaps.
- **Show off the fleet.** Rotating holographic 3D models of the ships, loaded live from FleetYards, with specs, prices and where to buy or rent.
- **Put it on stream.** It runs in any browser source, so it works as an overlay or info screen for streams and org meetings.
- **Make it yours.** Plain HTML, CSS and JavaScript. No framework and no build step for the frontend, easy to restyle and extend.

## Install in 3 steps

You need Python 3 (to build the game data once) and any static web server.

```sh
# 1. Get the code
git clone https://github.com/nico-gordon-gilles/sc-lmw.git
cd sc-lmw

# 2. Build the game data (downloads the community game-data export and reference lists,
#    writes ./data/*.json; this takes a few minutes and needs internet access)
python3 scripts/build-all.py

# 3. Serve it and open http://localhost:8000/
python3 -m http.server 8000
```

That's it. You will see the map with five fictional demo pilots. Re-run step 2 after a game patch to refresh the data.

Optional: `python3 scripts/build-all.py --with-de` adds the German in-game texts (community translation, CC BY-NC-SA, see `scripts/README_DE_INI.md`).

## Put it on your website

**Option A: iframe (simplest, one line).** Upload the folder to your web host, then:

```html
<iframe src="https://your-site.example/sc-lmw/index.html"
        style="width:100%;height:640px;border:0" allow="fullscreen"></iframe>
```

**Option B: directly in your page.** A container and one script tag:

```html
<div id="sc-lmw" style="height:640px"></div>
<script src="https://your-site.example/sc-lmw/js/sc-lmw.js"
        data-base="https://your-site.example/sc-lmw/"
        data-players-url="https://your-site.example/api/players"></script>
```

The map stays inside its box. It never styles your `body`, fonts or layout, uses one global name (`window.SCLMW`), scales with its container and works from any domain or sub-folder. Both ways are tested against a deliberately "hostile" guest page: see [`examples/iframe.html`](examples/iframe.html) and [`examples/embed.html`](examples/embed.html).

## Interface language (German/English)

The whole interface — buttons, panels, search, legend, error messages, time phrases, number format — is bilingual, German and English. It auto-detects the visitor's browser language (`de*` → German, else English), and there's a small language switch in the map itself (globe icon) that changes it live, no reload, remembered per visitor in their own browser. You can also set it explicitly:

- `LANG` in `config.js`: `'auto'` (default), `'de'`, or `'en'`.
- `data-lang="de"` on the `sc-lmw.js` script tag (direct-embed method).
- `mount(el, { lang: 'de' })` if you call `SCLMW.mount()` yourself.

This is a **separate** setting from the small "DE"/"EN" button that was already in the map before: that older button only translates in-game text (mission types, amenity names, the German community description) and is untouched by this. The interface language never changes game/location/ship/item names — those stay exactly as the game names them, in whichever language your data build used.

## Show your own pilots

Point `PLAYERS_URL` in `config.js` (or `data-players-url` on the script tag) at a small endpoint of yours that returns JSON like this:

```json
{
  "players": [
    { "id": "pilot-1", "name": "Pilot Alpha", "online": true,
      "last_seen": "2026-09-28T09:58:00Z",
      "code": "Nyx_Levski", "location": "Levski", "system": "Nyx",
      "ship": "Drake Cutlass Black" }
  ]
}
```

`code` is the location code Star Citizen writes into its `Game.log`. The map resolves it to the right station, city, outpost or rest stop by itself. Where that data comes from is up to you: a Discord bot, a companion app your members run, or a form on your site. The full contract, including travel destinations, the optional `when` field, refresh interval (`PLAYERS_POLL_MS`) and custom headers, is in [`docs/PLAYERS_API.md`](docs/PLAYERS_API.md).

## Let an AI build it into your site

[`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md) contains a complete, copy-paste prompt (English and German) for Claude, ChatGPT or any coding assistant. It explains your setup to the AI: copying the files, building the data, choosing iframe or direct embed, creating a players endpoint (with ready examples for Node/Express, Python/Flask and PHP), CORS, keeping the fan-project notice visible, and your AGPL obligations. Paste it, add one line about your own site, and the AI can do the rest without asking back.

Short version to get started:

```text
I want to add SC LMW (https://github.com/nico-gordon-gilles/sc-lmw), an open-source
Star Citizen 3D map, to my website. Read its README.md, docs/AI_INTEGRATION.md and
docs/PLAYERS_API.md, then: build the data with scripts/build-all.py, embed the map
(iframe or the sc-lmw.js script tag), and create a players endpoint in my backend that
returns the JSON format from PLAYERS_API.md. Keep the "unofficial fan project" notice
visible. My site is: <describe your stack and where the map should appear>.
```

## Where the data comes from

| What | Source | How |
|---|---|---|
| Locations, ores, items, blueprints, missions | community `scunpacked-data` export of the game files | built locally by `scripts/`, **not shipped** in this repo |
| Trade prices | [UEX Corp](https://uexcorp.space) API | fetched live in the browser |
| Ship specs and 3D models | [FleetYards](https://fleetyards.net) | fetched live in the browser, credited in the app |
| 3D engine | [three.js](https://threejs.org) r128 (MIT) | included under `vendor/three/` |
| Your pilots | your own `PLAYERS_URL` | optional |

Game data and images are not redistributed here. Every user builds them from the original sources. RSI star-map images are intentionally not downloaded. Full attribution: [`CREDITS.md`](CREDITS.md).

**Guides and optional extras**

- Gameplay procedures and route maps: [starcitizen.tools](https://starcitizen.tools) (maps and photos CC BY-SA 4.0, see `img/guides/` and CREDITS.md).
- Executive Hangar cycle: [exec.xyxyll.com](https://exec.xyxyll.com) (MIT). `scripts/exec-build.py` refreshes it into `data/exec.json` (run by `build-all.py`; without it the map uses built-in values).
- Respawn times: [exectimer.com](https://exectimer.com).
- Loot locations: [Friendly Fire Department](https://thefriendlyfiredepartment.org) game-data export, only with `python3 scripts/build-all.py --with-loot`. Not redistributed in this repository.

## Project layout

```
index.html              standalone page
config.js               the one file most people edit (PLAYERS_URL, ...)
players.example.json    five fictional demo pilots
js/starmap.js           map engine: 3D scene, search, categories, prices, blueprints, missions
js/holo.js              FleetYards 3D ship models
js/i18n.js              interface language (German/English), see "Interface language" above
js/sc-lmw.js            one-script-tag loader for embedding
css/starmap.css         styles, all scoped under .sc-lmw
vendor/three/           three.js r128 + loaders (MIT)
scripts/                data build pipeline (Python)
examples/               iframe and direct-embed examples
docs/                   players API, AI integration prompt, screenshots
```

## Show us what you build

Fork it, restyle it, add features, run it for your org. If you build something with it, we would love to see it: open an issue on this repository and tell us. No obligation, just curiosity.

## License

**AGPL-3.0** (see [`LICENSE`](LICENSE)). You may use, change and share it freely. If you run a **modified** version on a server that other people use, you must make your modified source code available to them as well. Third-party code and data keep their own licenses, see [`CREDITS.md`](CREDITS.md).
