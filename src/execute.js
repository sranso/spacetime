'use strict';
var Execute = {};
(function () {

Execute.transform = function () {
    __stats.transform_time = performance.now();
    __stats.transform_numCells = 0;


    var level = Project.currentLevel($Project);
    var cell = level.cell;
    if (Global.forceCaptureInput || Global.framesToAdvance > 0) {
        Global.capturedInput = Input.clone(Global.currentInput);
        while (true) {
            $Project.transformationTick += 1;
            if (Global.framesToAdvance > 0) {
                $Project.currentFrame++;
            }
            Execute.transformCell(cell, $Project.currentFrame, level.grid, level.c, level.r);
            if (Global.framesToAdvance > 0) {
                Global.framesToAdvance--;
                var numFrames = Cell.numFrames(cell);
                if ($Project.currentFrame >= numFrames - 1) {
                    $Project.currentFrame = numFrames - 1;
                    Global.play = false;
                    break;
                }
            }
            if (Global.framesToAdvance === 0) {
                break;
            }
        }
    } else {
        $Project.transformationTick += 1;
    }

    var grid = $Project.cellLevels[0].grid;
    for (var i = 0; i < $Project.cellLevels.length; i++) {
        var level = $Project.cellLevels[i];
        var cell = grid.cells[level.c][level.r];
        if (!cell) {
            $Project.cellLevels.splice(i, $Project.cellLevels.length - i);
            break;
        }
        Execute.transformCell(cell, -1, grid, level.c, level.r);
        level.cell = cell;
        level.grid = grid;
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
    if (cell.transformationTick === $Project.transformationTick) {
        return;
    }
    cell.transformationTick = $Project.transformationTick;
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
        cell.result = Result.empty;
        return cell.result;
    }
    if (cell.operation !== Operation.none) {
        executeBaseCell(cell, pGrid, pC, pR);
        return cell.result;
    }

    var atFrame = 0;
    var r = cell.grid.cells[0].length - 1;

    for (var c = 0; c < cell.grid.cells.length; c++) {
        var subCell = cell.grid.cells[c][r];
        var subEnd = atFrame + Cell.numFrames(subCell) - 1;

        if (atFrame <= fetchFrame && fetchFrame <= subEnd) {
            cell.result = executeCell(subCell, fetchFrame - atFrame, cell.grid, c, r);
            return cell.result;
        }
        atFrame = subEnd + 1;
    }

    throw new Error('Could not find frame ' + fetchFrame + ' / ' + cell.grid.numFrames);
};

var executeBaseCell = function (cell, grid, c, r) {
    if (cell.executionTick === $Project.executionTick) {
        return;
    }
    cell.executionTick = $Project.executionTick;
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
