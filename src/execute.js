'use strict';
var Execute = {};
(function () {

Execute.transform = function () {
    __stats.transform_time = performance.now();
    __stats.transform_numCells = 0;


    var cell = $Project.cellLevels[0][0];
    if (Global.forceCaptureInput || Global.framesToAdvance > 0) {
        Global.capturedInput = Input.clone(Global.currentInput);
        while (true) {
            $Project.transformationTick += 1;
            Execute.transformCell(cell, $Project.currentFrame, Grid.none, 0, 0);
            if (Global.framesToAdvance > 0) {
                Global.framesToAdvance--;
                $Project.currentFrame++;
                if ($Project.currentFrame >= Cell.numFrames(cell)) {
                    Global.play = false;
                    Global.framesToAdvance = 0;
                }
            }
            if (Global.framesToAdvance === 0) {
                break;
            }
        }
    } else {
        $Project.transformationTick += 1;
        Execute.transformCell(cell, -1, Grid.none, 0, 0);
    }

    var grid = cell.grid;
    for (var i = 1; i < $Project.cellLevels; i++) {
        var c = level[1];
        var r = level[2];
        var cell = grid.cells[c][r];
        Execute.transformCell(cell, -1, grid, c, r);
        level[0] = cell;
        grid = cell.grid;
    }

    Execute.transformGrid(Project.currentGrid($Project), -1);

    __stats.transform_time = performance.now() - __stats.transform_time;
};

Execute.transformGrid = function (grid, currentFrame) {
    grid.numFrames = 0;

    for (var c = 0; c < grid.cells.length; c++) {
        var cell;
        for (var r = 0; r < grid.cells[0].length; r++) {
            cell = grid.cells[c][r];
            Execute.transformCell(cell, currentFrame, grid, c, r);
        }
        var numFrames = Cell.numFrames(cell);
        grid.numFrames += numFrames;
        currentFrame -= numFrames;
    }
};

Execute.transformCell = function (cell, currentFrame, grid, c, r) {
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
    transformation.transform(cell, currentFrame, grid, c, r);
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
            executeCell(cell, 0, grid, c, r);
        }
    }

    __stats = oldStats;
    __stats.execGrid_numCells = capturedStats.execCell_numCells;
    __stats.execGrid_numBaseCells = capturedStats.execCell_numBaseCells;
    __stats.execGrid_time = performance.now() - __stats.execGrid_time;
};

Execute.executeColumn = function (grid, c, fetchFrame) {
    $Project.executionTick += 1;

    for (var r = 0; r < grid.cells[0].length; r++) {
        var cell = grid.cells[c][r];
        executeCell(cell, fetchFrame, grid, c, r);
    }
};

Execute.executeCell = function (cell, fetchFrame, grid, c, r) {
    __stats.execCell_time = performance.now();
    __stats.execCell_numCells = 0;
    __stats.execCell_numBaseCells = 0;

    $Project.executionTick += 1;
    executeCell(cell, fetchFrame, grid, c, r);

    __stats.execCell_time = performance.now() - __stats.execCell_time;
};

var executeCell = function (cell, fetchFrame, pGrid, pC, pR) {
    __stats.execCell_numCells += 1;

    fetchFrame += cell.startFrame;

    var endFrame = cell.endFrame;
    if (fetchFrame > endFrame || fetchFrame >= cell.grid.numFrames) {
        return Cell.empty;
    }
    if (cell.operation !== Operation.none) {
        executeBaseCell(cell, pGrid, pC, pR);
        return cell;
    }

    var atFrame = 0;
    var r = cell.grid.cells[0].length - 1;

    for (var c = 0; c < cell.grid.cells.length; c++) {
        var subCell = cell.grid.cells[c][r];
        var subEnd = atFrame + Cell.numFrames(subCell) - 1;

        if (atFrame <= fetchFrame && fetchFrame <= subEnd) {
            var frame = executeCell(subCell, fetchFrame - atFrame, cell.grid, c, r);
            cell.result = frame.result;
            return frame;
        }
        atFrame = subEnd + 1;
    }

    return Cell.empty;
};

var executeBaseCell = function (cell, grid, c, r) {
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
        executeCell(argCell, 0, grid, argC, argR);
    }
    cell.result = cell.operation.execute.apply(cell.operation, argCells);
};

Execute.executeArg = function (cell, fetchFrame, argIndex, grid, c, r) {
    var argC = c + cell.args[argIndex];
    var argR = r + cell.args[argIndex + 1];
    var argCell = grid.cells[argC][argR];
    Execute.executeCell(argCell, fetchFrame, grid, argC, argR);
};

})();
