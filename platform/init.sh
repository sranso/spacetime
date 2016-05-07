#!/bin/bash

if [ ! -d workspace ]; then
    mkdir workspace
    mkdir releases
    mkdir releases/all
    mkdir releases/current
    git clone git@github.com:getspacetime/spacetime.git workspace/spacetime
fi
