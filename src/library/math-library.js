'use strict';
var MathLibrary = {};
(function () {

var plusOne = Operation.create('plusOne', function (cell, a) {
    var value = a.result.type === Result.number ? a.result.value : 0;
    return Result.create(Result.number, value + 1);
});

var add = Operation.create('add', function (cell, a, b) {
    var aValue = a.result.type === Result.number ? a.result.value : 0;
    var bValue = b.result.type === Result.number ? b.result.value : 0;
    return Result.create(Result.number, aValue + bValue);
});

var not = Operation.create('not', function (cell, a) {
    var aValue = a.result.type === Result.number ? a.result.value : 0;
    return Result.create(Result.number, !aValue);
});

MathLibrary.plusOne = (function () {
    var cell = Cell.create();
    cell.text = '+1';
    cell.args = Cell.autoArgs[2];
    cell.transformation = Transformation.linear(plusOne);

    return cell;
})();

MathLibrary.add = (function () {
    var cell = Cell.create();
    cell.text = '+';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(add);

    return cell;
})();

MathLibrary.not = (function () {
    var cell = Cell.create();
    cell.text = '!';
    cell.args = Cell.autoArgs[2];
    cell.transformation = Transformation.linear(not);

    return cell;
})();

MathLibrary.plusTwo = (function () {
    var column = [
        Cell.deepCopy(MathLibrary.plusOne),
        Cell.deepCopy(MathLibrary.plusOne),
    ];

    var cell = Cell.create();
    cell.text = '+2';
    cell.transformation = Transformation.expand;
    cell.args = Cell.autoArgs[2];

    cell.grid = Grid.create();
    cell.grid.cells[0] = column;
    cell.grid.layer = Grid.over;

    var area = Area.create();
    area.coords = [0, 0, 0, 1];
    area.group = Group.create();
    area.group.remember = true;

    cell.grid.areas.push(area);

    return cell;
})();

MathLibrary.all = [
    MathLibrary.plusOne,
    MathLibrary.plusTwo,
    MathLibrary.add,
    MathLibrary.not,
];

})();
