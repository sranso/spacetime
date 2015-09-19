'use strict';
var Operation = {};
(function () {

Operation.create = function (text, execute) {
    return {
        text: text,
        execute: execute,
        data: 0,
    };
};

Operation.clone = function (oldOperation) {
    var operation = Operation.create(oldOperation.text, oldOperation.execute);
    // operation.data = oldOperation.data;
    return operation;
};

Operation.none = Operation.create('none', function (cell) {
    var firstColumn = cell.grid.cells[0];
    return firstColumn[firstColumn.length - 1].result;
});

Operation.add = Operation.create('add', function (cell, a, b) {
    return a.result + b.result;
});

Operation.plusOne = Operation.create('plusOne', function (cell, a) {
    return a.result + 1;
});

Operation.double = Operation.create('double', function (cell, a) {
    return a.result * 2;
});

Operation.literal = Operation.create('literal', function (cell) {
    return +cell.operation.data;
});

})();
