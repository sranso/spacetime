'use strict';
var helper = require('../../test/helper');

// Math.random:     91.575ms   9 ns / call
// Random.uint32:   180.529ms  18 ns / call

var i;

console.time('Math.random');
for (i = 0; i < 10000000; i++) {
    Math.random();
}
console.timeEnd('Math.random');

var random = Random.create(1);
console.time('Random.uint32');
for (i = 0; i < 10000000; i++) {
    Random.uint32(random);
}
console.timeEnd('Random.uint32');
