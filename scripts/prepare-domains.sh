#!/usr/bin/env bash
# Prepare domain ownership/certificate instructions without changing DNS.
set -Eeuo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=scripts/cloud-config.sh
source "$script_dir/cloud-config.sh"
parent="/v1beta1/projects/$cloud_project/sites/$hosting_site/customDomains"
state_dir="$(mktemp -d)"
trap 'rm -rf -- "$state_dir"' EXIT
python3 "$script_dir/google-api.py" GET firebasehosting.googleapis.com "$parent" > "$state_dir/domains.json"
for domain in uniquedivine.com www.uniquedivine.com; do
  if ! python3 - "$state_dir/domains.json" "$domain" <<'PY'
import json,sys
data=json.load(open(sys.argv[1]))
raise SystemExit(0 if any(d['name'].endswith('/'+sys.argv[2]) for d in data.get('customDomains',[])) else 1)
PY
  then
    body='{"certPreference":"GROUPED"}'
    if [[ "$domain" == www.* ]]; then
      body='{"certPreference":"GROUPED","redirectTarget":"uniquedivine.com"}'
    fi
    python3 "$script_dir/google-api.py" POST firebasehosting.googleapis.com \
      "$parent?customDomainId=$domain" "$body"
  fi
done
python3 "$script_dir/google-api.py" GET firebasehosting.googleapis.com "$parent"
