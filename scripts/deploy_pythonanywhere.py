"""Copy this git tree onto the PythonAnywhere site and reload it.

GitHub Actions runs this on every push to master. The token stays in the
repository secret PA_API_TOKEN. Create it on the PythonAnywhere Account
page, under API token. The live database and the built map data are not
in git, so this does not touch them.
"""

import json
import os
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

USER = "GuguguBear"
HOST = "www.pythonanywhere.com"
DOMAIN = "gugugubear.pythonanywhere.com"
REMOTE_ROOT = "/home/GuguguBear/sc-lmw"
ROOT = Path(__file__).resolve().parents[1]


def tracked_files():
    out = subprocess.check_output(
        ["git", "ls-files", "-z"], cwd=ROOT
    )
    return [p for p in out.decode("utf-8").split("\0") if p]


def request(token, method, url, data=None, headers=None):
    hdrs = {"Authorization": "Token " + token}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            return res.status, res.read()
    except urllib.error.HTTPError as err:
        return err.code, err.read()


def upload(token, rel, attempts=6):
    local = ROOT / rel
    payload = local.read_bytes()
    boundary = "----sc-lmw-deploy"
    name = Path(rel).name.replace('"', "")
    body = b"".join([
        ("--" + boundary + "\r\n").encode(),
        ('Content-Disposition: form-data; name="content"; filename="%s"\r\n' % name).encode(),
        b"Content-Type: application/octet-stream\r\n\r\n",
        payload,
        ("\r\n--" + boundary + "--\r\n").encode(),
    ])
    remote = REMOTE_ROOT + "/" + rel.replace("\\", "/")
    url = "https://%s/api/v0/user/%s/files/path%s" % (
        HOST, USER, urllib.parse.quote(remote)
    )
    headers = {"Content-Type": "multipart/form-data; boundary=" + boundary}
    for attempt in range(attempts):
        status, raw = request(token, "POST", url, body, headers)
        if status in (200, 201):
            print("uploaded %s" % rel)
            return
        if status == 429 and attempt + 1 < attempts:
            time.sleep(20)
            continue
        detail = raw.decode("utf-8", "replace")[:300]
        raise SystemExit("upload failed %s %s %s" % (rel, status, detail))


def reload_site(token):
    url = "https://%s/api/v0/user/%s/webapps/%s/reload/" % (HOST, USER, DOMAIN)
    status, raw = request(token, "POST", url, b"")
    if status != 200:
        detail = raw.decode("utf-8", "replace")[:300]
        raise SystemExit("reload failed %s %s" % (status, detail))
    print("reloaded %s" % DOMAIN)


def main():
    token = os.environ.get("PA_API_TOKEN", "").strip()
    if not token:
        raise SystemExit(
            "PA_API_TOKEN is missing. Add it under GitHub Settings, "
            "Secrets and variables, Actions."
        )
    files = tracked_files()
    if not files:
        raise SystemExit("no tracked files")
    for rel in files:
        upload(token, rel)
    reload_site(token)
    print(json.dumps({"files": len(files), "domain": DOMAIN}))


if __name__ == "__main__":
    main()
