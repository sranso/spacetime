// Results:
//
// copyWithin: 3375.065ms / 500000 = 6800 ns/loop
// loop: 74.605ms         / 500000 =  150 ns/loop (2.2% of copyWithin)
//
// loopDirtyType was the same as loop

var a;

var setupA = function () {
    a = new Uint8Array(1200);
    var i;
    var j = 900;
    for (i = 0; i < 100; i++) {
        a[j + i] = (i * 2) & 255;
    }
};

setupA();

console.time('copyWithin');
var n;
for (n = 0; n < 500000; n++) {
    a.copyWithin(200, 900, 1000);
}
console.timeEnd('copyWithin');

setupA();

console.time('loop');
var n;
for (n = 0; n < 500000; n++) {
    var j = 200;
    var k = 900;
    var len = 100;
    var i;
    for (i = 0; i < len; i++) {
        a[j + i] = a[k + i];
    }
}
console.timeEnd('loop');

setupA();
a.nextOffset = 300;

//console.time('loopDirtyType');
//var n;
//for (n = 0; n < 500000; n++) {
//    var j = 200;
//    var k = 900;
//    var len = 100;
//    var i;
//    for (i = 0; i < len; i++) {
//        a[j + i] = a[k + i];
//    }
//}
//console.timeEnd('loopDirtyType');
