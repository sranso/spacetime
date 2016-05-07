'use strict';
global.Autocomplete = {};
(function () {

Autocomplete.updateFromText = function (grid, original, c, r) {
    var n = +original.text;
    var libraryCell = Library.lookup[original.text];
    if (libraryCell) {
        var cell = Cell.deepCopy(libraryCell);
    } else if (!libraryCell && original.text !== '' && !isNaN(n)) {
        var libraryCell = Library.literalNumber;
        var operation = Operation.cloneWithoutData(libraryCell.transformation.operation);
        operation.data = n;

        var cell = Cell.deepCopy(libraryCell);
        cell.transformation = Transformation.immediate(operation);
        cell.text = original.text;
    } else {
        libraryCell = Library.empty;
        var cell = Cell.deepCopy(libraryCell);
        cell.text = original.text;
    }

    grid.cells[c][r] = cell;
    return cell;
};

})();
