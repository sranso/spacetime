'use strict';
require('../../test/helper');

log(Fnv1a.startHash);
//=> 2166136261

var array = Convert.stringToArray('a');
hash = Fnv1a.update(Fnv1a.startHash, array, 0, 1);
log(hash);
//=> 3826002220

array = Convert.stringToArray('foobar');
hash = Fnv1a.update(Fnv1a.startHash, array, 0, 'foo'.length);
log(hash);
//=> 2851307223

hash = Fnv1a.update(Fnv1a.startHash, array, 0, 'foobar'.length);
log(hash);
//=> 3214735720

// '0123456789ABCDEF' 10 times
array = Convert.stringToArray('>>0123456789ABCDEF<<');
hash = Fnv1a.startHash;
var i;
for (i = 0; i < 10; i++) {
    hash = Fnv1a.update(hash, array, 2, array.length - 2);
}
log(hash);
//=> 733199925
