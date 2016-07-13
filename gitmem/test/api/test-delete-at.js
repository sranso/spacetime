'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(256, Random.create(9075829));
global.$mold = Mold.create(32, 2048);

Constants.initialize(-1, 4);
ArrayTree.initialize(4);

var arrayOf = function (nums) {
    var array = ArrayTree.$zeros[0];
    var i;
    for (i = 0; i < nums.length; i++) {
        array = push(array, Constants.$positive[nums[i]]);
    }
    return array;
};

var array0 = arrayOf([]);
var array1 = arrayOf([0]);

var deletedArray0 = deleteAt(array1, 0);
log(deletedArray0 === array0);
//=> true

var array2 = arrayOf([0, 1]);
var deletedArray1 = deleteAt(array2, 0);
log(len(deletedArray1));
//=> 1
log(val(getAt(deletedArray1, 0)));
//=> 1
log(deletedArray1 === arrayOf([1]));
//=> true

var array3 = arrayOf([0, 1, 2]);
var deletedArray2 = deleteAt(array3, 1);
log(deletedArray2 === arrayOf([0, 2]));
//=> true

var array4 = arrayOf([0, 1, 2, 3]);
var deletedArray3 = deleteAt(array4, 3);
log(deletedArray3 === arrayOf([0, 1, 2]));
//=> true

var emptyTree = $[Constants.emptyTree];
var treeArray1 = push(array0, emptyTree);
var treeArray2 = push(treeArray1, emptyTree);
var treeArray3 = push(treeArray2, emptyTree);

var deletedTreeArray2 = deleteAt(treeArray3, 1);
log(deletedTreeArray2 === treeArray2);
//=> true

var array5 = arrayOf([0, 1, 2, 3, 4]);
//=> true
var deletedArray4 = deleteAt(array5, 3);
log(len(deletedArray4));
//=> 4
log(deletedArray4 === arrayOf([0, 1, 2, 4]));
//=> true
log(deleteAt(array5, 4) === arrayOf([0, 1, 2, 3]));
//=> true

var array6 = arrayOf([0, 1, 2, 3, 4, 0]);
var deletedArray5 = deleteAt(array6, 2);
log(len(deletedArray5));
//=> 5
log(deletedArray5 === arrayOf([0, 1, 3, 4, 0]));
//=> true
log(deleteAt(array6, 4) === arrayOf([0, 1, 2, 3, 0]));
//=> true

var array9 = arrayOf([0, 1, 2, 3, 4, 3, 2, 1, 0]);
log(deleteAt(array9, 4) === arrayOf([0, 1, 2, 3, 3, 2, 1, 0]));
//=> true
log(deleteAt(array9, 8) === arrayOf([0, 1, 2, 3, 4, 3, 2, 1]));
//=> true

var nums17 = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 2, 2, 1, 1, 3, 3, 4];
var array17 = arrayOf(nums17);
log(deleteAt(array17, 16) === arrayOf(nums17.slice(0, 16)));
//=> true
log(deleteAt(array17, 0) === arrayOf(nums17.slice(1)));
//=> true

var nums33 = nums17.concat(nums17.slice(1));
var array33 = arrayOf(nums33);
log(deleteAt(array33, 32) === arrayOf(nums33.slice(0, 32)));
//=> true
nums33.splice(8, 1);
var deletedArray32 = deleteAt(array33, 8);
log(len(deletedArray32));
//=> 32
log(deletedArray32 === arrayOf(nums33));
//=> true
