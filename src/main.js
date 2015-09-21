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
};

Main.setup = function () {
    $Project = buildProject();

    Input.setup();
    Draw.setup();
    Main.update();
};

Main.mouseDown = function () {
};

Main.mouseMove = function () {
};

Main.mouseUp = function () {
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

        subCell = Cell.create();
        //======== BEGIN (Operation) ========
        operation = Operation.create(
            Operation.literal.text,
            Operation.literal.execute
        );
        operation.data = 3;
        //======== END (Operation) ========
        subCell.transformation = Transformation.immediate(operation);
        subCell.text = '3';
        subGrid.cells.push([subCell]);

        subCell = Cell.create();
        //======== BEGIN (Operation) ========
        operation = Operation.create(
            Operation.literal.text,
            Operation.literal.execute
        );
        operation.data = 7;
        //======== END (Operation) ========
        subCell.transformation = Transformation.immediate(operation);
        subCell.text = '7';
        subGrid.cells.push([subCell]);

    var subHistoryCell = Cell.create();
    subHistoryCell.transformation = Transformation.detached;
    subHistoryCell.apply = true;
    subHistoryCell.detached = true;
    subHistoryCell.grid = subGrid;
    subHistoryCell.text = '3, 7';
    var subHistoryGrid = Grid.create();
    subHistoryGrid.layer = 'history';
    subHistoryGrid.cells.push([subHistoryCell]);

    cell.transformation = Transformation.detached;
    cell.detached = true;
    cell.grid = subHistoryGrid;
    cell.text = '3, 7';
    column.push(cell);

    // simple 3 -> 4 -> 5
    ////======== BEGIN (Operation) ========
    //var operation = Operation.create(
    //    Operation.literal.text,
    //    Operation.literal.execute
    //);
    //operation.data = 3;
    ////======== END (Operation) ========
    //cell.transformation = Transformation.immediate(operation);
    //column.push(cell);

    // with multiCell (1 + 1 = 2)
        // optional extra plus
        cell = Cell.create();
        cell.transformation = Transformation.plusOne;
        cell.args = [0, -1];
        cell.text = '+1';
        column.push(cell);

    var originalColumn = column;

    var multiCellHistory = Cell.create();
    multiCellHistory.transformation = Transformation.expand;
    multiCellHistory.args = [0, -1];
    multiCellHistory.grid = Grid.create();
    multiCellHistory.grid.layer = 'history';
    multiCellHistory.text = '+2';
    originalColumn.push(multiCellHistory);

    var multiCell = Cell.create();
    multiCell.transformation = Transformation.expand;
    multiCell.apply = true;
    multiCell.grid = Grid.create();
    multiCell.grid.layer = 'over';
    multiCell.text = '+2';
    multiCellHistory.grid.cells.push([multiCell]);

    var area = Area.create();
    area.coords = [0, 0, 0, 1];
    multiCell.grid.areas.push(area);

    column = [];
    multiCell.grid.cells[0] = column;

      cell = Cell.create();
      cell.transformation = Transformation.plusOne;
      cell.args = [0, -1];
      cell.text = '+1';
      column.push(cell);

      cell = Cell.create();
      cell.transformation = Transformation.plusOne;
      cell.args = [0, -1];
      cell.text = '+1';
      column.push(cell);

    column = originalColumn;

    // optional extra plus
    //cell = Cell.create();
    //cell.transformation = Transformation.plusOne;
    //cell.args = [0, -1];
    //cell.text = '+1';
    //column.push(cell);

    cell = Cell.create();
    cell.transformation = Transformation.add;
    cell.args = [0, -2, 0, -1];
    cell.text = '+';
    column.push(cell);

    return project;
};

Main.setup();

})();
