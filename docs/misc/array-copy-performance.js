// Results (median of 5):

// 0 byte copy: 48.823ms (ns/loop)     48   ns/loop
// 1 byte copy: 141.100ms             141   ns/B
// 64 byte copy (aligned): 259.665ms    4.1 ns/B
// 65 byte copy (aligned): 328.848ms    5.1 ns/B
// 128 byte copy (aligned): 366.894ms   2.9 ns/B
// 129 byte copy (aligned): 395.364ms   3.1 ns/B

// 16 byte copy: 184.608ms (ns/loop)   12.  ns/B
// 32 byte copy: 217.127ms              6.8 ns/B
// 64 byte copy: 276.927ms              4.3 ns/B
// 128 byte copy: 381.735ms             3.0 ns/B
// 256 byte copy: 602.936ms             2.4 ns/B
// 512 byte copy: 1050.795ms            2.1 ns/B
// 1024 byte copy: 2224.964ms           2.2 ns/B

// Size estimates:
//   5,000,000 files * 200 bytes      1,000 MB
//   1,000,000 files * 200 bytes        200 MB
//     500,000 files * 200 bytes        100 MB
//     200,000 files * 200 bytes         40 MB
//     100,000 files * 200 bytes         20 MB
//      50,000 files * 200 bytes         10 MB
//      20,000 files * 200 bytes          4 MB
//      10,000 files * 200 bytes          2 MB
//       5,000 files * 200 bytes          1 MB
//
// Time estimates:
//   1,000 MB * 5 ns/B                5,000 ms
//   1,000 MB * 3 ns/B                3,000 ms
//     200 MB * 5 ns/B                1,000 ms
//     200 MB * 3 ns/B                  600 ms
//     100 MB * 3 ns/B                  300 ms
//      40 MB * 3 ns/B                  120 ms
//      20 MB * 3 ns/B                   60 ms
//      10 MB * 3 ns/B                   30 ms
//       4 MB * 3 ns/B                   12 ms
//       2 MB * 3 ns/B                    6 ms
//       1 MB * 3 ns/B                    3 ms

var runTests = function () {
    var length = 67108864; // 64 MiB
    var lengthMask = length - 1;
    var cacheMask = ~63;
    var sourceArray = new Uint8Array(length);
    var destArray = new Uint8Array(length + 4096);

    var i;
    for (i = 0; i < sourceArray.length; i++) {
        sourceArray[i] = (255 * Math.random()) & 0xff;
        destArray[i] = i & 0xff;
    };

    var k;
    var source_j;
    var dest_j = 0;

    console.time('0 byte copy');
    var scale = length;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) & cacheMask;
        dest_j++;
    }
    console.timeEnd('0 byte copy');

    console.time('1 byte copy');
    var scale = length - 1;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) & cacheMask;
        dest_j = (dest_j + 1) & lengthMask;
        for (i = 0; i < 1; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('1 byte copy');

    console.time('64 byte copy (aligned)');
    var scale = length - 64;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) & cacheMask;
        dest_j = (dest_j + 64) & lengthMask;
        for (i = 0; i < 64; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('64 byte copy (aligned)');

    console.time('65 byte copy (aligned)');
    var scale = length - 65;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) & cacheMask;
        dest_j = (Math.random() * scale) & cacheMask;
        dest_j = (dest_j + 65) & lengthMask;
        for (i = 0; i < 65; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('65 byte copy (aligned)');

    console.time('128 byte copy (aligned)');
    var scale = length - 128;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) & cacheMask;
        dest_j = (dest_j + 128) & lengthMask;
        for (i = 0; i < 128; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('128 byte copy (aligned)');

    console.time('129 byte copy (aligned)');
    var scale = length - 129;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) & cacheMask;
        dest_j = (dest_j + 129) & lengthMask;
        for (i = 0; i < 129; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('129 byte copy (aligned)');

    console.time('16 byte copy');
    var scale = length - 16;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) | 0;
        dest_j = (dest_j + 16) & lengthMask;
        for (i = 0; i < 16; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('16 byte copy');

    console.time('32 byte copy');
    var scale = length - 32;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) | 0;
        dest_j = (dest_j + 32) & lengthMask;
        for (i = 0; i < 32; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('32 byte copy');

    console.time('64 byte copy');
    var scale = length - 64;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) | 0;
        dest_j = (dest_j + 64) & lengthMask;
        for (i = 0; i < 64; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('64 byte copy');

    console.time('128 byte copy');
    var scale = length - 128;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) | 0;
        dest_j = (dest_j + 128) & lengthMask;
        for (i = 0; i < 128; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('128 byte copy');

    console.time('256 byte copy');
    var scale = length - 256;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) | 0;
        dest_j = (dest_j + 256) & lengthMask;
        for (i = 0; i < 256; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('256 byte copy');

    console.time('512 byte copy');
    var scale = length - 512;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) | 0;
        dest_j = (dest_j + 512) & lengthMask;
        for (i = 0; i < 512; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('512 byte copy');

    console.time('1024 byte copy');
    var scale = length - 1024;
    for (k = 0; k < 1000000; k++) {
        source_j = (Math.random() * scale) | 0;
        dest_j = (dest_j + 1024) & lengthMask;
        for (i = 0; i < 1024; i++) {
            destArray[dest_j + i] = sourceArray[source_j + i];
        }
    }
    console.timeEnd('1024 byte copy');
};
