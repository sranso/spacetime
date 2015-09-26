'use strict';
var Library = {};
(function () {

var baseOperation = {};

baseOperation.literal = Operation.create('literal', function (cell) {
    return +cell.operation.data;
});

baseOperation.plusOne = Operation.create('plusOne', function (cell, a) {
    return a.result + 1;
});

baseOperation.add = Operation.create('add', function (cell, a, b) {
    return a.result + b.result;
});

Library.literal = (function () {
    //======== BEGIN (Cell) ==========
    var cell = Cell.create();
        // cell.grid = Grid.none;
        // cell.group = Group.none; // TODO: groups for all base?
    cell.transformation = Transformation.immediate(baseOperation.literal);
        // cell.operation = Transformation.none;
    cell.args = Cell.autoArgs[0];
    cell.text = '<literal>';
        // cell.gridTick = 0;
        // cell.detached = false;
        // cell.base = false;
    //======== END (Cell) ==========
    return cell;
})();

Library.plusOne = (function () {
    //======== BEGIN (Cell) ==========
    var cell = Cell.create();
        // cell.grid = Grid.none;
        // cell.group = Group.none; // TODO: groups for all base?
    cell.transformation = Transformation.linear(baseOperation.plusOne);
        // cell.operation = Transformation.none;
    cell.args = Cell.autoArgs[2];
    cell.text = '+1';
        // cell.gridTick = 0;
        // cell.detached = false;
        // cell.base = false;
    //======== END (Cell) ==========
    return cell;
})();

Library.add = (function () {
    //======== BEGIN (Cell) ==========
    var cell = Cell.create();
        // cell.grid = Grid.none;
        // cell.group = Group.none; // TODO: groups for all base?
    cell.transformation = Transformation.linear(baseOperation.add);
        // cell.operation = Transformation.none;
    cell.args = Cell.autoArgs[4];
    cell.text = '+';
        // cell.gridTick = 0;
        // cell.detached = false;
        // cell.base = false;
    //======== END (Cell) ==========
    return cell;
})();

Library.identity = (function () {
    //======== BEGIN (Cell) ==========
    var cell = Cell.create();
        // cell.grid = Grid.none;
        // cell.group = Group.none; // TODO: groups for all base?
    cell.transformation = Transformation.identity;
        // cell.operation = Transformation.none;
    cell.args = Cell.autoArgs[2];
    cell.text = 'id';
        // cell.gridTick = 0;
        // cell.detached = false;
        // cell.base = false;
    //======== END (Cell) ==========
    return cell;
})();

Library.plusTwo = (function () {
    var column = [
        Cell.deepCopy(Library.plusOne),
        Cell.deepCopy(Library.plusOne),
    ];

    //======== BEGIN (Cell) ==========
    var cell = Cell.create();
    cell.grid = Grid.create();
        // cell.group = Group.none; // TODO: groups for all base?
    cell.transformation = Transformation.expand;
        // cell.operation = Transformation.none;
    cell.args = Cell.autoArgs[2];
    cell.text = '+2';
        // cell.gridTick = 0;
        // cell.detached = false;
        // cell.base = false;
    //======== END (Cell) ==========

    cell.grid.cells[0] = column;
    cell.grid.layer = 'over';

    //======== BEGIN (Area) ==========
    var area = Area.create();
        // area.group = Group.none;
    area.coords = [0, 0, 0, 1];
        // area.text = '';
    //======== END (Area) ==========
    cell.grid.areas.push(area);

    return cell;
})();

Library.empty = Cell.deepCopy(Cell.empty);

Library.lookup = {
    '+': Library.add,
    '+1': Library.plusOne,
    '+2': Library.plusTwo,
    'id': Library.identity,
};

})();
