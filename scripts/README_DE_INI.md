# German translation source / Deutsche Übersetzungsquelle

The build scripts can optionally fetch German in-game text and merge it into
the map data (location descriptions, system descriptions). This is **off by
default**; enable it with `--with-de` (or `LIVEMAP_DE=1`).

- Source: https://github.com/rjcncpt/StarCitizen-Deutsch-INI (community
  translation project for Star Citizen, maintained independently of Cloud
  Imperium Games).
- File fetched: `live/global.ini` from that repository's `main` branch.
- License: CC BY-NC-SA 4.0 (Creative Commons Attribution-NonCommercial-
  ShareAlike 4.0). This means: attribution required, non-commercial use only,
  and any redistribution of the translated text must carry the same license.
- Cached at: `.cache/StarCitizen-Deutsch-INI/global.ini` (downloaded once,
  reused on subsequent builds; delete the file to force a re-download).

Because of the NC (non-commercial) clause, this project does **not** ship the
translated strings in the repository itself, and treats fetching them as an
explicit opt-in build step, not a default. If you enable `--with-de` and
publish the resulting `data/*.json` files, keep the attribution in your own
CREDITS/about page, matching the entry already prepared in this project's
`CREDITS.md`:

> German translation strings (optional): StarCitizen-Deutsch-INI by rjcncpt
> and contributors, https://github.com/rjcncpt/StarCitizen-Deutsch-INI,
> licensed CC BY-NC-SA 4.0.
