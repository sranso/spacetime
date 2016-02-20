'use strict';
global.GitMem = {};
(function () {

GitMem.create = function () {
    var random = Random.create(GitMem._randomSeed());

    return {
        random: random,
        store: Store.create(random),
    };
};

GitMem.load = function (gitmem) {
    global.$Random = gitmem.random;
    global.$Store = gitmem.store;
};

GitMem._randomSeed = function () {
    var array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    var seed = array[0];
    if (seed !== 0) {
        return seed;
    } else {
        return GitMem._randomSeed();
    }
};

})();
