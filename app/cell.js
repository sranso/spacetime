'use strict';
global.Cell = {};
(function () {

Cell.args    = 0;
Cell.columns = 1;
// Cell.grid    = ?
Cell.text    = 2;

Cell.Arg = {};
Cell.Arg.parent = 0;
Cell.Arg.x      = 1;
Cell.Arg.y      = 2;

Cell.zero = 0;
Cell.empty = 0;
Cell.Arg.zero = 0;

Cell.Arg.noParent = -1;

Cell.initialize = function () {
    Cell.Arg.zero = $.nextIndex++;
    $[Cell.Arg.zero] = createZero({
        parent: Constants.$positive[0],
        x:      Constants.$positive[0],
        y:      Constants.$positive[0],
    });

    var zero = createZero({
        args:    ArrayTree.$zeros[0],
        columns: ArrayTree.$zeros[0],
        text:    $[Constants.emptyString],
    });
    Cell.zero = $.nextIndex++;
    $[Cell.zero] = zero;

    var column = push(ArrayTree.$zeros[0], $[Cell.zero]);
    var columns = push(ArrayTree.$zeros[0], column);
    Cell.empty = $.nextIndex++;
    $[Cell.empty] = set(zero, Cell.columns, columns);
};

})();
