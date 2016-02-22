'use strict';
global.Heap = {};
(function () {

Heap.create = function (capacity) {
    var array = new Uint8Array(capacity);
    return {
        array: array,
        capacity: capacity,
        nextOffset: 0,
    };
};

})();
