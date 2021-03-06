'use strict';
global.GitMem = {};
(function () {

GitMem.initialize = function () {
    global.$file = new Uint8Array(512);
    global.$pack = new Uint8Array(4096);
};

GitMem.create = function () {
    global.$ = new Uint32Array(65536);
    $.nextIndex = 0;

    var random = Random.create(GitMem._randomSeed());
    global.$table = Table.create(262144, random); // 11.1 MB

    // 16384 is enough for 5 molds/day for the next ~9 years
    // 140 is higher than average tree size
    global.$mold = Mold.create(16384, 140 * 16384); // 2.8 MB

    Constants.initialize(-2000, 2000);
    Commit.initialize();

    // 17 levels is enough for 9 years of data at 60 fps
    ArrayTree.initialize(17);

    return {
        $: $,
        $table: $table,
        $mold: $mold,
        'Constants.$positive': Constants.$positive,
        'Constants.$negative': Constants.$negative,
        'ArrayTree.$zeros': ArrayTree.$zeros,
    };
};

GitMem.load = function (gitmem) {
    global.$ = gitmem.$;
    global.$table = gitmem.$table;
    global.$mold = gitmem.$mold;
    Constants.$positive = gitmem['Constants.$positive'];
    Constants.$negative = gitmem['Constants.$negative'];
    ArrayTree.$zeros = gitmem['ArrayTree.$zeros'];
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
