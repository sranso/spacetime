// Results:
//
// copyWithin: 3375.065ms / 500000 = 68.  ns/B
// loop: 74.605ms         / 500000 =  1.5 ns/B (2.2% of copyWithin)
//
// loopDirtyType and loopWithProperty were the same as loop

var runTypedArrayMethodsPerformance = function () {
    var a;

    var initializeA = function () {
        a = new Uint8Array(1200);
        var i;
        var j = 900;
        for (i = 0; i < 100; i++) {
            a[j + i] = (i * 2) & 255;
        }
    };

    initializeA();

    console.time('copyWithin');
    var n;
    for (n = 0; n < 500000; n++) {
        a.copyWithin(200, 900, 1000);
    }
    console.timeEnd('copyWithin');

    initializeA();

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

    initializeA();
    a.nextOffset = 300;

    console.time('loopDirtyType');
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
    console.timeEnd('loopDirtyType');

    initializeA();

    var object = {a: a};

    console.time('loopWithProperty');
    var n;
    for (n = 0; n < 500000; n++) {
        var j = 200;
        var k = 900;
        var len = 100;
        var i;
        for (i = 0; i < len; i++) {
            object.a[j + i] = object.a[k + i];
        }
    }
    console.timeEnd('loopWithProperty');
};
