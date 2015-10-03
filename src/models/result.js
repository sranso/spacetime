'use strict';
var Result = {};
(function () {

Result.create = function (value, error) {
    return {
        value: value,
        type: Result.number,
        error: error || null,
    };
};

Result.number = {_: 'number'};
Result.emptyType = {_: 'empty'};

Result.none = Result.create(0, 'Result.none');
Result.none.type = Result.emptyType;

Result.empty = Result.create(0);
Result.empty.type = Result.emptyType;

})();
