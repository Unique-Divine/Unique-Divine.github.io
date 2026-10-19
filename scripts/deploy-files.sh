#!/usr/bin/env bash
# Deploy the read-only file service independently of the Astro site.
set -Eeuo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=scripts/cloud-config.sh
source "$script_dir/cloud-config.sh"
gcloud run deploy "$files_service" --source "$script_dir/../services/files" \
  --project "$cloud_project" --account "$cloud_account" --region "$cloud_region" \
  --service-account "$files_account" --set-env-vars "FILES_BUCKET=$files_bucket,FILES_DIRECT_ORIGIN=https://personal-files-xfriauvptq-uc.a.run.app" \
  --build-service-account "projects/$cloud_project/serviceAccounts/personal-files-build@$cloud_project.iam.gserviceaccount.com" \
  --allow-unauthenticated --min-instances 0 --max-instances 3 --memory 512Mi \
  --cpu 1 --concurrency 40 --timeout 300 --quiet
