'use strict';
global.GitMem = {};
(function () {

GitMem.initialize = function () {
    global.$file = new Uint8Array(4096);
    global.$pack = new Uint8Array(4096);
};

GitMem.create = function () {
    var random = Random.create(GitMem._randomSeed());
    global.$table = Table.create(262144, random); // 11.1 MB

    // 16384 is enough for 5 molds/day for the next ~9 years
    // 140 is higher than average tree size
    global.$mold = Mold.create(16384, 140 * 16384); // 2.8 MB

    Constants.initialize(-1000, 1000);
    Commit.initialize();

    return {
        table: $table,
        mold: $mold,
    };
};

GitMem.load = function (gitmem) {
    global.$table = gitmem.table;
    global.$mold = gitmem.mold;
};

GitMem._randomSeed = function () {
    var array = new Uint32Array(1);
    global.crypto.getRandomValues(array);
    var seed = array[0];
    if (seed !== 0) {
        return seed;
    } else {
        return GitMem._randomSeed();
    }
};

})();
