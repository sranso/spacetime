'use strict';
var Main = {};
(function () {

Main.update = function () {
    Execute.transform();
    var grid = $Project.cellLevels[$Project.currentLevel][0].grid;
    Execute.executeGrid(grid);
    Draw.draw();
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

    Input.setup();
    Draw.setup();

    console.log(
        'trans ' +
        'exec  ' +
        'draw  '
    );
    Main.update();
};

var buildProject = function () {
    var project = Project.createBlank();

    var column = [];
    var cell = Cell.none;
    var grid = project.cellLevels[project.currentLevel][0].grid;
    grid.cells = [column];

    cell = Cell.create();

    // complicated (3, 7) -> (4, 8) -> (5, 9)
    var subGrid = Grid.create();
    var subCell = Cell.none;
    var operation = Operation.none;

        subCell = Cell.deepCopy(Library.literal);
        operation = Operation.create(
                subCell.transformation.operation.text,
                subCell.transformation.operation.execute
        );
        operation.data = 3;

        subCell.transformation = Transformation.immediate(operation);
        subCell.text = '3';
        subGrid.cells.push([subCell]);

        subCell = Cell.deepCopy(Library.literal);
        operation = Operation.create(
                subCell.transformation.operation.text,
                subCell.transformation.operation.execute
        );
        operation.data = 7;

        subCell.transformation = Transformation.immediate(operation);
        subCell.text = '7';
        subGrid.cells.push([subCell]);

    var cell = Cell.create();
    cell.transformation = Transformation.detached;
    cell.detached = true;
    cell.grid = subGrid;
    cell.text = '3, 7';
    column.push(cell);

    column.push(Cell.deepCopy(Library.plusOne));
    column.push(Cell.deepCopy(Library.plusTwo));
    column.push(Cell.deepCopy(Library.add));

    return project;
};

Main.setup();

})();
