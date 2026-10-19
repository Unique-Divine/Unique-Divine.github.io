#!/usr/bin/env bash
# Provision the personal file bucket and runtime identity without changing DNS.
set -Eeuo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=scripts/cloud-config.sh
source "$script_dir/cloud-config.sh"
cloud_args=(--project "$cloud_project" --account "$cloud_account")
gcloud services enable firebase.googleapis.com firebasehosting.googleapis.com \
  run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com "${cloud_args[@]}"
if ! gcloud storage buckets describe "gs://$files_bucket" "${cloud_args[@]}" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$files_bucket" --location "$cloud_region" \
    --uniform-bucket-level-access --public-access-prevention "${cloud_args[@]}"
fi
gcloud storage buckets update "gs://$files_bucket" --soft-delete-duration=7d "${cloud_args[@]}"
if ! gcloud iam service-accounts describe "$files_account" "${cloud_args[@]}" >/dev/null 2>&1; then
  gcloud iam service-accounts create personal-files --display-name='Personal file reader' "${cloud_args[@]}"
fi
gcloud storage buckets add-iam-policy-binding "gs://$files_bucket" \
  --member "serviceAccount:$files_account" --role roles/storage.objectViewer "${cloud_args[@]}"
# Source builds use a separate build identity instead of the broad default VM identity.
build_account="personal-files-build@${cloud_project}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$build_account" "${cloud_args[@]}" >/dev/null 2>&1; then
  gcloud iam service-accounts create personal-files-build --display-name='Personal file build' "${cloud_args[@]}"
fi
# IAM can briefly lag behind service-account creation.
for attempt in {1..10}; do
  if gcloud projects add-iam-policy-binding "$cloud_project" --member "serviceAccount:$build_account" \
    --role roles/run.builder --condition=None "${cloud_args[@]}" >/dev/null; then
    break
  fi
  if [[ "$attempt" == 10 ]]; then exit 1; fi
  sleep 2
done
