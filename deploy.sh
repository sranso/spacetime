#!/bin/bash

set -e

tag=$1

if [ -z "$tag" ]; then
    echo 'Usage: ./deploy.sh tag'
    exit 1
fi

if [ ! -d workspace ]; then
    mkdir -p workspace/dist
    mkdir -p releases/current
    git clone git@github.com:jakesandlund/spacetime.git workspace/spacetime
fi

cd workspace/spacetime
git fetch --tags
git checkout "$tag"
./build.sh
cd ../..

rm -r workspace/dist
mkdir workspace/dist

node_modules/.bin/cleancss -o workspace/dist/styles.css workspace/spacetime/dist/styles.css

node_modules/.bin/uglifyjs workspace/spacetime/dist/scripts.js --compress -o workspace/dist/scripts.js

cp workspace/spacetime/dist/index.html workspace/dist/index.html
cp -R workspace/spacetime/dist/vendor workspace/dist/vendor

branch=$(echo "$tag" | cut -d '.' -f 1)
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ" | sed 's/:/_/g')
release="$timestamp--$tag"

mkdir -p "releases/all/$branch"
cp -R workspace/dist "releases/all/$branch/$release"

cd releases/current
ln -sf "../all/$branch/$release" "$branch"
