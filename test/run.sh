#!/bin/bash
node test/run.js || exit 1
exec git diff --exit-code -- test
