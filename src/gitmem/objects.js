'use strict';
global.Objects = {};
(function () {

Objects.isFullObject = 1;

Objects.create = function (n) {
    var table = new Array(n);
    var i;
    for (i = 0; i < n; i++) {
        table[i] = null;
    }

    return {
        table: table,
        unpacked: [],
        packed: [],
        nextUnpackedIndex: 0,
        nextPackedIndex: 0,
    };
};

})();
