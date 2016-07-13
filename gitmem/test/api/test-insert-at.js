'use strict';
require('../../../test/helper');

global.$file = new Uint8Array(512);
global.$ = new Uint32Array(32);
global.$.nextIndex = 0;
global.$table = Table.create(512, Random.create(8829185));
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

var num0 = Constants.$positive[0];
var num1 = Constants.$positive[1];
var insertedArray1 = insertAt(array0, 0, num1);
log(len(insertedArray1));
//=> 1
log(val(getAt(insertedArray1, 0)));
//=> 1
log(insertedArray1 === arrayOf([1]));
//=> true

var array3 = arrayOf([0, 2, 3]);
log(insertAt(array3, 0, num1) === arrayOf([1, 0, 2, 3]));
//=> true
log(insertAt(array3, 3, num1) === arrayOf([0, 2, 3, 1]));
//=> true
log(insertAt(array3, 1, num1) === arrayOf([0, 1, 2, 3]));
//=> true

var emptyTree = $[Constants.emptyTree];
var treeArray1 = push(array0, emptyTree);
var treeArray2 = push(treeArray1, emptyTree);
var treeArray3 = push(treeArray2, emptyTree);
log(insertAt(treeArray2, 1, emptyTree) === treeArray3);
//=> true

var array4 = arrayOf([0, 2, 3, 4]);
var insertedArray5 = insertAt(array4, 2, num1);
log(len(insertedArray5));
//=> 5
log(insertedArray5 === arrayOf([0, 2, 1, 3, 4]));
//=> true
log(insertAt(array4, 4, num1) === arrayOf([0, 2, 3, 4, 1]));
//=> true

var array5 = arrayOf([0, 2, 3, 4, 0]);
var insertedArray6 = insertAt(array5, 3, num1);
log(len(insertedArray6));
//=> 6
log(insertedArray6 === arrayOf([0, 2, 3, 1, 4, 0]));
//=> true
log(insertAt(insertedArray6, 5, num1) === arrayOf([0, 2, 3, 1, 4, 1, 0]));
//=> true

var array7 = arrayOf([0, 2, 3, 4, 3, 2, 0]);
log(insertAt(array7, 0, num1) === arrayOf([1, 0, 2, 3, 4, 3, 2, 0]));
//=> true
log(insertAt(array7, 4, num1) === arrayOf([0, 2, 3, 4, 1, 3, 2, 0]));
//=> true

var nums8 = [0, 2, 3, 4, 4, 3, 2, 0];
var array8 = arrayOf(nums8);
var nums9 = nums8.slice();
nums9.splice(6, 0, 1);
var insertedArray9 = insertAt(array8, 6, num1);
log(len(insertedArray9));
//=> 9
log(insertedArray9 === arrayOf(nums9));
//=> true
insertedArray9 = insertAt(array8, 8, num1);
log(len(insertedArray9));
//=> 9
log(insertedArray9 === arrayOf(nums8.concat(1)));
//=> true


var nums16 = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 2, 2, 1, 1, 3, 3];

var array16 = arrayOf(nums16);
var nums17 = nums16.slice();
nums17.splice(9, 0, 1);
var insertedArray17 = insertAt(array16, 9, num1);
log(len(insertedArray17));
//=> 17
log(insertedArray17 === arrayOf(nums17));
//=> true
log(insertAt(array16, 0, num1) === arrayOf([1].concat(nums16)));
//=> true
log(insertAt(array16, 16, num1) === arrayOf(nums16.concat(1)));
//=> true

var nums20 = nums16.concat([2, 2, 4, 4]);
var array20 = arrayOf(nums20);
var nums21 = nums20.slice();
nums21.splice(17, 0, 1);
var insertedArray21 = insertAt(array20, 17, num1);
log(len(insertedArray21));
//=> 21
log(insertedArray21 === arrayOf(nums21));
//=> true
log(insertAt(array20, 21, num1) === arrayOf(nums20.concat([1])));
//=> true

var nums32 = nums20.concat([4, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 4]);
var array32 = arrayOf(nums32);
var nums33 = nums32.slice();
nums33.splice(13, 0, 1);
var insertedArray33 = insertAt(array32, 13, num1);
log(len(insertedArray33));
//=> 33
log(insertedArray33 === arrayOf(nums33));
//=> true
log(insertAt(array20, 21, num1) === arrayOf(nums20.concat([1])));
//=> true

var nums64 = nums32.concat(nums32);
var array64 = arrayOf(nums64);
var nums65 = nums64.slice();
nums65.splice(40, 0, 1);
var insertedArray65 = insertAt(array64, 40, num1);
log(len(insertedArray65));
//=> 65
log(insertedArray65 === arrayOf(nums65));
//=> true
log(insertAt(array64, 0, num1) === arrayOf([1].concat(nums64)));
//=> true
log(insertAt(array64, 65, num1) === arrayOf(nums64.concat([1])));
//=> true
