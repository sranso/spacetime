#!/bin/bash
node test/run.js
exec git diff --exit-code -- test
