'use strict';
var Cell = {};
(function () {

Cell.create = function () {
    return {
        grid: Grid.none,
        group: Group.none,
        transformation: Transformation.none,
        operation: Operation.none,
        args: [],     // [c1, r1, c2, r2, ...]
        text: '',

        gridTick: 0,
        //conditional: false,
        //disabled: false,
        detached: false,
        apply: false,
        base: false,
        result: null,
    };
};

Cell.clone = function (original) {
    var cell = Cell.create();
    cell.grid = original.grid;
    cell.group = original.group;
    cell.transformation = original.transformation;
    cell.operation = original.operation;
    cell.args = original.args;
    cell.text = original.text;
    //cell.gridTick = original.gridTick;
    cell.detached = original.detached;
    cell.apply = original.apply;
    cell.base = original.base;
    // cell.result = original.result;
    return cell;
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
