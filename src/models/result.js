'use strict';
var Result = {};
(function () {

Result.create = function (value, error) {
    return {
        value: value,
        empty: false,
        error: error || null,
    };
};

Result.none = Result.create(0, 'Result.none');

Result.empty = Result.create(0);
Result.empty.empty = true;

})();
