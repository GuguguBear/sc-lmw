/* Live Map configuration / Konfiguration der Live-Karte.
 *
 * EN: Point PLAYERS_URL at your own backend to show real players on the map.
 *     The default (./players.example.json) ships a handful of fictional demo
 *     players so the map works out of the box, with no server required.
 * DE: PLAYERS_URL zeigt auf deinen eigenen Server, wenn du echte Spieler auf
 *     der Karte zeigen willst. Der Standardwert (./players.example.json)
 *     liefert ein paar erfundene Demo-Spieler, damit die Karte ohne eigenen
 *     Server sofort läuft.
 *
 * See / siehe: docs/PLAYERS_API.md
 */
window.LIVEMAP_CONFIG = {
  // URL (relative or absolute) that returns the players JSON described in docs/PLAYERS_API.md.
  PLAYERS_URL: './players.example.json',

  // Optional extra HTTP headers for the PLAYERS_URL request, e.g. an API credential.
  // Example: { "Authorization": "Bearer <your-secret-value>" }
  PLAYERS_HEADERS: {},

  // How often (ms) the map re-fetches PLAYERS_URL. Set to 0 to disable polling.
  PLAYERS_POLL_MS: 30000,

  // UEX Corp API base (public, no key required for read-only price data).
  // https://uexcorp.space/api/
  UEX_API_BASE: 'https://api.uexcorp.space/2.0',

  // FleetYards.net API base, used at runtime for 3D ship models ("Holo").
  // https://fleetyards.net/api/v1 -- please credit FleetYards, see CREDITS.md.
  FLEETYARDS_API_BASE: 'https://fleetyards.net/api/v1',

  // Default language for in-game text (item/location names): 'de' or 'en'. This is the OLD
  // toggle (the small "DE"/"EN" button in the map, ST_LANG in js/starmap.js): mission types,
  // amenity names, the German INI description. It does NOT affect the interface itself.
  DEFAULT_LANG: 'en',

  // Interface language ('auto' | 'de' | 'en', default 'auto' = browser language: de* -> German,
  // else English). This is the NEW, SEPARATE toggle for the UI chrome itself (buttons, panels,
  // search, legend, error messages, number/date format) -- see js/i18n.js. It never touches
  // DEFAULT_LANG above, and vice versa: the two buttons in the map can independently be on
  // German or English. Can also be set per embed via the sc-lmw.js script tag's data-lang
  // attribute, or passed directly as mount(el,{lang:'de'}). The visitor's own choice (the
  // small language switch next to the map) is remembered in localStorage and wins over this.
  LANG: 'auto'
};
