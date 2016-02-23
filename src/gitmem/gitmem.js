'use strict';
global.Gitmem = {};
(function () {

Gitmem.create = function () {
    var random = Random.create(Gitmem._randomSeed());

    return {
        random: random,
        store: Store.create(random),
    };
};

Gitmem.load = function (gitmem) {
    global.$Random = gitmem.random;
    global.$Store = gitmem.store;
};

Gitmem._randomSeed = function () {
    var array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    var seed = array[0];
    if (seed !== 0) {
        return seed;
    } else {
        return Gitmem._randomSeed();
    }
};

})();
