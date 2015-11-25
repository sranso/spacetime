#!/bin/bash

set -e

tag=$1

if [ -z "$tag" ]; then
    echo 'Usage: ./deploy.sh tag'
    exit 1
fi

./init.sh

cd workspace

cd spacetime
git fetch --tags
git checkout "$tag"
if git symbolic-ref HEAD 1>/dev/null 2>&1; then
    git pull
fi
cd ..
../build.js
cd ..

branch=$(echo "$tag" | sed 's/[^a-z0-9].*//')
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ" | sed 's/:/_/g')
release="$timestamp--$tag"

mkdir -p "releases/all/$branch"
cp -R workspace/dist "releases/all/$branch/$release"

cd releases/current
ln -sfT "../all/$branch/$release" "$branch"
