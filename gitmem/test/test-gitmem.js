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

log(hexHash($table.hashes8, Constants.positive[1000]));
//=> e37d32abba426c06b752a5e53f48c595c84e9270
log(hexHash($table.hashes8, Constants.negative[1000]));
//=> 889416e072d65f95c4a307be998e78b918b03f5b
log(hexHash($table.hashes8, Commit.zero));
//=> cf2f19e7e3692eadb7e6e9e37f63d29f8b5ced7c


global.$table = null;
global.$mold = null;

GitMem.load(gitmem);

log($table.n);
//=> 262144
log($mold.n);
//=> 16384
