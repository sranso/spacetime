'use strict';
var helper = require('../helper');

// Math.random:  91.575ms   9 ns / call
// Random.rand: 180.529ms  18 ns / call

var i;

console.time('Math.random');
for (i = 0; i < 10000000; i++) {
    Math.random();
}
console.timeEnd('Math.random');

console.time('Random.rand');
for (i = 0; i < 10000000; i++) {
    Random.rand();
}
console.timeEnd('Random.rand');
