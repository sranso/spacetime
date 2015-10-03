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

Library.empty = Cell.deepCopy(Cell.empty);

Library.literal = (function () {
    var cell = Cell.create();
    // cell.group = Group.none; // TODO: groups for all library?
    cell.text = '<literal>';
    cell.args = Cell.noArgs;
    cell.transformation = Transformation.immediate(baseOperation.literal);
    cell.dynamicHistory = [cell];

    return cell;
})();

Input.types.forEach(function (inputType) {
    var cell = Cell.create();
    cell.text = inputType;
    cell.args = Cell.noArgs;
    cell.transformation = Transformation.input(inputType);

    Library[inputType] = cell;
});

Library.plusOne = (function () {
    var cell = Cell.create();
    cell.text = '+1';
    cell.args = Cell.autoArgs[2];
    cell.transformation = Transformation.linear(baseOperation.plusOne);

    return cell;
})();

Library.add = (function () {
    var cell = Cell.create();
    cell.text = '+';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(baseOperation.add);

    return cell;
})();

Library.sample = (function () {
    var cell = Cell.create();
    cell.text = 'sample';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.sample;

    return cell;
})();

Library.drop = (function () {
    var cell = Cell.create();
    cell.text = 'drop';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.drop;

    return cell;
})();

Library.plusTwo = (function () {
    var column = [
        Cell.deepCopy(Library.plusOne),
        Cell.deepCopy(Library.plusOne),
    ];

    var cell = Cell.create();
    cell.text = '+2';
    cell.transformation = Transformation.expand;
    cell.args = Cell.autoArgs[2];

    cell.grid = Grid.create();
    cell.grid.cells[0] = column;
    cell.grid.layer = 'over';

    var area = Area.create();
    area.coords = [0, 0, 0, 1];

    cell.grid.areas.push(area);

    return cell;
})();

Library.lookup = {
    '+': Library.add,
    '+1': Library.plusOne,
    '+2': Library.plusTwo,
    'sample': Library.sample,
    'drop': Library.drop,
};

Input.types.forEach(function (inputType) {
    Library.lookup[inputType] = Library[inputType];
});

})();
