'use strict';
global.Cell = {};
(function () {

Cell.args    = 0;
Cell.columns = 1;
Cell.input   = 2
Cell.text    = 3;

Cell.Arg = {};
Cell.Arg.parent = 0;
Cell.Arg.cDiff = 1;
Cell.Arg.rDiff = 2;

Cell.zero = 0;
Cell.Arg.zero = 0;

Cell.initialize = function () {
    Cell.Arg.zero = $.nextIndex++;
    $[Cell.Arg.zero] = createZero({
        parent: Constants.$positive[0],
        cDiff:  Constants.$positive[0],
        rDiff:  Constants.$positive[0],
    });

    Cell.zero = $.nextIndex++;
    $[Cell.zero] = createZero({
        args:    ArrayTree.$zeros[0],
        input:   $[Input.zero],
        columns: ArrayTree.$zeros[0],
        text:    $[Constants.emptyString],
    });
};

})();
