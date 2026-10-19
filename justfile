workspaces := ""

# Displays available recipes by running `just -l`.
setup:
  #!/usr/bin/env bash
  just -l

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

deploy:
  bash scripts/publish.sh

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

# Preview the article alongside the current website work without deploying.
research-preview:
    bun run astro dev --host 127.0.0.1 --port 4323
