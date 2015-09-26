'use strict';
var Main = {};
(function () {

Main.update = function () {
    Execute.transform();
    //Execute.execute();
    //Execute.executeAll();
    var grid = $Project.cellLevels[$Project.currentLevel][0].grid;
    Execute.executeGrid(grid);
    Draw.draw();
    logStats();
};

var logStats = function () {
    var clamp = function (x) {
        var s = '' + x;
        return s.slice(0, 3);
    };
    console.log(
        clamp(__stats.transform_time) + '   ' +
        clamp(__stats.execGrid_time) + '   ' +
        clamp(__stats.draw_time)
    );
};

Main.setup = function () {
    $Project = buildProject();

    Input.setup();
    Draw.setup();
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
        //======== BEGIN (Operation) ========
        operation = Operation.create(
                subCell.transformation.operation.text,
                subCell.transformation.operation.execute
        );
        operation.data = 3;
        //======== END (Operation) ========
        subCell.transformation = Transformation.immediate(operation);
        subCell.text = '3';
        subGrid.cells.push([subCell]);

        subCell = Cell.deepCopy(Library.literal);
        //======== BEGIN (Operation) ========
        operation = Operation.create(
                subCell.transformation.operation.text,
                subCell.transformation.operation.execute
        );
        operation.data = 7;
        //======== END (Operation) ========
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
