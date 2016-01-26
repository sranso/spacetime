#!/bin/bash
node test/run.js
exec git diff -- test
