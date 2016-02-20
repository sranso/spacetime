'use strict';
global.Random = {};
(function () {

// 128 * 32 = 4096
// 0x61c88647 (weyl) = odd approximation to 2**32 * (3-sqrt(5)) / 2.

Random.create = function (seed) {
    if (!seed) {
        throw new Error('Seed must be nonzero');
    }

    var x = new Uint32Array(128);
    var i = 0;
    var w;

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
    for (i = 0; i < 128; i++) {
        v ^= v << 10;
        v ^= v >>> 15;
        v ^= v << 4;
        v ^= v >>> 13;
        w = (w + 0x61c88647) | 0;
        x[i] = (v + w) | 0;
    }

    // Discard first 512 (128 * 4) results
    var t;
    i--;
    for (j = 0; j < 512; j++) {
        i = (i + 1) & 127;
        t = x[i];
        t ^= t << 17;
        t ^= t >>> 12;
        v = x[(i + 33) & 127];  // i - 95 mod 128
        v ^= v << 13;
        v ^= v >>> 15;
        x[i] = t ^ v;
    }

    return {
        x: x,
        i: i,
        w: w,
    };
};

Random.clone = function (original) {
    return {
        x: original.x.slice(),
        i: original.i,
        w: original.w,
    };
};

Random.uint32 = function (random) {
    var i = random.i = (random.i + 1) & 127;
    var t = random.x[i];
    t ^= t << 17;
    t ^= t >>> 12;
    var v = random.x[(i + 33) & 127];  // i - 95 mod 128
    v ^= v << 13;
    v ^= v >>> 15;
    v ^= t;
    random.x[i] = v;
    var w = random.w = (random.w + 0x61c88647) | 0;
    return (v + (w ^ (w >>> 16))) >>> 0;
};

})();
