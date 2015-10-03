'use strict';
var Main = {};
(function () {

Main.update = function () {
    Execute.transform();
    Execute.executeGrid(Project.currentGrid($Project));
    Ui.draw();
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
    $Project = buildProject();

    Keyboard.setup();
    Webgl.setup();
    Ui.setup();

    console.log(
        'trans ' +
        'exec  ' +
        'ui    '
    );
    Main.update();

    window.requestAnimationFrame(Main.tick);
};

var buildProject = function () {
    var project = Project.createBlank();

    var column = [];
    var cell = Cell.none;
    var grid = project.cellLevels[project.currentLevel][0].grid;
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
    cell.transformation = Transformation.detached;
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

Main.setup();

})();
