'use strict';
require('../../test/helper');

log(Fnv1a.start);
//=> 2166136261

var array = Convert.stringToArray('a');
var fnv1a = Fnv1a.update(Fnv1a.start, array, 0, 1);
log(fnv1a);
//=> 3826002220

array = Convert.stringToArray('foobar');
fnv1a = Fnv1a.update(Fnv1a.start, array, 0, 'foo'.length);
log(fnv1a);
//=> 2851307223

fnv1a = Fnv1a.update(Fnv1a.start, array, 0, 'foobar'.length);
log(fnv1a);
//=> 3214735720

// '0123456789ABCDEF' 10 times
array = Convert.stringToArray('>>0123456789ABCDEF<<');
fnv1a = Fnv1a.start;
var i;
for (i = 0; i < 10; i++) {
    fnv1a = Fnv1a.update(fnv1a, array, 2, array.length - 2);
}
log(fnv1a);
//=> 733199925
