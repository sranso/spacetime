'use strict';
global.Result = {};
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
Result.noneType = {_: 'none'};

Result.none = Result.create(Result.noneType, 0);

Result.empty = Result.create(Result.emptyType, 0);

})();
