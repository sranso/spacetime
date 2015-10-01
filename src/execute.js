'use strict';
var Execute = {};
(function () {

Execute.transform = function () {
    __stats.transform_time = performance.now();
    __stats.transform_numCells = 0;

    $Project.transformationTick += 1;

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

    Execute.transformGrid(Project.currentGrid($Project));

    __stats.transform_time = performance.now() - __stats.transform_time;
};

Execute.transformGrid = function (grid) {
    grid.numFrames = 0;

    for (var c = 0; c < grid.cells.length; c++) {
        var cell;
        for (var r = 0; r < grid.cells[0].length; r++) {
            cell = grid.cells[c][r];
            Execute.transformCell(grid, cell, c, r);
        }
        grid.numFrames += Cell.numFrames(cell);
    }
};

Execute.transformCell = function (grid, cell, c, r) {
    if (cell.gridTick === $Project.transformationTick) {
        return;
    }
    cell.gridTick = $Project.transformationTick;
    __stats.transform_numCells += 1;

    if (cell.detached) {
        var transformation = Transformation.detached;
    } else {
        var transformation = cell.transformation;
    }
    transformation.transform(grid, cell, c, r);
};

Execute.transformArgs = function (grid, cell, c, r) {
    var argCells = [];
    for (var i = 0; i < cell.args.length; i += 2) {
        var argC = c + cell.args[i];
        var argR = r + cell.args[i + 1];
        var argCell = grid.cells[argC][argR];
        argCells.push(argCell);
        Execute.transformCell(grid, argCell, argC, argR);
    }
    return argCells;
};

Execute.executeGrid = function (grid) {
    __stats.execGrid_time = performance.now();
    var oldStats = __stats;
    var capturedStats = {
        execCell_numCells: 0,
        execCell_numBaseCells: 0,
    };
    __stats = capturedStats;

    $Project.executionTick += 1;

    for (var c = 0; c < grid.cells.length; c++) {
        for (var r = 0; r < grid.cells[0].length; r++) {
            var cell = grid.cells[c][r];
            executeCell(grid, cell, 0, c, r);
        }
    }

    __stats = oldStats;
    __stats.execGrid_numCells = capturedStats.execCell_numCells;
    __stats.execGrid_numBaseCells = capturedStats.execCell_numBaseCells;
    __stats.execGrid_time = performance.now() - __stats.execGrid_time;
};

Execute.executeCell = function (grid, cell, fetchFrame, c, r) {
    __stats.execCell_time = performance.now();
    __stats.execCell_numCells = 0;
    __stats.execCell_numBaseCells = 0;

    $Project.executionTick += 1;
    executeCell(grid, cell, fetchFrame, c, r);

    __stats.execCell_time = performance.now() - __stats.execCell_time;
};

var executeCell = function (grid, cell, fetchFrame, atC, atR) {
    __stats.execCell_numCells += 1;

    fetchFrame += cell.startFrame;

    var endFrame = cell.endFrame;
    if (fetchFrame > endFrame || fetchFrame >= cell.grid.numFrames) {
        return Cell.empty;
    }
    if (cell.operation !== Operation.none) {
        executeBaseCell(grid, cell, atC, atR);
        return cell;
    }

    var atFrame = 0;
    var r = cell.grid.cells[0].length - 1;

    for (var c = 0; c < cell.grid.cells.length; c++) {
        var subCell = cell.grid.cells[c][r];
        var subEnd = atFrame + Cell.numFrames(subCell) - 1;

        if (atFrame <= fetchFrame && fetchFrame <= subEnd) {
            var frame = executeCell(cell.grid, subCell, fetchFrame - atFrame, c, r);
            cell.result = frame.result;
            return frame;
        }
        atFrame = subEnd + 1;
    }

    return Cell.empty;
};

var executeBaseCell = function (grid, cell, c, r) {
    if (cell.resultTick === $Project.executionTick) {
        return;
    }
    cell.resultTick = $Project.executionTick;
    __stats.execCell_numCells += 1;
    __stats.execCell_numBaseCells += 1;

    var argCells = [cell];
    for (var i = 0; i < cell.args.length; i += 2) {
        var argC = c + cell.args[i];
        var argR = r + cell.args[i + 1];
        var argCell = grid.cells[argC][argR];
        argCells.push(argCell);
        executeCell(grid, argCell, 0, argC, argR);
    }
    cell.result = cell.operation.execute.apply(cell.operation, argCells);
};

Execute.executeArg = function (grid, cell, fetchFrame, argIndex, c, r) {
    var argC = c + cell.args[argIndex];
    var argR = r + cell.args[argIndex + 1];
    var argCell = grid.cells[argC][argR];
    Execute.executeCell(grid, argCell, 0, argC, argR);
};

})();
