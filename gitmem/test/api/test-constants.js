'use strict';
require('../../../test/helper');

global.$table = Table.create(32, Random.create(7961050));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(4, 256);

Constants.initialize(-6, 10);

log(Constants.positive.length);
//=> 11
log(Constants.negative.length);
//=> 7

log(hexHash($table.hashes8, Constants.positive[0]));
//=> c227083464fb9af8955c90d2924774ee50abb547
log(Constants.positive[0], hash(0));
//=> 516 516
log(val(Constants.positive[0]));
//=> 0

log(hexHash($table.hashes8, Constants.positive[1]));
//=> 56a6051ca2b02b04ef92d5150c9ef600403cb1de
log(Constants.positive[1], hash(1));
//=> 44 44
log(val(Constants.positive[1]));
//=> 1

log(hexHash($table.hashes8, Constants.positive[10]));
//=> 9a037142aa3c1b4c490e1a38251620f113465330
log(Constants.positive[10], hash(10));
//=> 344 344
log(val(Constants.positive[10]));
//=> 10

log(hexHash($table.hashes8, Constants.negative[1]));
//=> d7d17fcbef95ca19081c4cc5e97cbc592cc7081f
log(Constants.negative[1], hash(-1));
//=> 600 600
log(val(Constants.negative[1]));
//=> -1

log(hexHash($table.hashes8, Constants.negative[6]));
//=> 52e1a7f43a2a66ac9a451b07aca4c54c6ebb44d8
log(Constants.negative[6], hash(-6));
//=> 280 280
log(val(Constants.negative[6]));
//=> -6

log(hexHash($table.hashes8, Constants.emptyString));
//=> 9d68933c44f13985b9eb19159da6eb3ff0e574bf
log(Constants.emptyString, hash(''));
//=> 4 4
log(val(Constants.emptyString));
//=>

log(hexHash($table.hashes8, Constants.emptyTree));
//=> eb3c1ec5e288babdc43edd0205033f2a14bb4c1b
log(numChildren(Constants.emptyTree));
//=> 0

log(hexHash($table.hashes8, Constants.zeroHash));
//=> 0000000000000000000000000000000000000000
log($table.data8[Table.typeOffset(Constants.zeroHash)], Type.pending);
//=> 1 1
