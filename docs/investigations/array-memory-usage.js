// Results:
//
// memBaseTest(10,000,000)
// before: 4.6 MiB
// after:  196 MiB
// difference: 191 MiB
// calculated: 200 MB (or 191 MiB)
// per hash: 20 bytes
//
// memBaseTestArray(10,000,000)
// before: 4.5 MiB
// after:  272 MiB
// difference: 268 MiB
// per hash: 28 bytes
//
// memTestArrayOfArray(1,000,000)
// before: 4.5 MiB
// after:  42.9 MiB
// difference: 38 MiB
// per index: 40 bytes (40 - 8 == 32 bytes for object)
//
// memTestWithOffset(10,000,000)
// before: 5.4 MB
// after:  654 MB
// per hash: 68 bytes
// guess: 68 bytes = 20 byte hash + 8 byte array + 40 byte object
//        40 byte obj = 8 hash ptr + 8 pointer + 24 byte overhead
// note: simply typing 'all.length' took 30 seconds or so.
//
// memTestWithOffset(1,000,000)
// before: 4.5 MB
// after: 69.6 MB
// per hash: 68 bytes
//
// memTestDataAndOffset(1,000,000)
// before: 4.5 MB
// after: 84.8 MB
// per hash: 84 bytes (16 bytes (2 * 8) more than WithOffset)
//
// memTestNoOffset(1,000,000) and memTestBufferNoOffset(1,000,000)
// before: 4.5 MB
// after:  169 MB
// per hash: 172 bytes (104 bytes larger than above, so 112 bytes for a new Uint8Array)
//
// memTestSubarrayOnly(1,000,000)
// before: 4.5 MB
// after:  138 MB
// per hash: 140 bytes (28 + for hash and ptr + 112 bytes for Uint8Array)
// second time: 272 (272 - 138 == 134)
//
// memTestSlicedArrayOnly(1,000,000)
// before: 4.5 MB
// after:  203 MB
// per hash: 208 bytes (28 + for hash and ptr + 112 bytes for Uint8Array + 20 bytes for hash a second time + 42 remaining)


var cloneWithOffset = function (original) {
    return {
        hash: null,
        pointer: 0,
    };
};

var cloneDataAndOffset = function (original) {
    return {
        data: original.data,
        file: original.file,
        hash: null,
        pointer: 0,
    };
};

var cloneNoOffset = function (original) {
    return {
        hash: null,
    };
};

var withOriginal = cloneWithOffset({
    hash: null,
    pointer: 0,
});
withOriginal.hash = new Uint8Array(20);

var dataOriginal = cloneDataAndOffset({
    data: 42,
    file: new Uint8Array(0),
    hash: null,
    pointer: 0,
});
dataOriginal.hash = new Uint8Array(20);

var noOrginal = cloneNoOffset({
    hash: null,
    pointer: 0,
});
noOrginal.hash = new Uint8Array(20);

var all;
var hashes;

var memBaseTest = function (num) {
    hashes = new Uint8Array(num * 20);
};

var memBaseTestArray = function (num) {
    all = new Array(num);
    hashes = new Uint8Array(num * 20);
    var i;
    for (i = 0; i < num; i++) {
        all[i] = withOriginal;
    }
};

var memTestArrayOfArray = function (num) {
    all = new Array(num);
    var i;
    for (i = 0; i < num; i++) {
        all[i] = [];
    }
};

var memTestWithOffset = function (num) {
    all = new Array(num);
    var hashes = new Uint8Array(num * 20);
    var i;
    for (i = 0; i < num; i++) {
        var clone = cloneWithOffset(withOriginal);
        clone.hash = hashes;
        clone.pointer = i * 20;
        all[i] = clone;
    }
};

var memTestDataAndOffset = function (num) {
    all = new Array(num);
    var hashes = new Uint8Array(num * 20);
    var i;
    for (i = 0; i < num; i++) {
        var clone = cloneDataAndOffset(dataOriginal);
        clone.hash = hashes;
        clone.pointer = i * 20;
        all[i] = clone;
    }
};

var memTestNoOffset = function (num) {
    all = new Array(num);
    var hashes = new Uint8Array(num * 20);
    var i;
    for (i = 0; i < num; i++) {
        var clone = cloneNoOffset(noOrginal);
        clone.hash = hashes.subarray(i * 20, i * 20 + 20);
        all[i] = clone;
    }
};

var memTestBufferNoOffset = function (num) {
    all = new Array(num);
    var hashBuffer = new ArrayBuffer(num * 20);
    var i;
    for (i = 0; i < num; i++) {
        var clone = cloneNoOffset(noOrginal);
        clone.hash = new Uint8Array(hashBuffer, i * 20, 20);
        all[i] = clone;
    }
};

var memTestSubarrayOnly = function (num) {
    all = new Array(num);
    var hashes = new Uint8Array(num * 20);
    var i;
    for (i = 0; i < num; i++) {
        all[i] = hashes.subarray(i * 20, i * 20 + 20);
    }
};

var memTestSlicedArrayOnly = function (num) {
    all = new Array(num);
    var hashes = new Uint8Array(num * 20);
    var i;
    for (i = 0; i < num; i++) {
        all[i] = hashes.slice(i * 20, i * 20 + 20);
    }
};
