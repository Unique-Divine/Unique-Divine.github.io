#!/usr/bin/env bash

# scripts/publish.sh: Deploys the built site to GitHub Pages.
# 
# Summary:
#   Builds the project, adds GitHub Pages metadata (CNAME + .nojekyll),
#   and force-pushes the contents of $BUILD_PATH to the `gh-pages` branch
#   of $REPO_URL.
#
# Requirements:
#   bun, just, git
#
# Usage:
#    Run either of these from the repo root:
#       just deploy
#       bash scripts/deploy.sh  # This is fine too.

set -eo pipefail

OUT_DOMAIN="uniquedivine.com"
BUILD_PATH="./dist"
# GitHub auth with ssh 
REPO_URL="git@github.com:Unique-Divine/Unique-Divine.github.io.git"
# GitHub auth with https (DEPRECATED) 
# REPO_URL="https://github.com/Unique-Divine/Unique-Divine.github.io"


# which_ok: Check if the given binary is in the $PATH or if it is something
# callable in a bash program.
# Returns code 0 on success and code 1 if the command fails.
which_ok() {

  # Runnable binary on $PATH? Ex: "jq", "bun", etc.
  # Alias? Ex: "ls" (I have it aliased to exa).
  # Built-in? Ex: "echo", "cd"
  if which "$1" >/dev/null 2>&1; then
    return 0
  fi

  # Function? An example for this is "nvm", which is a pure bash function.
  if type -a "$1" >/dev/null; then
    return 0
  fi

  echo "ERROR: $1 is not present in \$PATH" >&2
  return 1
}

# build: Build and compile the app.
build() {
  which_ok just
  which_ok bun
  which_ok just

  bun install 
  just b # build
}

# create_gh_pages_records: Creates CNAME and .nojekyll files.
# 1. Creates a CNAME DNS record to tell the internet that
#   the custom domain contained within the record is an alias for GitHub pages'
#   servers. Pair this with a DNS-level CNAME that maps the custom to domain to the
#   URL for you GitHub page, which is "Unique-Divine.github.io" in my case.
# 2. GitHub Pages runs a preprocesser by default for Jekyll. This can override
#   certain directories and styling according to expectations of Jekyll. Including
#   a ".nojekyll" file prevents this, enabling full customizability over styles.
create_gh_pages_records() {
  if [ ! -d $BUILD_PATH ]; then 
    echo "no build directory exists at path: $BUILD_PATH"
    echo "pwd: $(pwd)"
    exit 1
  fi 
  # CNAME for specifying the domain
  echo $OUT_DOMAIN > $BUILD_PATH/CNAME
  # Create nojekyll for github pages
  touch $BUILD_PATH/.nojekyll 
}

# push_to_gh: pushes a production deployment
push_to_gh() {
  which_ok git

  local root_dir
  root_dir=$(pwd)
  cd $BUILD_PATH
  git init 
  git add . 
  git commit -am "deploy"
  git checkout -b gh-pages
  git push -u $REPO_URL gh-pages --force || echo "git push unsuccessful"
  rm -rf .git 
  cd "$root_dir"
}

main() {
  build
  create_gh_pages_records
  push_to_gh
}

main
