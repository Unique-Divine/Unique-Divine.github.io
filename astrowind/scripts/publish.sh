#!/usr/bin/env bash
set -eo pipefail

OUT_DOMAIN="uniquedivine.blog"
BUILD_PATH="./dist"
# GitHub auth with ssh 
REPO_URL="git@github.com:Unique-Divine/Unique-Divine.github.io.git"
# GitHub auth with https (DEPRECATED) 
# REPO_URL="https://github.com/Unique-Divine/Unique-Divine.github.io"

# which_ok: Check if the given binary is in the $PATH.
# Returns code 0 on success and code 1 if the command fails.
which_ok() {
  if which "$1" >/dev/null 2>&1; then
    return 0
  else
    echo "ERROR: $1 is not present in \$PATH" >&2
    return 1
  fi
}

build() {
  which_ok yarn
  which_ok just
  which_ok bun

  bun install 
  just b # build
  # yarn --check-files
  # yarn build
}

create_deployment_records() {
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
  create_deployment_records
  push_to_gh
}

main
