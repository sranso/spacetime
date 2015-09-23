'use strict';
var Autocomplete = {};
(function () {

Autocomplete.updateFromText = function (grid, original, c, r) {
    var n = +original.text;
    var libraryCell = Library.lookup[original.text];
    if (!libraryCell && original.text !== '' && !isNaN(n)) {
        var libraryCell = Library.literal;
        //======== BEGIN (Operation) ========
        var operation = Operation.create(
                libraryCell.transformation.operation.text,
                libraryCell.transformation.operation.execute
        );
        operation.data = n;
        //======== END (Operation) ========

        var cell = Cell.deepCopy(libraryCell);
        cell.transformation = Transformation.immediate(operation);
        cell.text = original.text;
    } else {
        libraryCell = libraryCell || Library.empty;
        var cell = Cell.deepCopy(libraryCell);
    }

    grid.cells[c][r] = cell;
    return cell;
};

})();
