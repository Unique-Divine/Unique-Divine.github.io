#!/usr/bin/env bash
# Add Firebase and create the Hosting site after browser terms acceptance.
set -Eeuo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=scripts/cloud-config.sh
source "$script_dir/cloud-config.sh"
state_dir="$(mktemp -d)"
trap 'rm -rf -- "$state_dir"' EXIT
firebase projects:list --account "$cloud_account" --non-interactive --json > "$state_dir/projects.json"
if ! python3 - "$state_dir/projects.json" "$cloud_project" <<'PY'
import json,sys
data=json.load(open(sys.argv[1]))
if data.get('status') != 'success': raise SystemExit('Firebase project listing failed')
raise SystemExit(0 if any(p['projectId']==sys.argv[2] for p in data['result']) else 1)
PY
then
  firebase projects:addfirebase "$cloud_project" --account "$cloud_account" --non-interactive
fi
firebase hosting:sites:list --project "$cloud_project" --account "$cloud_account" \
  --non-interactive --json > "$state_dir/sites.json"
if ! python3 - "$state_dir/sites.json" "$hosting_site" <<'PY'
import json,sys
data=json.load(open(sys.argv[1]))
if data.get('status') != 'success': raise SystemExit('Firebase site listing failed')
raise SystemExit(0 if any(s['name'].endswith('/'+sys.argv[2]) for s in data['result']['sites']) else 1)
PY
then
  firebase hosting:sites:create "$hosting_site" --project "$cloud_project" \
    --account "$cloud_account" --non-interactive
fi
