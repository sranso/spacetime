'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(128, Random.create(1118295));
global.$mold = Mold.create(32, 2048);

Constants.initialize(-20, 20);
ArrayTree.initialize(4);

var array0 = ArrayTree.$zeros[0];
var array2 = push(push(array0, Constants.$positive[0]), Constants.$positive[1]);

var setArray2 = setAt(array2, 1, Constants.$negative[1]);
var at1 = getAt(setArray2, 1);
log(at1 === Constants.$negative[1]);
//=> true
log(val(at1));
//=> -1

var i;
var array = array2;
for (i = 2; i < 5; i++) {
    array = push(array, Constants.$positive[i]);
}
var array5 = array;

var setArray5 = setAt(array5, 3, Constants.$negative[3]);
log(val(getAt(setArray5, 3)));
//=> -3
setArray5 = setAt(setArray5, 4, Constants.$negative[4]);
log(val(getAt(setArray5, 4)));
//=> -4

array = array5;
for (i = 5; i < 21; i++) {
    array = push(array, Constants.$positive[i]);
}
var array21 = array;

var setArray21 = setAt(array21, 0, Constants.$negative[20]);
log(val(getAt(setArray21, 0)));
//=> -20
setArray21 = setAt(setArray21, 5, Constants.$negative[5]);
log(val(getAt(setArray21, 5)));
//=> -5
setArray21 = setAt(setArray21, 9, Constants.$negative[9]);
log(val(getAt(setArray21, 9)));
//=> -9
setArray21 = setAt(setArray21, 15, Constants.$negative[15]);
log(val(getAt(setArray21, 15)));
//=> -15
setArray21 = setAt(setArray21, 17, Constants.$negative[17]);
log(val(getAt(setArray21, 17)));
//=> -17
setArray21 = setAt(setArray21, 20, Constants.$negative[20]);
log(val(getAt(setArray21, 20)));
//=> -20
