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
cd ..
../build.js
cd ..

branch=$(echo "$tag" | cut -d '.' -f 1)
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ" | sed 's/:/_/g')
release="$timestamp--$tag"

mkdir -p "releases/all/$branch"
cp -R workspace/dist "releases/all/$branch/$release"

cd releases/current
ln -sf "../all/$branch/$release" "$branch"
