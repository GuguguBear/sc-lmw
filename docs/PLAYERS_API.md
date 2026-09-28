# Players API / Spieler-Schnittstelle

*(English below / Deutsch weiter unten)*

## English

The Live Map can show your community's players on the 3D star map: where they
are, whether they are online, what ship they are flying, and whether several
people are grouped up at the same location. It reads this from a single URL
you control (`PLAYERS_URL` in `config.js`) — the map itself never talks to a
specific backend. Point it at your own bot/bridge, or leave it at the bundled
`players.example.json` to see the map work with fictional demo data.

### Request

The map does a plain `GET` request to `PLAYERS_URL`, with the optional headers
from `PLAYERS_HEADERS` (e.g. a bearer credential), on load and then every
`PLAYERS_POLL_MS` milliseconds.

### Response

```json
{
  "players": [
    {
      "id": "demo-1",
      "name": "Pilot Alpha",
      "online": true,
      "last_seen": "2026-09-28T09:58:00Z",
      "code": "RR_HUR_Lorville",
      "location": "Lorville",
      "system": "Stanton",
      "ship": "Aegis Avenger Titan",
      "travel": null
    }
  ]
}
```

| Field       | Type            | Meaning |
|-------------|-----------------|---------|
| `id`        | string          | Stable, unique id for this player. Use whatever your backend uses (a database id, a hashed handle, ...). **Never a Discord id or other third-party account id** — see the privacy note below. |
| `name`      | string          | Display name shown on the map. |
| `online`    | boolean         | Whether the player is currently in-game / connected. |
| `last_seen` | ISO-8601 string | Timestamp of the last known position update. Used to grey out stale positions and to show "seen 12 min ago". |
| `code`      | string          | The raw in-game location code, as it appears in the player's `Game.log` (e.g. `RR_HUR_Lorville`, `RR_S1_ARC_L1`, `RR_MIC_NB_Outpost_Kudre_Ore`). The map resolves this to a 3D position with a chain of exact match → known aliases → fuzzy word-fragment matching against system/planet/moon/station names. If you don't have log parsing, you may instead fill `location`/`system` only and leave `code` empty — the map falls back to a best-effort match by name. |
| `location`  | string          | Human-readable location name, used as a fallback and for display. |
| `system`    | string          | Star system name (`Stanton`, `Pyro`, `Nyx`, ...). |
| `ship`      | string or null  | The ship's UEX display name (e.g. `Aegis Avenger Titan`), used to look up specs and a 3D FleetYards model ("Holo"). Leave empty/`null` if unknown. |
| `travel`    | object or null  | Optional: `{ "to_raw": "<code>", "to": "<name>" }` describing an in-progress quantum travel destination. Leave `null` if not tracked. |

### Grouping

When two or more players resolve to the same location, the map automatically
shows them as a group marker instead of stacking icons. No extra field is
needed — this is purely derived from matching `code`/`location`+`system`.

### Where `code` comes from

In the original tool this was extracted server-side from each player's
`Game.log` (Star Citizen writes a line whenever the player changes location or
ship). That log-parsing/bot part is **not** included in this project — it is
specific to how each community runs its game clients. You need to write your
own small bridge (Discord bot, log-watcher, whatever fits) that turns "player
X is now at location Y" into an entry in the JSON above, and serves it at
`PLAYERS_URL`. `players.example.json` is a static file you can start from, or
replace with a small HTTP endpoint that returns the same shape.

### Privacy

Do not put real names, Discord ids, or other personally identifying data into
`id`/`name` unless your own community has agreed to that. `id` only needs to
be stable and unique — it is never displayed.

---

## Deutsch

Die Live-Karte kann die Spieler deiner Community auf der 3D-Sternenkarte
zeigen: wo sie sich befinden, ob sie online sind, welches Schiff sie fliegen,
und ob mehrere Leute am selben Ort gruppiert sind. Sie liest das aus genau
einer URL, die du selbst bestimmst (`PLAYERS_URL` in `config.js`) — die Karte
selbst spricht mit keinem bestimmten Server. Trag dort deinen eigenen
Bot/Bridge ein, oder lass es bei der mitgelieferten `players.example.json`,
um die Karte mit erfundenen Demo-Daten zu sehen.

### Anfrage

Die Karte macht ein einfaches `GET` auf `PLAYERS_URL`, mit den optionalen
Headern aus `PLAYERS_HEADERS` (z. B. ein Bearer-Zugangswert), beim Laden und danach
alle `PLAYERS_POLL_MS` Millisekunden erneut.

### Antwort

Siehe das JSON-Beispiel oben. Die Felder im Einzelnen:

| Feld        | Typ              | Bedeutung |
|-------------|------------------|-----------|
| `id`        | String           | Stabile, eindeutige Kennung für den Spieler. Nimm, was dein eigener Server hat (eine DB-ID, ein gehashter Name, ...). **Niemals eine Discord-ID oder eine andere ID eines Drittanbieters** — siehe Datenschutz-Hinweis unten. |
| `name`      | String           | Anzeigename auf der Karte. |
| `online`    | Bool             | Ob der Spieler gerade im Spiel/verbunden ist. |
| `last_seen` | ISO-8601-String  | Zeitpunkt der letzten bekannten Positionsmeldung. Wird genutzt, um alte Positionen auszugrauen und "vor 12 Min" anzuzeigen. |
| `code`      | String           | Der rohe Ortscode aus dem Spiel, wie er im `Game.log` des Spielers steht (z. B. `RR_HUR_Lorville`, `RR_S1_ARC_L1`, `RR_MIC_NB_Outpost_Kudre_Ore`). Die Karte löst daraus eine 3D-Position auf: erst exakter Treffer, dann bekannte Kürzel, dann unscharfer Wortstück-Abgleich gegen System-/Planeten-/Monde-/Stationsnamen. Ohne Log-Auswertung reichen auch nur `location`/`system`, dann rät die Karte anhand des Namens. |
| `location`  | String           | Lesbarer Ortsname, als Rückfalloption und zur Anzeige. |
| `system`    | String           | Sternsystem (`Stanton`, `Pyro`, `Nyx`, ...). |
| `ship`      | String oder null | Der UEX-Anzeigename des Schiffs (z. B. `Aegis Avenger Titan`), für Datenblatt und 3D-FleetYards-Modell ("Holo"). Leer/`null`, wenn unbekannt. |
| `travel`    | Objekt oder null | Optional: `{ "to_raw": "<code>", "to": "<name>" }` für ein laufendes Quantum-Reiseziel. `null`, wenn nicht erfasst. |

### Gruppen

Landen zwei oder mehr Spieler am selben Ort, zeigt die Karte automatisch
einen Gruppen-Marker statt gestapelter Symbole. Dafür ist kein eigenes Feld
nötig, das ergibt sich allein aus `code`/`location`+`system`.

### Woher `code` kommt

Im Original wurde das serverseitig aus dem `Game.log` jedes Spielers gelesen
(Star Citizen schreibt eine Zeile bei jedem Orts- oder Schiffswechsel). Dieser
Log-Auswertungs-/Bot-Teil ist **nicht** Teil dieses Projekts, weil er davon
abhängt, wie jede Community ihre Spielclients betreibt. Du brauchst eine
eigene kleine Bridge (Discord-Bot, Log-Watcher, was auch immer passt), die
"Spieler X ist jetzt an Ort Y" in einen Eintrag im obigen JSON verwandelt und
unter `PLAYERS_URL` bereitstellt. `players.example.json` ist eine statische
Datei zum Ausprobieren, oder ein Startpunkt für einen kleinen HTTP-Endpunkt
mit derselben Form.

### Datenschutz

Trag keine echten Namen, Discord-IDs oder andere personenbezogenen Daten in
`id`/`name` ein, außer deine eigene Community hat dem ausdrücklich zugestimmt.
`id` muss nur stabil und eindeutig sein, sie wird nirgends angezeigt.
