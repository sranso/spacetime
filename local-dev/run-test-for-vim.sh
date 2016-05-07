#!/bin/bash
node $1 quiet && git --no-pager diff $1 || read -n1 -r -p 'Press any key to continue...'
