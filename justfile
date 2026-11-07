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
  bun install --cwd services/files

alias i := install

# Build and compile the app
build:
  bun run astro build

alias b := build

# Run every test. Tests that read dist/ skip until `just b` has run.
test:
  bun test

alias t := test

# Type-check the site, scripts, and file service with Bun's checker.
# tsconfig.check.json stands apart from tsconfig.json because Astro 4
# tooling wants baseUrl, which Bun's TypeScript 7 checker rejects.
# tsconfig.test.ts keeps the two configs' aliases in step.
# Not checked: .astro files (need astro check) and the bodies of .mjs/.js
# helpers such as src/utils/sitemap-build.mjs (no checkJs yet).
typecheck:
  bun run typecheck

alias tc := typecheck

preview:
  bun run astro preview

fmt: 
  bun run prettier -w .

lint:
  bun run lint:eslint

# List tag spellings, display names, article counts, and normalization collisions.
tags:
  bun scripts/tags.ts

# Test sitemap publication rules, tag inventories, and generated output validation.
sitemap-test: build
  bun test src/utils/sitemap src/utils/tags

# Refresh the block-latency article assets from the saved boku profiling directory.
research-import profiling:
    python3 scripts/import-block-latency.py {{quote(profiling)}}

# Verify the block-latency accounting, section titles, and imported asset hashes.
research-test:
    bun test src/components/research

# Verify contents links against Astro-generated Markdown IDs.
contents-test:
    bun test src/utils/article-contents src/utils/post-routes

# Preview the article alongside the current website work without deploying.
research-preview:
    bun run astro dev --host 127.0.0.1 --port 4323

# Refresh the public skills snapshot from a local jiyuu checkout.
skills-import source:
    bun scripts/import-skills.ts {{quote(source)}}

# Verify skill import, route mapping, and snapshot integrity.
skills-test:
    bun test scripts/import-skills scripts/skill-covers src/utils/featured-skills

# Generate skill cover PNGs and a local contact sheet from the shared template.
covers-generate:
    bun scripts/skill-covers.mjs

# Verify cover freshness, dimensions, and checksums without launching a browser.
covers-check:
    bun scripts/skill-covers.mjs --check

# View the generated cover contact sheet locally.
covers-preview:
    python3 -m http.server 4334 --bind 127.0.0.1 --directory public/covers/skills
