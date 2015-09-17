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

    var argCells = transformArgs(grid, cell.args, c, r);
    var main = argCells[0];
    var additional = argCells.slice(1);

    if (cell.transformation.apply) {
        cell.grid = cell.transformation.transform(cell, main, additional);
    } else {
        cell.grid = appendHistory(cell, main, additional);
    }
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

var appendHistory = function (cell, main, additional) {
    if (main) {
        var historyLayer = main.grid.cells[0].slice(0, -1);
        var mainClone = Cell.clone(main);
        mainClone.args = Cell.autoArgs[main.args.length];
        historyLayer.push(mainClone);
    } else {
        var historyLayer = [];
    }
    var grid = Grid.create();
    grid.layer = 'history';
    grid.cells[0] = historyLayer;

    additional.forEach(function (originalArgCell) {
        var argCell = Cell.clone(originalArgCell);
        argCell.transformation = Transformation.detached;
        historyLayer.push(argCell);
    });

    var historyCell = Cell.clone(cell);
    historyCell.transformation = Transformation.clone(cell.transformation);
    historyCell.transformation.data = cell.transformation.data;
    historyCell.transformation.apply = true;
    historyCell.args = Cell.autoArgs[cell.args.length];
    historyCell.grid = grid;
    historyLayer.push(historyCell);

    Execute.transformCell(grid, historyCell, 0, historyLayer.length - 1);

    grid.numFrames = historyCell.grid.numFrames;

    return grid;
};

Execute.execute = function () {
    executeGrid(Global.grid);
};

var executeGrid = function (grid) {
    for (var c = 0; c < grid.cells.length; c++) {
        for (var r = 0; r < grid.cells[0].length; r++) {
            var cell = Grid.cellAt(grid, c, r);
            executeCell(grid, cell, c, r);
        }
    }
};

var executeCell = function (grid, cell, c, r) {
    if (!cell.base) {
        executeGrid(cell.grid);
    }
    var argCells = [cell];
    for (var i = 0; i < cell.args.length; i += 2) {
        var argC = c + cell.args[i];
        var argR = r + cell.args[i + 1];
        var argCell = Grid.cellAt(grid, argC, argR);
        argCells.push(argCell);
    }
    cell.result = cell.operation.execute.apply(cell.operation, argCells);
};

})();
