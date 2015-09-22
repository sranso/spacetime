'use strict';
var Cell = {};
(function () {

Cell.create = function () {
    return {
        grid: Grid.none,
        group: Group.none,
        transformation: Transformation.none,
        operation: Operation.none,
        args: Cell.noArgs,     // [c1, r1, c2, r2, ...]
        text: '',
        gridTick: 0,
        detached: false,
        apply: false,
        base: false,

        // The following are never included in 'clone' properties:
        result: null,
        resultTick: 0,
    };
};

Cell.none = Cell.create();

var autoArgs = function (numArgs) {
    return args;
};

var setupAutoArgs = function () {
    var autoArgs = [];
    for (var numArgs = 0; numArgs < 20; numArgs++) {
        var args = [];
        for (var i = 0; i < numArgs; i++) {
            args[2 * i] = 0;
            args[2 * i + 1] = i - numArgs;
        }
        autoArgs[2 * numArgs] = args;
        autoArgs[2 * numArgs + 1] = [];
    }
    return autoArgs;
};

Cell.autoArgs = setupAutoArgs();

Cell.noArgs = Cell.autoArgs[0];

Cell.pointToArg = function (cell, c, r, argIndex, argC, argR) {
    if (argIndex >= cell.args.length) {
        return;
    }
    var diffC = argC - c;
    var diffR = argR - r;
    if (diffC > 0 || (diffC === 0 && diffR >= 0)) {
        return;
    }
    cell.args[argIndex] = diffC;
    cell.args[argIndex + 1] = diffR;
};

Cell.argIndex = function (cell, c, r, argC, argR) {
    var args = cell.args;
    for (var i = 0; i < args.length; i += 2) {
        if (argC === c + args[i] && argR === r + args[i + 1]) {
            return i;
        }
    }
    return -1;
};

})();
