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
    var cell = Cell.create();
    cell.args = Cell.autoArgs[0];
    cell.transformation = Transformation.immediate(baseOperation.literal);
    // cell.group = Group.none; // TODO: groups for all library?
    cell.text = '<literal>';

    return cell;
})();

Library.plusOne = (function () {
    var cell = Cell.create();
    cell.args = Cell.autoArgs[2];
    cell.transformation = Transformation.linear(baseOperation.plusOne);
    cell.text = '+1';

    return cell;
})();

Library.add = (function () {
    var cell = Cell.create();
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(baseOperation.add);
    cell.text = '+';

    return cell;
})();

Library.identity = (function () {
    var cell = Cell.create();
    cell.args = Cell.autoArgs[2];
    cell.transformation = Transformation.identity;
    cell.text = 'id';

    return cell;
})();

Library.plusTwo = (function () {
    var column = [
        Cell.deepCopy(Library.plusOne),
        Cell.deepCopy(Library.plusOne),
    ];

    var cell = Cell.create();
    cell.grid = Grid.create();
    cell.args = Cell.autoArgs[2];
    cell.transformation = Transformation.expand;
    cell.text = '+2';

    cell.grid.cells[0] = column;
    cell.grid.layer = 'over';

    var area = Area.create();
    area.coords = [0, 0, 0, 1];

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
