'use strict';
var Library = {};
(function () {

var baseOperation = {};

baseOperation.literalNumber = Operation.create('literalNumber', function (cell) {
    return Result.create(+cell.operation.data);
});

Library.empty = Cell.deepCopy(Cell.empty);

Library.literalNumber = (function () {
    var cell = Cell.create();
    // cell.group = Group.none; // TODO: groups for all library?
    cell.text = '<literalNumber>';
    cell.args = Cell.noArgs;
    cell.transformation = Transformation.immediate(baseOperation.literalNumber);
    cell.dynamicHistory = [cell];

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

Input.types.forEach(function (inputType) {
    var cell = Cell.create();
    cell.text = inputType;
    cell.args = Cell.noArgs;
    cell.transformation = Transformation.input(inputType);

    MathLibrary[inputType] = cell;
});

Library.lookup = {
    'sample': Library.sample,
    'drop': Library.drop,
};

Input.types.forEach(function (inputType) {
    Library.lookup[inputType] = Library[inputType];
});

MathLibrary.lookup.forEach(function (ml) {
    Library[ml[0]] = ml[1];
});

})();
