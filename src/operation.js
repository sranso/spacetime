'use strict';
var Operation = {};
(function () {

Operation.create = function (text, execute) {
    return {
        text: text,
        execute: execute,
    };
};

Operation.none = Operation.create('none', function () { return null });

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
    return +cell.text;
});

})();
