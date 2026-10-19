workspaces := ""

# Displays available recipes when running `just` or `just list`.
[private]
list:
  #!/usr/bin/env bash
  just --list

# Run the dev server
dev *args:
  #!/usr/bin/env bash
  run_cmd() {
    echo "$@" 
    "$@"
  }

  dev() {
    run_cmd bun run astro dev "$@"
  }

  if [ -z "{{args}}" ]; then
    dev
  else 
    dev "{{args}}"
  fi

# Build and publish the website to Firebase Hosting.
deploy:
  bash scripts/publish.sh

# Deploy the GCS file-serving app without rebuilding the website.
deploy-files:
  bash scripts/deploy-files.sh

# Test HTTP file serving with real local files and validate TypeScript.
files-test:
  cd services/files && bun install --frozen-lockfile && bun run build && bun test src

# Provision the file bucket and service identities without changing DNS.
files-setup:
  bash scripts/setup-files.sh

# Add Firebase to the existing project and create the Hosting site.
hosting-setup:
  bash scripts/setup-hosting.sh

# Prepare custom-domain verification and certificate instructions without DNS writes.
hosting-domains:
  bash scripts/prepare-domains.sh

# Populate the personal Cloud DNS zone without changing registrar delegation.
hosting-dns:
  python3 scripts/configure-hosting-dns.py

# Refresh verification TXT records while preserving current website routing.
hosting-dns-verify:
  python3 scripts/configure-hosting-dns.py --verification-only

# Switch website DNS after Firebase ownership, certificates, and actual TLS pass.
hosting-cutover:
  python3 scripts/cutover-hosting-dns.py

# Upload temporary fixtures and verify deployed HTTP serving and recovery.
files-smoke origin image:
  python3 scripts/files-smoke.py {{quote(origin)}} {{quote(image)}}

# Install dependencies
install: 
  bun install

alias i := install

# Build and compile the app
build:
  bun run astro build

alias b := build

preview:
  bun run astro preview

fmt: 
  bun run prettier -w .

lint:
  bun run lint:eslint

# Refresh the block-latency article assets from the saved boku profiling directory.
research-import profiling:
    python3 scripts/import-block-latency.py {{quote(profiling)}}

# Verify the block-latency accounting, section titles, and imported asset hashes.
research-test:
    bun test tests/research

# Verify contents links against Astro-generated Markdown IDs.
contents-test:
    bun test tests/blog

# Preview the article alongside the current website work without deploying.
research-preview:
    bun run astro dev --host 127.0.0.1 --port 4323
