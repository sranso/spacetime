'use strict';
var Execute = {};
(function () {

Execute.transform = function () {
    $Project.transformationTick += 1;
    $Stats.numCellsTransformed = 0;
    $Stats.numCellsTouchedSampling = 0;

    Execute.transformGrid($Project.grid);
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
    $Stats.numCellsTransformed += 1;

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
    $Stats.timeExecuteAll = performance.now();
    $Stats.numCellsExecuteAll = 0;
    executeAllGrid($Project.grid);
    $Stats.timeExecuteAll = performance.now() - $Stats.timeExecuteAll;
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
    $Stats.numCellsExecuteAll += 1;
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

Execute.execute = function () {
    $Global.frames = [];
    $Stats.timeExecute = performance.now();
    Execute.executeCell($Project.cell, $Global.frames, 0, $Project.grid.numFrames - 1);
    $Stats.timeExecute = performance.now() - $Stats.timeExecute;
};

Execute.executeCell = function (cell, frames, startSample, endSample) {
    $Stats.numCellsExecute = 0;
    $Stats.numBaseCellsExecute = 0;
    $Project.executionTick += 1;
    executeCell(cell, frames, startSample, endSample);
};

var executeCell = function (cell, frames, startSample, endSample) {
    $Stats.numCellsExecute += 1;
    var sample = 0;
    var applyingCell = cell.grid.cells[0][cell.grid.cells[0].length - 1];
    var r = applyingCell.grid.cells[0].length - 1;

    for (var c = 0; c < applyingCell.grid.cells.length; c++) {
        var subCell = applyingCell.grid.cells[c][r];
        var subEnd = sample + subCell.grid.numFrames - 1;

        if (sample <= endSample && subEnd >= startSample) {
            if (subCell.operation !== Operation.none) {
                executeBaseCell(applyingCell.grid, subCell, c, r);
                frames.push(subCell);
            } else {
                var newStart = startSample - sample;
                var newEnd = endSample - sample;
                executeCell(subCell, frames, newStart, newEnd);
            }
        }
        sample = subEnd + 1;
    }
};

var executeBaseCell = function (grid, cell, c, r) {
    if (cell.resultTick === $Project.executionTick) {
        return;
    }
    cell.resultTick = $Project.executionTick;
    $Stats.numCellsExecute += 1;
    $Stats.numBaseCellsExecute += 1;

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
        // TODO: does this help any:
        // if (cell.resultTick === $Project.executionTick) {
        //     return;
        // }
        // cell.resultTick = $Project.executionTick;
        $Stats.numCellsExecute += 1;

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
