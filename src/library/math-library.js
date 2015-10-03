'use strict';
var MathLibrary = {};
(function () {

var baseOperation = {};

baseOperation.plusOne = Operation.create('plusOne', function (cell, a) {
    var value = a.result.type === Result.number ? a.result.value : 0;
    return Result.create(value + 1);
});

baseOperation.add = Operation.create('add', function (cell, a, b) {
    var aValue = a.result.type === Result.number ? a.result.value : 0;
    var bValue = b.result.type === Result.number ? b.result.value : 0;
    return Result.create(aValue + bValue);
});

MathLibrary.plusOne = (function () {
    var cell = Cell.create();
    cell.text = '+1';
    cell.args = Cell.autoArgs[2];
    cell.transformation = Transformation.linear(baseOperation.plusOne);

    return cell;
})();

MathLibrary.add = (function () {
    var cell = Cell.create();
    cell.text = '+';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(baseOperation.add);

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

    cell.grid.areas.push(area);

    return cell;
})();

MathLibrary.lookup = [
    ['+1', MathLibrary.plusOne],
    ['+2', MathLibrary.plusTwo],
    ['+', MathLibrary.add],
];

})();
