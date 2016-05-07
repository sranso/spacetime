// Results (median of 5):

// first time:
// 1000000, 0.1: 11.249ms              11.  ns/loop     2.8 ns/B
// 1000000, 0.1 (bust cache): 4.752ms   4.8 ns/loop     1.2 ns/B
//
// not first time:
// 1000000, 0.1: 2.645ms                2.6 ns/loop     0.7 ns/B
// 1000000, 0.1 (bust cache): 2.358ms   2.4 ns/loop     0.6 ns/B
//
// it's odd that busting the cache improved performance by a bit.
//
// 1000000, 0.001: 1.592ms              1.6 ns/loop     0.4 ns/B
// 1000000, 0.01: 1.508ms               1.5 ns/loop     0.4 ns/B
// 1000000, 0.1: 2.645ms                2.6 ns/loop     0.7 ns/B
// 1000000, 0.5: 6.266ms                6.2 ns/loop     1.6 ns/B
// 1000000, 0.9: 2.915ms                2.9 ns/loop     0.7 ns/B
// 1000000, 0.99: 2.330ms               2.3 ns/loop     0.6 ns/B

// Entries to size of file cache (100 bytes per entry):
// 1,000,000,000 entries                100 GB
//   100,000,000 entries                 10 GB
//    10,000,000 entries                  1 GB
//     1,000,000 entries                   100 MB
//       500,000 entries                    50 MB
//       200,000 entries                    20 MB
//       100,000 entries                    10 MB
//        50,000 entries                     5 MB
//        10,000 entries                     1 MB

// Time estimates: (0.1 probability)
// 1,000,000,000 entries                2,600 ms
//   100,000,000 entries                  260 ms
//    10,000,000 entries                   26 ms
//     1,000,000 entries                    2600 us (2.6 ms)
//       500,000 entries                    1300 us (1.3 ms)
//       200,000 entries                     530 us
//       100,000 entries                     260 us
//        50,000 entries                     130 us
//        10,000 entries                      26 us

var runArrayScanForBit = function (length, probability, bustCache) {
    var array = new Uint32Array(length);

    var i;
    for (i = 0; i < length; i++) {
        array[i] = +(Math.random() < probability) << 1
    };

    if (bustCache) {
        var cacheBustLength = 67108864; // 64 MiB
        var lengthMask = cacheBustLength - 1;
        var sourceArray = new Uint8Array(cacheBustLength);
        var destArray = new Uint8Array(cacheBustLength + 4096);

        for (i = 0; i < sourceArray.length; i++) {
            sourceArray[i] = (255 * Math.random()) & 0xff;
            destArray[i] = i & 0xff;
        };

        var scale = cacheBustLength - 64;
        var source_j;
        var dest_j;
        for (k = 0; k < 5000000; k++) {
            source_j = (Math.random() * scale) | 0;
            dest_j = (dest_j + 64) & lengthMask;
            for (i = 0; i < 64; i++) {
                destArray[dest_j + i] = sourceArray[source_j + i];
            }
        }
    }

    console.time('find bit');
    var found = 0;
    for (i = 0; i < array.length; i++) {
        if (array[i] & 0x2) {
            found++;
        }
    }
    console.timeEnd('find bit');

    console.log('expected:', length * probability);
    console.log('found:', found);
};
