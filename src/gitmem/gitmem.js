'use strict';
global.GitMem = {};
(function () {

GitMem.create = function () {
    Random.seed(GitMem._randomSeed());

    return {
        store: Store.create(),
    };
};

GitMem.load = function (gitmem) {
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
