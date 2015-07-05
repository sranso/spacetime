'use strict';
var Series = {};
(function () {

Series.create = function () {
    return {
        id: Main.newId(),
        stretches: [],
        actualLength: 0,
        targetLengthBy: null,
    };
};

})();
