'use strict';
var Main = {};
(function () {

Main.setup = function () {
    Global.grid = Grid.create();
    var column = [];
    var cell;

    cell = Cell.create();
    cell.transformation = Transformation.literal;
    cell.text = '3';
    column.push(cell);

    cell = Cell.create();
    cell.transformation = Transformation.plusOne;
    cell.args = [0, -1];
    column.push(cell);

    cell = Cell.create();
    cell.transformation = Transformation.plusOne;
    cell.args = [0, -1];
    column.push(cell);

    Global.grid.cells = [column];

    Execute.transform();
    Execute.execute();
};

Main.setup();

})();
