'use strict';
global.Objects = {};
(function () {

Objects.create = function (n) {
    var table = new Array(n);
    var i;
    for (i = 0; i < n; i++) {
        table[i] = null;
    }

    return {
        table: table,
    };
};

})();
