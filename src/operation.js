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

Operation.none = Operation.create('none', function () {
    throw new Error('illegal Operation.none used');
});

Operation.empty = Operation.create('empty', function () {
    return 0;
});


})();
