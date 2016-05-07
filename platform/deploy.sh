#!/bin/bash

set -e

tag=$1

if [ -z "$tag" ]; then
    echo 'Usage: ./deploy.sh [root] tag'
    exit 1
fi

if [ "$tag" = root ]; then
    tag=$2
    root=true
else
    root=false
fi
branch=$(echo "$tag" | sed 's/[^a-z0-9].*//')
build_branch=$branch
if [ $root = true ]; then
    build_branch=root
fi


./init.sh

cd workspace
rm -rf dist

cd spacetime
git fetch --tags
git checkout "$tag"
if git symbolic-ref HEAD 1>/dev/null 2>&1; then
    git checkout "origin/$tag"
fi
cd ../..
./build.js $build_branch

timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ" | sed 's/:/_/g')
release="$timestamp--$tag"

mkdir -p "releases/all/$branch"
mv workspace/dist "releases/all/$branch/$release"

cd releases/current
ln -sfT "../all/$branch/$release" "$branch"

if [ $root = true ]; then
    ln -sfT "../all/$branch/$release" root
fi
