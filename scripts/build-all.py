#!/usr/bin/env python3
# Baut alle Karten-Daten fuer die Live Map in einem Rutsch: klont/aktualisiert scunpacked-data,
# baut die Systeme, Missionen, Blueprints und den FleetYards-Spiegel, alles nach ./data/.
#
# Builds all Live Map data in one go: clones/updates scunpacked-data, builds the systems, missions,
# blueprints and the FleetYards mirror, everything into ./data/.
#
# Aufruf/usage: python3 scripts/build-all.py [--with-de]
#   --with-de   auch die optionale deutsche Community-Uebersetzung laden (siehe CREDITS.md)
#               also fetch the optional German community translation (see CREDITS.md)
#
# Netzzugriff auf GitHub, api.uexcorp.space und fleetyards.net wird gebraucht.
# Needs network access to GitHub, api.uexcorp.space and fleetyards.net.
import subprocess
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
import _common as C  # noqa: E402

ROOT = SCRIPTS.parent


def run(script, *args):
    print("\n=== %s %s ===" % (script, " ".join(args)), flush=True)
    cmd = [sys.executable, str(SCRIPTS / script), *args]
    r = subprocess.run(cmd, cwd=str(ROOT))
    if r.returncode != 0:
        print("WARNUNG/WARNING: %s beendete mit Code %d (alter Datenstand bleibt ggf. liegen / "
              "previous data may have been kept)." % (script, r.returncode), file=sys.stderr)
    return r.returncode


def ensure_scu_repo():
    """scunpacked-data klonen/aktualisieren (contracts + Repo-Root, cone-Sparse-Checkout).
    Clone/update scunpacked-data (contracts + repo root, cone sparse checkout)."""
    repo = C.SCU_REPO_DIR
    if not (repo / ".git").is_dir():
        repo.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "-q", "--depth", "1", "--filter=blob:none", "--sparse",
                         C.SCU_REPO_URL, str(repo)], check=True, timeout=900)
        subprocess.run(["git", "-C", str(repo), "sparse-checkout", "set", "contracts"], check=True)
    else:
        subprocess.run(["git", "-C", str(repo), "fetch", "-q", "--depth", "1", "origin", "master"], check=True, timeout=900)
        subprocess.run(["git", "-C", str(repo), "reset", "-q", "--hard", "origin/master"], check=True)


def main():
    C.ensure_dirs()
    extra = ["--with-de"] if C.WITH_DE else []
    print("Live Map Daten-Build / data build startet.",
          "(mit deutscher Übersetzung / with German translation)" if C.WITH_DE
          else "(nur Englisch, --with-de für Deutsch / English only, --with-de for German)")

    run("systems-build.py", *extra)          # data/sys-stanton.json, sys-pyro.json, sys-nyx.json, galaxy.json
    ensure_scu_repo()                         # fuer missions-build.py + blueprints-build.py
    run("missions-build.py", *extra)          # data/missions.json (braucht sys-*.json + geklontes Repo)
    run("blueprints-build.py")                # data/blueprints.json (braucht geklontes Repo)
    run("fy-mirror.py")                       # data/fleet.json (FleetYards live API)
    run("items-build.py")                     # data/items.json, data/vehicles.json (Such-Katalog, UEX live API)

    print("\n=== Zusammenfassung / summary: ./data/ ===")
    if C.DATA_DIR.is_dir():
        files = sorted(C.DATA_DIR.glob("*.json"))
        if files:
            for p in files:
                print("  %-20s %10d bytes" % (p.name, p.stat().st_size))
        else:
            print("  (noch keine Dateien / no files yet)")
    else:
        print("  (data/ existiert nicht / data/ does not exist)")


if __name__ == "__main__":
    main()
