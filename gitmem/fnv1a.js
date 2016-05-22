'use strict';
global.Fnv1a = {};
(function () {

Fnv1a.start = 2166136261;

Fnv1a.update = function (hash, array, start, end) {
    var i;
    for (i = start; i < end; i++) {
        hash = hash ^ array[i];
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

})();
