'use strict';
var Cell = {};
(function () {

Cell.create = function () {
    return {
        grid: Grid.none,
        args: Cell.noArgs,     // [c1, r1, c2, r2, ...]
        transformation: Transformation.none,
        operation: Operation.none,

        group: Group.none,
        text: '',

        gridTick: 0,
        detached: false,
        base: false,

        result: null,
        resultTick: 0,
    };
};

Cell.none = Cell.create();

Cell.clonePostTransform = function (original) {
    var cell = Cell.create();
    cell.grid = original.grid;
    // cell.args = Cell.noArgs;
    cell.transformation = original.transformation;
    cell.operation = original.transformation;

    cell.group = original.group;
    cell.text = original.text;

    cell.gridTick = original.gridTick;
    // cell.detached = false;
    cell.base = original.base;

    return cell;
};

Cell.cloneForSimilar = function (original) {
    var cell = Cell.create();
    // cell.grid = Grid.none;
    // cell.args = Cell.noArgs;
    cell.transformation = original.transformation;
    // cell.operation = Operation.none;

    cell.group = original.group;
    cell.text = original.text;

    // cell.gridTick = 0;
    // cell.detached = false;
    // cell.base = false;

    return cell;
};

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

Cell.empty = (function () {
    var cell = Cell.create();
    cell.transformation = Transformation.empty;
    cell.args = Cell.autoArgs[0];
    cell.text = '';

    return cell;
})();

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

Cell.deepCopy = function (original) {
    var cell = Cell.create();
    // cell.grid = Grid.none;
    cell.args = original.args.slice();
    cell.transformation = original.transformation;
    cell.operation = original.operation;

    cell.group = original.group;
    cell.text = original.text;

    cell.gridTick = original.gridTick;
    cell.detached = original.detached;
    cell.base = original.base;

    if (original.grid === Grid.none) {
        return cell;
    }

    cell.grid = Grid.create();
    cell.grid.layer = original.grid.layer;
    cell.grid.numFrames = original.grid.numFrames;

    cell.grid.areas = original.grid.areas.map(function (original) {
        var area = Area.create();
        area.group = original.group;
        area.coords = original.coords.slice();
        area.text = original.text;

        return area;
    });

    for (var c = 0; c < original.grid.cells.length; c++) {
        var column = [];
        for (var r = 0; r < original.grid.cells[0].length; r++) {
            column[r] = Cell.deepCopy(original.grid.cells[c][r]);
        }
        cell.grid.cells.push(column);
    }

    return cell;
};

})();
