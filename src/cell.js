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
        result: null,
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

})();
