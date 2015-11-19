#!/bin/bash

set -e

version_prototype=$1

if [ -z $version_prototype ]; then
    echo 'Usage: ./reserve-version.sh v0xx'
    exit 1
fi

git pull --rebase

version=$(./versions.js next $version_prototype)
reserveDate=$(./utc.sh)
reservedBy=$(git config user.name)

sed -i '' "/EDIT ABOVE THIS LINE/i \\
'$version', \\{\\
\    reserveDate: '$reserveDate',\\
\    reservedBy: '$reservedBy',\\
\\}\\
\\
" versions.js

git push
echo "Reserved $version"
