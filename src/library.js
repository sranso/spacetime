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
        // cell.apply = false;
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
        // cell.apply = false;
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
        // cell.apply = false;
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
        // cell.apply = false;
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
    var historyCell = Cell.create();
    historyCell.grid = Grid.create();
        // historyCell.group = Group.none; // TODO: groups for all base?
    historyCell.transformation = Transformation.expand;
        // historyCell.operation = Transformation.none;
    historyCell.args = Cell.autoArgs[2];
    historyCell.text = '+2';
        // historyCell.gridTick = 0;
        // historyCell.detached = false;
    historyCell.apply = true;
        // historyCell.base = false;
    //======== END (Cell) ==========

    historyCell.grid.cells[0] = column;
    historyCell.grid.layer = 'over';

    //======== BEGIN (Area) ==========
    var area = Area.create();
        // area.group = Group.none;
    area.coords = [0, 0, 0, 1];
        // area.text = '';
    //======== END (Area) ==========
    historyCell.grid.areas.push(area);


    //======== BEGIN (Cell) ==========
    var topCell = Cell.create();
    topCell.grid = Grid.create();
        // topCell.group = Group.none; // TODO: groups for all base?
    topCell.transformation = Transformation.expand;
        // topCell.operation = Transformation.none;
    topCell.args = Cell.autoArgs[2];
    topCell.text = '+2';
        // topCell.gridTick = 0;
        // topCell.detached = false;
        // topCell.apply = false;
        // topCell.base = false;
    //======== END (Cell) ==========

    topCell.grid.layer = 'history';
    topCell.grid.cells[0] = [historyCell];

    return topCell;
})();

Library.empty = Cell.deepCopy(Cell.empty);

Library.lookup = {
    '+': Library.add,
    '+1': Library.plusOne,
    '+2': Library.plusTwo,
    'id': Library.identity,
};

})();
