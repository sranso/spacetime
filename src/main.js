'use strict';
var Main = {};
(function () {

Main.setup = function () {
    Global.grid = Grid.create();
    var column = [];
    var cell;

    cell = Cell.create();

    // complicated (3, 7) -> (4, 8) -> (5, 9)
    var subGrid = Grid.create();
    var subCell, operation;

        subCell = Cell.create();
        operation = Operation.clone(Operation.literal);
        operation.data = 3;
        subCell.transformation = Transformation.immediate(operation);
        subGrid.cells.push([subCell]);

        subCell = Cell.create();
        operation = Operation.clone(Operation.literal);
        operation.data = 7;
        subCell.transformation = Transformation.immediate(operation);
        subGrid.cells.push([subCell]);

    var subHistoryCell = Cell.create();
    subHistoryCell.transformation = Transformation.detached;
    subHistoryCell.grid = subGrid;
    var subHistoryGrid = Grid.create();
    subHistoryGrid.layer = 'history';
    subHistoryGrid.cells.push([subHistoryCell]);

    cell.transformation = Transformation.detached;
    cell.grid = subHistoryGrid;
    column.push(cell);

    // simple 3 -> 4 -> 5
    //var operation = Operation.clone(Operation.literal);
    //operation.data = 3;
    //cell.transformation = Transformation.immediate(operation);
    //column.push(cell);

    cell = Cell.create();
    cell.transformation = Transformation.plusOne;
    cell.args = [0, -1];
    column.push(cell);

    cell = Cell.create();
    cell.transformation = Transformation.plusOne;
    cell.args = [0, -1];
    column.push(cell);

    // cell = Cell.create();
    // cell.transformation = Transformation.add;
    // cell.args = [0, -2, 0, -1];
    // column.push(cell);

    Global.grid.cells = [column];

    Execute.transform();
    Execute.execute();
};

Main.setup();

})();
