#!/bin/bash
node $1 quiet || read -n1 -r -p 'Press any key to continue...'
