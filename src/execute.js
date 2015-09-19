'use strict';
var Execute = {};
(function () {

Execute.transform = function () {
    Global.transformationTick += 1;
    Execute.transformGrid(Global.grid);
};

Execute.transformGrid = function (grid) {
    grid.numFrames = 0;

    for (var c = 0; c < grid.cells.length; c++) {
        for (var r = 0; r < grid.cells[0].length; r++) {
            var cell = grid.cells[c][r];
            Execute.transformCell(grid, cell, c, r);
        }
        grid.numFrames += grid.cells[c][grid.cells[0].length - 1].grid.numFrames;
    }
};

Execute.transformCell = function (grid, cell, c, r) {
    if (cell.gridTick === Global.transformationTick) {
        return;
    }
    cell.gridTick = Global.transformationTick;

    if (cell.detached) {
        var transformation = Transformation.detached;
        var args = Cell.noArgs;
    } else if (cell.apply) {
        var transformation = cell.transformation;
        var args = cell.args;
    } else {
        var transformation = Transformation.history;
        var args = cell.args;
    }

    var argCells = transformArgs(grid, args, c, r);
    var main = argCells[0];
    var additional = argCells.slice(1);

    cell.grid = transformation.transform(cell, main, additional);
};

var transformArgs = function (grid, args, c, r) {
    var argCells = [];
    for (var i = 0; i < args.length; i += 2) {
        var argC = c + args[i];
        var argR = r + args[i + 1];
        var argCell = Grid.cellAt(grid, argC, argR);
        argCells.push(argCell);
        Execute.transformCell(grid, argCell, argC, argR);
    }
    return argCells;
};

Execute.executeAll = function () {
    Global.stats.numCellsExecuteAll = 0;
    executeAllGrid(Global.grid);
};

var executeAllGrid = function (grid) {
    for (var c = 0; c < grid.cells.length; c++) {
        for (var r = 0; r < grid.cells[0].length; r++) {
            var cell = Grid.cellAt(grid, c, r);
            executeAllCell(grid, cell, c, r);
        }
    }
};

var executeAllCell = function (grid, cell, c, r) {
    Global.stats.numCellsExecuteAll += 1;
    if (cell.base) {
        var argCells = [cell];
        for (var i = 0; i < cell.args.length; i += 2) {
            var argC = c + cell.args[i];
            var argR = r + cell.args[i + 1];
            var argCell = Grid.cellAt(grid, argC, argR);
            argCells.push(argCell);
        }
        cell.result = cell.operation.execute.apply(cell.operation, argCells);
    } else {
        executeAllGrid(cell.grid);
        var firstColumn = cell.grid.cells[0];
        cell.result = firstColumn[firstColumn.length - 1].result;
    }
};

})();
