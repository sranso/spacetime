'use strict';
global.Random = {};
(function () {

var x = [];
var ix = 0;
var w;

// 128 * 32 = 4096
// 0x61c88647 (weyl) = odd approximation to 2**32 * (3-sqrt(5)) / 2.

Random.seed = function (seed) {
    if (!seed) {
        throw new Error('Seed must be nonzero');
    }

    // Avoid correlations for close seeds.
    // Recurrence has a period of 2**32 - 1.
    var v = seed;
    var j;
    for (j = 0; j < 32; j++) {
        v ^= v << 10;
        v ^= v >>> 15;
        v ^= v << 4;
        v ^= v >>> 13;
    }

    // Initialize circular array
    w = v;
    for (ix = 0; ix < 128; ix++) {
        v ^= v << 10;
        v ^= v >>> 15;
        v ^= v << 4;
        v ^= v >>> 13;
        w = (w + 0x61c88647) | 0;
        x[ix] = (v + w) | 0;
    }

    // Discard first 512 (128 * 4) results
    var t;
    ix--;
    for (j = 0; j < 512; j++) {
        ix = (ix + 1) & 127;
        t = x[ix];
        t ^= t << 17;
        t ^= t >>> 12;
        v = x[(ix + 33) & 127];  // ix - 95 mod 128
        v ^= v << 13;
        v ^= v >>> 15;
        x[ix] = t ^ v;
    }
};

Random.rand = function () {
    ix = (ix + 1) & 127;
    var t = x[ix];
    t ^= t << 17;
    t ^= t >>> 12;
    var v = x[(ix + 33) & 127];  // ix - 95 mod 128
    v ^= v << 13;
    v ^= v >>> 15;
    x[ix] = v ^= t
    w = (w + 0x61c88647) | 0;
    return (v + (w ^ (w >>> 16))) >>> 0;
};

})();
