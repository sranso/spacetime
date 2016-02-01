'use strict';
global.Main = {};
(function () {

Main.update = function () {
    Global.wasPlaying = Global.play;
    Execute.transform();
    if (Global.fullScreen) {
        var level = Project.currentLevel($Project);
        Execute.executeCell(level.cell, $Project.currentFrame, level.grid, level.c, level.r);
    } else {
        Execute.executeGrid(Project.currentGrid($Project));
    }
    Ui.draw();
    Global.wasPlaying = false;
    logStats();
};

var clampLogPart = function (x) {
    var s = '' + x;
    return s.slice(0, 3);
};

var logStats = function () {
    console.log(
        clampLogPart(__stats.transform_time) + '   ' +
        clampLogPart(__stats.execGrid_time) + '   ' +
        clampLogPart(__stats.draw_time)
    );
};

Main.setup = function () {
    Store.setup();

    // $Project = buildFilledProject();
    $Project = buildEmptyProject();

    Global.boxInSight = Do.boxInSight(0, 0);

    Ui.setup();

    console.log(
        'trans ' +
        'exec  ' +
        'ui    '
    );
    Main.update();

    window.requestAnimationFrame(Main.tick);
};

var buildEmptyProject = function () {
    var project = Project.createBlank();

    var grid = Project.currentGrid(project);

    var cell = Cell.deepCopy(Library.empty);
    grid.cells = [[cell]];

    return project;
};

var buildFilledProject = function () {
    var project = Project.createBlank();

    var column = [];
    var cell = Cell.none;
    var grid = Project.currentGrid(project);
    grid.cells = [column];

    cell = Cell.create();

    var subGrid = Grid.create();
    var subCell = Cell.none;
    var operation = Operation.none;

    [3, 7, 8, 9].forEach(function (i) {
        subCell = Cell.deepCopy(Library.literalNumber);
        operation = Operation.create(
                subCell.transformation.operation.text,
                subCell.transformation.operation.execute
        );
        operation.data = i;

        subCell.transformation = Transformation.immediate(operation);
        subCell.text = '' + i;
        subGrid.cells.push([subCell]);
    });

    var cell = Cell.create();
    cell.text = '3, 7, 8, 9';
    cell.transformation = Transformation.empty;
    cell.detached = true;
    cell.grid = subGrid;
    cell.dynamicHistory = [cell];
    column.push(cell);

    column.push(Cell.deepCopy(MathLibrary.plusOne));
    column.push(Cell.deepCopy(MathLibrary.plusTwo));
    column.push(Cell.deepCopy(MathLibrary.add));

    return project;
};

Main.tick = function (time) {
    if (Global.play && Global.lastTickTime) {
        var timeDiff = time - Global.lastTickTime;
        Global.lastTickTime = time;
        Global.tickTimeAccrued += timeDiff;
        Global.framesToAdvance = Math.floor(Global.tickTimeAccrued / Global.timePerFrame);
        Global.tickTimeAccrued -= Global.framesToAdvance * Global.timePerFrame;
    } else {
        Global.framesToAdvance = 0;
    }

    if (Global.forceCaptureInput || Global.framesToAdvance > 0) {
        Main.update();
    }

    window.requestAnimationFrame(Main.tick);
};

})();
