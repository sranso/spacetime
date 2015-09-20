'use strict';
var Main = {};
(function () {

Main.setup = function () {
    Global.grid = Grid.create();

    //======== BEGIN (Cell) ==========
    var historyCell = Cell.create();
    historyCell.grid = Global.grid;
        // historyCell.group = Group.none;
    historyCell.transformation = Transformation.detached;
        // historyCell.operation = cell.operation;
        // historyCell.args = Cell.noArgs;
        // historyCell.text = '';
        // historyCell.gridTick = 0;
        // historyCell.resultTick = 0;
    historyCell.detached = true;
    historyCell.apply = true;
        // historyCell.base = false;
        // historyCell.result = null;
    //======== END (Cell) ==========

    //======== BEGIN (Cell) ==========
    Global.cell = Cell.create();
    Global.cell.grid = Grid.create();
        // Global.cell.group = Group.none;
    Global.cell.transformation = Transformation.detached;
        // Global.cell.operation = cell.operation;
        // Global.cell.args = Cell.noArgs;
        // Global.cell.text = '';
        // Global.cell.gridTick = 0;
        // Global.cell.resultTick = 0;
    Global.cell.detached = true;
        // Global.cell.apply = false;
        // Global.cell.base = false;
        // Global.cell.result = null;
    //======== END (Cell) ==========

    Global.cell.grid.layer = 'history';
    Global.cell.grid.cells.push([historyCell]);


    var column = [];
    var cell;
    Global.grid.cells = [column];

    cell = Cell.create();

    // complicated (3, 7) -> (4, 8) -> (5, 9)
    var subGrid = Grid.create();
    var subCell, operation;

        subCell = Cell.create();
        //======== BEGIN (Operation) ========
        operation = Operation.create(
            Operation.literal.text,
            Operation.literal.execute
        );
        operation.data = 3;
        //======== END (Operation) ========
        subCell.transformation = Transformation.immediate(operation);
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
        subGrid.cells.push([subCell]);

    var subHistoryCell = Cell.create();
    subHistoryCell.transformation = Transformation.detached;
    subHistoryCell.apply = true;
    subHistoryCell.detached = true;
    subHistoryCell.grid = subGrid;
    var subHistoryGrid = Grid.create();
    subHistoryGrid.layer = 'history';
    subHistoryGrid.cells.push([subHistoryCell]);

    cell.transformation = Transformation.detached;
    cell.detached = true;
    cell.grid = subHistoryGrid;
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
        column.push(cell);

    var originalColumn = column;

    var multiCellHistory = Cell.create();
    multiCellHistory.transformation = Transformation.expand;
    multiCellHistory.args = [0, -1];
    multiCellHistory.grid = Grid.create();
    multiCellHistory.grid.layer = 'history';
    originalColumn.push(multiCellHistory);

    var multiCell = Cell.create();
    multiCell.transformation = Transformation.expand;
    multiCell.apply = true;
    multiCell.grid = Grid.create();
    multiCell.grid.layer = 'over';
    multiCellHistory.grid.cells.push([multiCell]);

    var area = Area.create();
    area.coords = [0, 0, 0, 1];
    multiCell.grid.areas.push(area);

    column = [];
    multiCell.grid.cells[0] = column;

      cell = Cell.create();
      cell.transformation = Transformation.plusOne;
      cell.args = [0, -1];
      column.push(cell);

      cell = Cell.create();
      cell.transformation = Transformation.plusOne;
      cell.args = [0, -1];
      column.push(cell);

    column = originalColumn;

    // optional extra plus
    //cell = Cell.create();
    //cell.transformation = Transformation.plusOne;
    //cell.args = [0, -1];
    //column.push(cell);

    cell = Cell.create();
    cell.transformation = Transformation.add;
    cell.args = [0, -2, 0, -1];
    column.push(cell);

    Execute.transform();
    Execute.execute();
    Execute.executeAll();
};

Main.setup();

})();
