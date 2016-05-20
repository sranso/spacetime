'use strict';
require('../../../test/helper');

global.$table = Table.create(16, Random.create(7961050));
global.$file = new Uint8Array(256);
global.$mold = Mold.create(4, 256);

Constants.initialize();

log(hexHash($table.hashes8, Constants.emptyString));
//=> 9d68933c44f13985b9eb19159da6eb3ff0e574bf
log(Constants.emptyString, hash(''));
//=> 4 4
log(val(Constants.emptyString));
//=>

log(hexHash($table.hashes8, Constants.zero));
//=> c227083464fb9af8955c90d2924774ee50abb547
log(Constants.zero, hash(0));
//=> 260 260
log(val(Constants.zero));
//=> 0

log(hexHash($table.hashes8, Constants.one));
//=> 56a6051ca2b02b04ef92d5150c9ef600403cb1de
log(Constants.one, hash(1));
//=> 24 24
log(val(Constants.one));
//=> 1

log(hexHash($table.hashes8, Constants.emptyTree));
//=> eb3c1ec5e288babdc43edd0205033f2a14bb4c1b
log(numChildren(Constants.emptyTree));
//=> 0
