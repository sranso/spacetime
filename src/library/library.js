'use strict';
var Library = {};
(function () {

var literalNumber = Operation.create('literalNumber', function (cell) {
    return Result.create(Result.number, +cell.operation.data);
});

Library.empty = Cell.deepCopy(Cell.empty);

Library.literalNumber = (function () {
    var cell = Cell.create();
    // cell.group = Group.none; // TODO: groups for all library?
    cell.text = '<literalNumber>';
    cell.args = Cell.noArgs;
    cell.transformation = Transformation.immediate(literalNumber);

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

var inputText = {
    mouseX: 'mouse x',
    mouseY: 'mouse y',
    mouseDown: 'mouse down',
};

Input.types.forEach(function (inputType) {
    var cell = Cell.create();
    cell.text = inputText[inputType];
    cell.args = Cell.noArgs;
    cell.transformation = Transformation.input(inputType);

    Library[inputType] = cell;
});

Library.all = [
    Library.sample,
    Library.drop,
].concat(MathLibrary.all).concat(QuadsLibrary.all);

Input.types.forEach(function (inputType) {
    Library.all.push(Library[inputType]);
});

Library.lookup = {};
Library.all.forEach(function (libraryCell) {
    Library.lookup[libraryCell.text] = libraryCell;
});

})();
