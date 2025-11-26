#!/bin/bash
# copy-assets.sh
# Copy static assets between .vuepress/public/stat and ./stat
local_stat="stat"
public_stat=".vuepress/public/stat"
cp -r $local_stat/* $public_stat	
cp -r $public_stat/* $local_stat	
