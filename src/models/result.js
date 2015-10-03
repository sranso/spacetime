'use strict';
var Result = {};
(function () {

Result.create = function (type, value) {
    return {
        type: type,
        value: value,
        error: null,
    };
};

Result.number = {_: 'number'};
Result.quads = {_: 'quads'};
Result.emptyType = {_: 'empty'};

Result.none = Result.create(Result.emptyType, 0);

Result.empty = Result.create(Result.emptyType, 0);

})();
