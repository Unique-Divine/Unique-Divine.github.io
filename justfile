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

# Build TypeScript and then run vuepress build
build:
  bun run astro build

alias b := build

preview:
  bun run astro preview

fmt: 
  bun run prettier -w .

lint:
  bun run lint:eslint
