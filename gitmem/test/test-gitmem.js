'use strict';
require('../../test/helper');

var random = 0;
var getRandomValues = function (array) {
    array[0] = random;
    random++;
};
global.crypto = {getRandomValues: getRandomValues};

log(GitMem._randomSeed() !== 0);
//=> true
log(GitMem._randomSeed() !== GitMem._randomSeed());
//=> true


GitMem.initialize();

log($file.length);
//=> 4096
log($pack.length);
//=> 4096

var gitmem = GitMem.create();

log(gitmem.$.length);
//=> 65536
log(gitmem.$.nextIndex);
//=> 6
log(gitmem.$table.n);
//=> 262144
log(gitmem.$mold.n);
//=> 16384
log(gitmem['Constants.$positive'].length);
//=> 1001
log(gitmem['Constants.$negative'].length);
//=> 1001

log(hexHash($table.hashes8, Constants.$positive[1000]));
//=> e37d32abba426c06b752a5e53f48c595c84e9270
log(hexHash($table.hashes8, Constants.$negative[1000]));
//=> 889416e072d65f95c4a307be998e78b918b03f5b
log(hexHash($table.hashes8, $[Commit.zero]));
//=> cf2f19e7e3692eadb7e6e9e37f63d29f8b5ced7c


global.$ = null;
global.$table = null;
global.$mold = null;
Constants.$positive = null;
Constants.$negative = null;

GitMem.load(gitmem);

log($ === gitmem.$);
//=> true
log($table === gitmem.$table);
//=> true
log($mold === gitmem.$mold);
//=> true
log(Constants.$positive === gitmem['Constants.$positive']);
//=> true
log(Constants.$negative === gitmem['Constants.$negative']);
//=> true
