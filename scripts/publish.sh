#!/usr/bin/env bash
# Build and deploy the Astro site to Firebase Hosting.
set -Eeuo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=scripts/cloud-config.sh
source "$script_dir/cloud-config.sh"
cd "$script_dir/.."
command -v firebase >/dev/null
just build
firebase deploy --only hosting --project "$cloud_project" \
  --account "$cloud_account" --non-interactive
printf 'Deployed: https://%s.web.app\n' "$hosting_site"
