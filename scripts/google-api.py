#!/usr/bin/env python3
"""Call the Firebase management APIs with the personal gcloud identity."""
import json
import subprocess
import sys
import urllib.error
import urllib.request

method, host, path = sys.argv[1:4]
if host not in {"firebase.googleapis.com", "firebasehosting.googleapis.com"}:
    raise SystemExit("Unsupported API host")
token = subprocess.check_output([
    "gcloud", "auth", "print-access-token", "--account=realuniquedivine@gmail.com"
], text=True).strip()
body = sys.argv[4].encode() if len(sys.argv) > 4 else None
request = urllib.request.Request(
    "https://" + host + path, data=body, method=method,
    headers={"Authorization": "Bearer " + token, "Content-Type": "application/json",
             "X-Goog-User-Project": "exalted-justice-359714"},
)
try:
    with urllib.request.urlopen(request, timeout=60) as response:
        print(json.dumps(json.load(response), indent=2))
except urllib.error.HTTPError as error:
    print(error.read().decode(), file=sys.stderr)
    raise SystemExit(1)
