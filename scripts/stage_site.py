"""Copy the public site into site/ for the Worker asset upload.

The block list matches server/room_server.py. Map data under data/ is included
when it exists on this machine. Worker source, dependencies, and the staged
copy itself are not published.
"""

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "site"
BLOCK_DIR = {
    "language", ".cache", ".git", ".test", "__pycache__", "server", "companion",
    "worker", "node_modules", "site", ".wrangler", ".github",
}
BLOCK_EXT = {".sqlite", ".ini", ".pyc", ".spec", ".map"}
BLOCK_NAME = {"config.json", "package.json", "package-lock.json", "wrangler.jsonc"}


def allowed(path):
    rel = path.relative_to(ROOT)
    if any(part.startswith(".") or part.lower() in BLOCK_DIR for part in rel.parts):
        return False
    if path.suffix.lower() in BLOCK_EXT or path.name.lower() in BLOCK_NAME:
        return False
    return path.is_file()


def main():
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir()
    count = 0
    for path in ROOT.rglob("*"):
        if not allowed(path):
            continue
        target = DEST / path.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        count += 1
    headers = DEST / "_headers"
    headers.write_text("/*\n  Cache-Control: no-cache\n", encoding="utf-8")
    print("staged %d files" % count)


if __name__ == "__main__":
    main()
