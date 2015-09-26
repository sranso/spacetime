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

Cell.empty = (function () {
    //======== BEGIN (Cell) ==========
    var cell = Cell.create();
        // cell.grid = Grid.none;
        // cell.group = Group.none; // TODO: groups for all empty?
    cell.transformation = Transformation.empty;
        // cell.operation = Transformation.none;
    cell.args = Cell.autoArgs[0];
    cell.text = '';
        // cell.gridTick = 0;
        // cell.detached = false;
        // cell.base = false;
    //======== END (Cell) ==========
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
    //======== BEGIN (Cell) ==========
    var cell = Cell.create();
        // cell.grid = Grid.none;
        cell.group = original.group;
        cell.transformation = original.transformation;
        cell.operation = original.operation;
        cell.args = original.args.slice();
        cell.text = original.text;
        cell.gridTick = original.gridTick;
        cell.detached = original.detached;
        cell.base = original.base;
    //======== END (Cell) ==========

    if (original.grid === Grid.none) {
        return cell;
    }

    //======== BEGIN (Grid) ==========
    cell.grid = Grid.create();
        cell.grid.layer = original.grid.layer;
        cell.grid.numFrames = original.grid.numFrames;
        // cell.grid.cells = [];
        // cell.grid.areas = [];
    //======== End (Grid) ==========

    cell.grid.areas = original.grid.areas.map(function (original) {
        //======== BEGIN (Area) ==========
        var area = Area.create();
            area.group = original.group;
            area.coords = original.coords.slice();
            area.text = original.text;
        //======== End (Area) ==========
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
