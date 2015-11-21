#!/bin/bash

rm -rf dist
mkdir dist
mkdir dist/vendor

cd spacetime

for html in $(find . -type f -name '*html'); do
    sed -e '1,/STYLES START/d' -e '/STYLES END/,$d' $html |
        sed 's/.*href="\(.*\)".*/\1/' | xargs cat |
        ../../node_modules/.bin/cleancss -o ../styles.css
    sha=$(sha1sum ../styles.css | cut -d ' ' -f 1)
    mv ../styles.css "../dist/styles-$sha.css"

    cd vendor
    vendors=$(ls)
    cd ..

    for vendor in "$vendors"; do
        ../../node_modules/.bin/uglifyjs "vendor/$vendor" -o "../$vendor"
        sha=$(sha1sum "../$vendor" | cut -d ' ' -f 1)
        name="$(echo "$vendor" | sed 's/\.js//')-${sha}.js"
        mv "../$vendor" "../dist/vendor/$name"
    sed -e '1,/VENDOR START/d' -e '/VENDOR END/,$d' index.html | sed 's/.*src="\(.*\)".*/cp \1 ../dist/vendor/\/\1/' | sh
    sed -e '1,/VENDOR START/d' -e '/VENDOR END/,$d' index.html | sed 's/.*src=".\/vendor\/\(.*\)".*/\1/' > dist/vendor/index

    sed -e '1,/SCRIPTS START/d' -e '/SCRIPTS END/,$d' index.html | sed 's/.*src="\(.*\)".*/\1/' | xargs cat > dist/scripts.js

    sed '/STYLES START/,/STYLES END/c\
    <link rel="stylesheet" type="text/css" href="./styles.css">
    ' index.html |
        sed '/SCRIPTS START/,/SCRIPTS END/c\
    <script src="./scripts.js"></script>
    ' | sed -e '/VENDOR START/d' -e '/VENDOR END/d' > dist/index.html
done
