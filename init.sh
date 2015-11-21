#!/bin/bash

if [ ! -d workspace ]; then
    mkdir -p workspace/dist/vendor
    mkdir -p releases/all
    mkdir releases/current
    git clone git@github.com:jakesandlund/spacetime.git workspace/spacetime
fi
