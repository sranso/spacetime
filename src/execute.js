'use strict';
var Execute = {};
(function () {

Execute.transform = function () {
    $Project.transformationTick += 1;
    $_stats.transform_numCells = 0;
    $_stats.transform_numCellsSampling = 0;

    var cell = $Project.cellLevels[0][0];
    Execute.transformCell(Grid.none, cell, 0, 0);
    var grid = cell.grid;
    for (var i = 1; i < $Project.cellLevels; i++) {
        var c = level[1];
        var r = level[2];
        var cell = grid.cells[c][r];
        Execute.transformCell(grid, cell, c, r);
        level[0] = cell;
        grid = cell.grid;
    }

    Execute.transformGrid($Project.cellLevels[$Project.currentLevel][0].grid);
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
    if (cell.gridTick === $Project.transformationTick) {
        return;
    }
    cell.gridTick = $Project.transformationTick;
    $_stats.transform_numCells += 1;

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

    var argCells = [];
    for (var i = 0; i < args.length; i += 2) {
        var argC = c + args[i];
        var argR = r + args[i + 1];
        var argCell = grid.cells[argC][argR];
        argCells.push(argCell);
        Execute.transformCell(grid, argCell, argC, argR);
    }
    var main = argCells[0];
    var additional = argCells.slice(1);

    cell.grid = transformation.transform(cell, main, additional);
};

Execute.executeAll = function () {
    $_stats.execAll_time = performance.now();
    $_stats.execAll_numCells = 0;
    executeAllGrid($Project.grid);
    $_stats.execAll_time = performance.now() - $_stats.execAll_time;
};

var executeAllGrid = function (grid) {
    for (var c = 0; c < grid.cells.length; c++) {
        for (var r = 0; r < grid.cells[0].length; r++) {
            var cell = grid.cells[c][r];
            executeAllCell(grid, cell, c, r);
        }
    }
};

var executeAllCell = function (grid, cell, c, r) {
    $_stats.execAll_numCells += 1;
    if (cell.base) {
        var argCells = [cell];
        for (var i = 0; i < cell.args.length; i += 2) {
            var argC = c + cell.args[i];
            var argR = r + cell.args[i + 1];
            var argCell = grid.cells[argC][argR];
            argCells.push(argCell);
        }
        cell.result = cell.operation.execute.apply(cell.operation, argCells);
    } else {
        executeAllGrid(cell.grid);
        var firstColumn = cell.grid.cells[0];
        cell.result = firstColumn[firstColumn.length - 1].result;
    }
};

Execute.executeGrid = function (grid) {
    $_stats.execGrid_time = performance.now();
    var oldStats = $_stats;
    var capturedStats = {
        execCell_numCells: 0,
        execCell_numBaseCells: 0,
    };
    $_stats = capturedStats;
    for (var c = 0; c < grid.cells.length; c++) {
        for (var r = 0; r < grid.cells[0].length; r++) {
            var cell = grid.cells[c][r];
            var frame = executeCell(cell, 0);
            cell.result = frame.result;
        }
    }
    $_stats = oldStats;
    $_stats.execGrid_numCells = capturedStats.execCell_numCells;
    $_stats.execGrid_numBaseCells = capturedStats.execCell_numBaseCells;
    $_stats.execGrid_time = performance.now() - $_stats.execGrid_time;
};

Execute.executeCell = function (cell, fetchFrame) {
    $_stats.timeExecute = performance.now();
    $_stats.execCell_numCells = 0;
    $_stats.execCell_numBaseCells = 0;
    $Project.executionTick += 1;
    var frame = executeCell(cell, fetchFrame);
    $_stats.timeExecute = performance.now() - $_stats.timeExecute;
    return frame;
};

var executeCell = function (cell, fetchFrame) {
    $_stats.execCell_numCells += 1;
    var atFrame = 0;
    var applyingCell = cell.grid.cells[0][cell.grid.cells[0].length - 1];
    var r = applyingCell.grid.cells[0].length - 1;

    for (var c = 0; c < applyingCell.grid.cells.length; c++) {
        var subCell = applyingCell.grid.cells[c][r];
        var subEnd = atFrame + subCell.grid.numFrames - 1;

        if (atFrame <= fetchFrame && fetchFrame <= subEnd) {
            if (subCell.operation !== Operation.none) {
                executeBaseCell(applyingCell.grid, subCell, c, r);
                return subCell;
            } else {
                return executeCell(subCell, fetchFrame - atFrame);
            }
        }
        atFrame = subEnd + 1;
    }

    var maxFrame = cell.grid.numFrames - 1;
    throw new Error('frame not found: ' + fetchFrame + ' / ' + maxFrame);
};

var executeBaseCell = function (grid, cell, c, r) {
    if (cell.resultTick === $Project.executionTick) {
        return;
    }
    cell.resultTick = $Project.executionTick;
    $_stats.execCell_numCells += 1;
    $_stats.execCell_numBaseCells += 1;

    var argCells = [cell];
    for (var i = 0; i < cell.args.length; i += 2) {
        var argC = c + cell.args[i];
        var argR = r + cell.args[i + 1];
        var argCell = grid.cells[argC][argR];
        argCells.push(argCell);
        executeBaseCellArg(grid, argCell, argC, argR);
    }
    cell.result = cell.operation.execute.apply(cell.operation, argCells);
};

var executeBaseCellArg = function (grid, cell, c, r) {
    if (cell.operation === Operation.none) {
        // TODO: does this help any?:
        // if (cell.resultTick === $Project.executionTick) {
        //     return;
        // }
        // cell.resultTick = $Project.executionTick;
        $_stats.execCell_numCells += 1;

        var subGrid = cell.grid.cells[0][cell.grid.cells[0].length - 1].grid;

        var r = subGrid.cells[0].length - 1;
        var subCell = subGrid.cells[0][r];
        executeBaseCellArg(subGrid, subCell, 0, r);

        cell.result = subCell.result;
    } else {
        executeBaseCell(grid, cell, c, r);
    }
};

})();
