'use strict';
var Execute = {};
(function () {

Execute.transform = function () {
    Global.transformationTick += 1;
    Execute.transformGrid(Global.grid);
};

Execute.transformGrid = function (grid) {
    for (var c = 0; c < grid.cells.length; c++) {
        for (var r = 0; r < grid.cells[0].length; r++) {
            var cell = Grid.cellAt(grid, c, r);
            Execute.transformCell(grid, cell, c, r);
        }
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
        var historyLayer = main.grid.cells[0].slice();
    } else {
        var historyLayer = [];
    }
    var grid = Grid.create();
    grid.layer = 'history';
    grid.cells[0] = historyLayer;

    additional.forEach(function (originalArgCell) {
        var argCell = Cell.create();
        argCell.grid = originalArgCell.grid;
        argCell.group = originalArgCell.group;
        argCell.text = originalArgCell.text;
        argCell.gridTick = Global.transformationTick;
        argCell.transformation = Transformation.detached;
        historyLayer.push(argCell);
    });

    var historyCell = Cell.create();
    historyCell.group = cell.group;
    historyCell.text = cell.text;
    var t = cell.transformation;
    historyCell.transformation = Transformation.create(t.text, t.transform);
    historyCell.transformation.apply = true;
    var args = [];
    var j = -cell.args.length / 2;
    for (var i = 0; i < cell.args.length; i += 2) {
        args[i] = 0;
        args[i + 1] = j;
        j++;
    }
    historyCell.args = args;
    historyLayer.push(historyCell);

    Execute.transformCell(grid, historyCell, 0, historyLayer.length - 1);

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
