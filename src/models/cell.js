'use strict';
var Cell = {};
(function () {

Cell.create = function () {
    return {
        // Meta-data
        group: Group.none,
        text: '',

        // Pre-transform
        transformation: Transformation.none,
        args: Cell.noArgs,      // [c1, r1, c2, r2, ...]
        detached: false,
        startFrame: 0,  // TODO: these are kinda pre and post. Split apart?
        endFrame: Infinity,     // Infinity == grid.numFrames - 1
        input: [],

        // Post-transform
        grid: Grid.none,
        gridTick: 0,
        dynamicHistory: Cell.noHistory,
        operation: Operation.none,

        // Post-execute
        result: null,
        resultTick: 0,
    };
};

Cell.noHistory = [];

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

Cell.none = Cell.create();

Cell.clonePostTransform = function (original) {
    var cell = Cell.create();
    cell.group = original.group;
    cell.text = original.text;

    cell.transformation = original.transformation;
    // cell.args = Cell.noArgs;
    // cell.detached = false;
    cell.startFrame = original.startFrame;
    cell.endFrame = original.endFrame;
    cell.input = original.input;

    cell.grid = original.grid;
    cell.gridTick = original.gridTick;
    cell.dynamicHistory = original.dynamicHistory;
    cell.operation = original.operation;

    // cell.result = null;
    // cell.resultTick = 0;

    return cell;
};

Cell.cloneForSimilar = function (original) {
    var cell = Cell.create();
    cell.group = original.group;
    cell.text = original.text;

    cell.transformation = original.transformation;
    // cell.args = Cell.noArgs;
    // cell.startFrame = 0;
    // cell.endFrame = Infinity;
    // cell.detached = false;
    // cell.input = Input.none;

    // cell.grid = Grid.none;
    // cell.gridTick = 0;
    // cell.dynamicHistory = Cell.noHistory;
    // cell.operation = Operation.none;

    // cell.result = null;
    // cell.resultTick = 0;

    return cell;
};

Cell.empty = (function () {
    var cell = Cell.create();
    cell.transformation = Transformation.empty;
    cell.args = Cell.noArgs;
    cell.text = '';

    cell.result = 0;

    return cell;
})();

Cell.argCells = function (cell, grid, c, r) {
    var argCells = [];
    for (var i = 0; i < cell.args.length; i += 2) {
        var argC = c + cell.args[i];
        var argR = r + cell.args[i + 1];
        var argCell = grid.cells[argC][argR];
        argCells.push(argCell);
    }
    return argCells;
};

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

Cell.numFrames = function (cell) {
    var endFrame = cell.endFrame;
    if (endFrame === Infinity) {
        endFrame = cell.grid.numFrames - 1;
    }
    return endFrame - cell.startFrame + 1;
};

// TODO: deepCopy is a bad replacement for `build` functions that setup
// a cell of a certain transformation type properly.
Cell.deepCopy = function (original) {
    var cell = Cell.create();
    cell.group = original.group;
    cell.text = original.text;

    cell.transformation = original.transformation;
    cell.args = original.args.slice();
    cell.startFrame = original.startFrame;
    cell.endFrame = original.endFrame;
    cell.detached = original.detached;

    // cell.grid = Grid.none;
    cell.gridTick = original.gridTick;
    // cell.dynamicHistory = Cell.noHistory;
    cell.operation = original.operation;

    // cell.result = null;
    // cell.resultTick = 0;

    if (original.dynamicHistory.length) {
        cell.dynamicHistory = original.dynamicHistory.slice(0, -1);
        var historyCell = Cell.clonePostTransform(cell);
        historyCell.args = Cell.autoArgs[cell.args.length];
        cell.dynamicHistory.push(historyCell);
    }

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
