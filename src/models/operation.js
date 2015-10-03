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

Operation.cloneWithoutData = function (original) {
    var operation = Operation.create(original.text, original.execute);
    // operation.data = 0;
    return operation;
};

Operation.none = Operation.create('none', function () {
    throw new Error('illegal Operation.none used');
});

Operation.empty = Operation.create('empty', function () {
    return Result.empty;
});

Operation.input = Operation.create('input', function (cell) {
    var inputType = cell.operation.data;
    if (cell.input[0]) {
        return Result.create(cell.input[0][inputType]);
    } else {
        return Result.empty;
    }
});


})();
