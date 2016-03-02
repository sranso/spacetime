// Results:
//
// returnArray: 856.469ms           (8.6 ns / loop)
// returnArray: 951.054ms (Canary)  (9.5 ns / loop)
//
// setRet: 156.074ms                (1.6 ns / loop   18% of the time)
// setRet: 152.373ms (Canary)       (1.5 ns / loop   16% of the time)
//
// returnArrayCopy: 1598.708ms      (160 ns / loop)
// setRetCopy: 1505.991ms           (151 ns / loop   94% of the time)
//
// setRetArray: 312.050ms           (3.1 ns / loop   36% of the time)
// mutateArray: 287.234ms           (2.9 ns / loop   34% of the time)
// mutateArrayReturned: 289.892ms   (2.9 ns / loop   34% of the time)
//
// setRetWithBogusReturn: 151.797ms
// returnArrayDestructure: 7689.583ms (Canary) (77 ns/loop 8x slower)
// returnArrayClosure: 492.624ms
// setRetClosure: 353.977ms
//
// setting a value on a global may take 18% of the time, but
// if it's done alongside a Sha1.hash, it's not significant:
//     tiny hash:   790 ns (791.6 / 798.6 == 99.1% of the time)
//     small hash: 3900 ns (791.6 / 798.6 == 99.8% of the time)


var returnArray = function (n) {
    return [n + 5, n + 32];
};

var ret = {
    x: 0,
    y: 0,
};

var setRet = function (n) {
    ret.x = n + 5;
    ret.y = n + 32;
};

var mutateArray = function (n, array) {
    array[0] = n + 5;
    array[1] = n + 32;
};

var retArray = [-1, -1];

var setRetArray = function (n) {
    retArray[0] = n + 5;
    retArray[1] = n + 32;
    return retArray;
};

var mutateArrayReturned = function (n, array) {
    array[0] = n + 5;
    array[1] = n + 32;
    return array;
};

var bogusReturn = [5, 32];

var setRetWithBogusReturn = function (n) {
    ret.x = n + 5;
    ret.y = n + 32;
    return bogusReturn;
};

var useReturnArray = function () {
    console.time('returnArray');
    var i;
    for (i = 0; i < 100000000; i++) {
        var r = returnArray(i);
        var x = r[0];
        var y = r[1];
        var z = x + y;
    }
    console.timeEnd('returnArray');
};

var useSetRet = function () {
    console.time('setRet');
    var i;
    for (i = 0; i < 100000000; i++) {
        setRet(i);
        var x = ret.x;
        var y = ret.y;
        var z = x + y;
    }
    console.timeEnd('setRet');
};

var useMutateArray = function () {
    console.time('mutateArray');
    var i;
    var r = [-1, -1];
    for (i = 0; i < 100000000; i++) {
        mutateArray(i, r);
        var x = r[0];
        var y = r[1];
        var z = x + y;
    }
    console.timeEnd('mutateArray');
};

var useSetRetArray = function () {
    console.time('setRetArray');
    var i;
    for (i = 0; i < 100000000; i++) {
        var r = setRetArray(i);
        var x = r[0];
        var y = r[1];
        var z = x + y;
    }
    console.timeEnd('setRetArray');
};

var useMutateArrayReturned = function () {
    console.time('mutateArrayReturned');
    var i;
    var array = [-1, -1];
    for (i = 0; i < 100000000; i++) {
        var r = mutateArrayReturned(i, array);
        var x = r[0];
        var y = r[1];
        var z = x + y;
    }
    console.timeEnd('mutateArrayReturned');
};

var useSetRetWithBogusReturn = function () {
    console.time('setRetWithBogusReturn');
    var i;
    for (i = 0; i < 100000000; i++) {
        var bogus = setRetWithBogusReturn(i);
        var x = ret.x;
        var y = ret.y;
        var z = x + y;
    }
    console.timeEnd('setRetWithBogusReturn');
};

var returnArrayClosure = function (i) {
    var r = returnArray(i);
    return function () {
        var x = r[0];
        var y = r[1];
        var z = x + y;
        return z;
    };
};

var setRetClosure = function (i) {
    var r = setRet(i);
    return function () {
        var x = ret.x;
        var y = ret.y;
        var z = x + y;
        return z;
    };
};

var useReturnArrayClosure = function () {
    console.time('returnArrayClosure');
    var i;
    for (i = 0; i < 10000000; i++) {
        var r = returnArrayClosure(i);
        var z = r();
    }
    console.timeEnd('returnArrayClosure');
};

var useSetRetClosure = function () {
    console.time('setRetClosure');
    var i;
    for (i = 0; i < 10000000; i++) {
        var r = setRetClosure(i);
        var z = r();
    }
    console.timeEnd('setRetClosure');
};

var originalFile = new Uint8Array(100);
var i;
for (i = 0; i < 100; i++) {
    originalFile[i] = i;
}

var heapArray = new Uint8Array(4196);

var returnArrayCopy = function (i) {
    var j = Math.imul(i, 101) & 4095;
    var i;
    for (i = 0; i < 100; i++) {
        heapArray[j + i] = originalFile[i];
    }

    return [j, j + i];
};

var setRetCopy = function (i) {
    var j = Math.imul(i, 101) & 4095;
    var i;
    for (i = 0; i < 100; i++) {
        heapArray[j + i] = originalFile[i];
    }

    ret.x = j;
    ret.y = j + i;
};

var useReturnArrayCopy = function () {
    console.time('returnArrayCopy');
    var i;
    for (i = 0; i < 10000000; i++) {
        var r = returnArrayCopy(i);
        var x = r[0];
        var y = r[1];
        var z = x + y;
    }
    console.timeEnd('returnArrayCopy');
};

var useSetRetCopy = function () {
    console.time('setRetCopy');
    var i;
    for (i = 0; i < 10000000; i++) {
        setRetCopy(i);
        var x = ret.x;
        var y = ret.y;
        var z = x + y;
    }
    console.timeEnd('setRetCopy');
};

/*
var useReturnArrayDestructure = function () {
    console.time('returnArrayDestructure');
    var i;
    for (i = 0; i < 100000000; i++) {
        var [x, y] = returnArray(i);
        var z = x + y;
    }
    console.timeEnd('returnArrayDestructure');
};
*/
