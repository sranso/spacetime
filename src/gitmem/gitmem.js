'use strict';
global.GitMem = {};
(function () {

GitMem.setup = function () {
    Random.seed(GitMem._randomSeed());
    global.$Store = Store.create();
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
