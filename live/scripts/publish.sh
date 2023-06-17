#!/usr/bin/env bash
set -eo pipefail

OUT_DOMAIN="uniquedivine.blog"
BUILD_PATH=".vuepress/dist"

build() {
  yarn --check-files
  yarn build
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
  local root_dir=$(pwd)
  cd $BUILD_PATH
  git init 
  git add . 
  git commit -am "deploy"
  git checkout -b gh-pages
  git push -u $REPO_URL gh-pages --force
  rm -rf .git 
  cd $root_dir
}

main() {
  build
  create_deployment_records
  push_to_gh
}

main
