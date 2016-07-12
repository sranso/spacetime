'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(64, Random.create(71000852));
global.$mold = Mold.create(32, 2048);

Constants.initialize(-1, 1);
ArrayTree.initialize(4);

var num0 = Constants.$positive[0];
var emptyTree = $[Constants.emptyTree];

var array0 = ArrayTree.$zeros[0];
log(len(take(array0, 0)));
//=> 0
var array1 = push(array0, num0);
log(len(take(array1, 0)));
//=> 0
var array2 = push(array1, Constants.$positive[1]);
var array3 = push(array2, num0);

var takeArray2 = take(array3, 2);
log(takeArray2 === array2);
//=> true
log(len(takeArray2));
//=> 2
log(val(getAt(takeArray2, 0)), val(getAt(takeArray2, 1)));
//=> 0 1

var treeArray1 = push(array0, emptyTree);
var treeArray3 = push(push(treeArray1, emptyTree), emptyTree);

var takeArray1 = take(treeArray3, 1);
log(takeArray1 === treeArray1);
//=> true
log(len(takeArray1));
//=> 1

var array5 = push(push(array3, num0), num0);

var takeArray3 = take(array5, 3);
log(takeArray3 === array3);
//=> true

var array6 = push(array5, num0);
log(take(array6, 5) === array5);
//=> true
log(take(array6, 2) === array2);
//=> true

var array9 = push(push(push(array6, num0), num0), num0);
log(take(array9, 6) === array6);
//=> true
log(take(array9, 3) === array3);
//=> true

var array = array9;
var i;
for (i = 9; i < 16; i++) {
    array = push(array, num0);
}

var array16 = array;
log(take(array16, 9) === array9);
//=> true

var array17 = push(array16, num0);
log(take(array17, 17) === array17);
//=> true
log(take(array17, 16) === array16);
//=> true
log(take(array17, 9) === array9);
//=> true

var array = array17;
var i;
for (i = 17; i < 21; i++) {
    array = push(array, num0);
}

var array21 = array;
log(take(array21, 17) === array17);
//=> true
log(take(array21, 5) === array5);
//=> true

var array = array21;
var i;
for (i = 21; i < 33; i++) {
    array = push(array, num0);
}

var array33 = array;
log(take(array33, 21) === array21);
//=> true
log(take(array33, 16) === array16);
//=> true
log(take(array33, 2) === array2);
//=> true
