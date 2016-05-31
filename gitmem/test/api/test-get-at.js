'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(128, Random.create(1118295));
global.$mold = Mold.create(32, 2048);

Constants.initialize(-1, 20);
ArrayTree.initialize(4);

var array0 = ArrayTree.$zeros[0];
var array2 = push(push(array0, Constants.$positive[0]), Constants.$positive[1]);
var at0 = getAt(array2, 0);
log(at0 === Constants.$positive[0]);
//=> true
log(val(at0));
//=> 0
log(val(getAt(array2, 1)));
//=> 1

var i;
var array = array2;
for (i = 2; i < 5; i++) {
    array = push(array, Constants.$positive[i]);
}
var array5 = array;

log(val(getAt(array5, 1)));
//=> 1
log(val(getAt(array5, 3)));
//=> 3
log(val(getAt(array5, 4)));
//=> 4

array = array5;
for (i = 5; i < 21; i++) {
    array = push(array, Constants.$positive[i]);
}
var array21 = array;

log(val(getAt(array21, 0)));
//=> 0
log(val(getAt(array21, 3)));
//=> 3
log(val(getAt(array21, 5)));
//=> 5
log(val(getAt(array21, 8)));
//=> 8
log(val(getAt(array21, 15)));
//=> 15
log(val(getAt(array21, 17)));
//=> 17
log(val(getAt(array21, 20)));
//=> 20
