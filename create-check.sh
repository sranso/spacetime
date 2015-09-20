#!/bin/bash

creates="Cell:13 Transformation:6 Operation:5"

for c in $creates; do
    create="$(echo $c | cut -d: -f1)"
    create_properties="$(echo $c | cut -d: -f2)"
    begin_string="BEGIN *( *$create *)"
    end_string="END *( *$create *)"

    create_begin=$[$(git grep -i "$begin_string" | wc -l) + 0]
    create_end=$(git grep -i -A $[$create_properties + 1] "$begin_string" | grep -i "$end_string" | wc -l)
    create_end_early=$[$(git grep -i -A $create_properties "$begin_string" | grep -i "$end_string" | wc -l) + 0]
    create_end_exact=$[$create_end - $create_end_early]
    create_dont_end=$[$create_begin - $create_end]
    create_errors=$[$create_begin - $create_end_exact]

    if [[ $create_errors -eq 0 ]]; then
        echo "$create create ok!"
    else
        echo "$create create errors: $create_dont_end end late and $create_end_early end early (out of $create_begin)."
    fi
done
