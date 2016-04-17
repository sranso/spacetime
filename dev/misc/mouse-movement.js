// Results:

// e.g.:
// 0
//    0 |   -1  -13  -49  -98
// -160 |  -66 -108 -152 -180
// -202 |  -13  -17  -21  -22
//  -22 |    3    5    7    8
// -376
//  -17 |   -5   -9  -12  -14
//  -16 |    0    0    0    0
//    0 |    0    0    0    0
//    0 |    0    0    0    0
// -33
//    0 |    0    0    0    0
//    0 |    0    0    0    0
//    0 |    0    0    0    0
//    0 |    0    0    0    0
//
//
// Conclusion is 5-ary is too much at base level.
// If movement is 50 px per frame, that's:
//    Math.pow(50, 5) * 128  = 40 GB
// or Math.pow(50, 4) * 128  = 800 MB
//
//    (why 128? It's 64/3 per hash and 64/3 for data, and the
//     target fullness of the table is 1/3, so (3 * 2 * 64/3 = 128.)
//
// If mouse data is approaching the "full" 800 MB for the lowest
// level, then the number of hashes per 60 frames (1 second) is:
//    1.5 at lowest level (0 to 3 out of 12)
//    2.2 for keyframes (8.3% repeated out of 2.4)
//    2.35 for second level (2% repeated out of 2.4)
//    0.5 for third level (0% repeated)
//    0.5 for second level keyframes (0% repeated)
//    0.1 for fourth level (0% repeated)
//    0.1 for third level keyframes (0% repeated)
//    0.05 for all remaining levels combined
//  = 7.3 total for one coordinate (for active mouse.)
//  = 14.6 total for both coordinates.
//
// How quickly will 14.6 hashes per second fill up?
//
//     1.1 MB in 10 min   (14.6 * 60 * 10      * 128)
//     6.7 MB in  1 hr    (14.6 * 60 * 60      * 128)
//    27.  MB in  1 day   (14.6 * 60 * 60 * 24 * 128)
//   161.  MB in  1 day   (14.6 * 60 * 60 * 24 * 128)
//   161.  MB in  1 day   (14.6 * 60 * 60 * 24 * 128)
// 1.43 GB    in ~9 days  (14.6 * 60 * 60 * 24 * 128 * 9) = max in one hash table (1.33 GiB)
//
// But remember, this is for an active mouse.
// Idle time costs almost nothing.
//
// If adding a second level of offsets from keyframes (three levels
// total), need to remove 0.5 + 0.1 = 0.6 / 2.4 = 25% of the
// coarse offset level.
//
// Educated guess, a lot of offsets will have the look of this:
//   -120 to 120 for initial offset
//   -25 to +25 for the next offsets difference from the first
//   -10 to +10 for the last two offsets difference from the previous
//
//    So: 240 * 50 * 20 * 20 * 128 = 614 MB
//
//    1.5 at first level for fine offsets (0 to 3 out of 12)
//    1.0 at first level for coarse offsets (58% repeated out of 2.4)
//    2.35 for second level fine (2% repeated out of 2.4)
//    0.5 for third level (0% repeated)
//    0.5 for second level coarse (0% repeated)
//    0.5 for first level keyframse (0% repeated)
//    0.1 for fourth level fine (0% repeated)
//    0.1 for third level coarse (0% repeated)
//    0.1 for second level keyframes (0% repeated)
//    0.07 for all remaining levels combined
//  = 6.7 total for one coordinate (for active mouse.)
//  = 92% of 7.3 (for single level offsets)
//
// If instead, had 90% repeated out of 2.4 for coarse offsets, then:
//    5.7 (= 6.7 - 1.0)
//    0.24 (90% out of 2.4)
//  = 5.9
//  = 81% of 7.3 (for single level offsets).
//
// Comparing idle mouse.
// Assume already spent ~10 seconds at every coordinate,
// so levels of ~10 seconds or less cost nothing.
//      Asterisk (*) means keyframes for the two
//      offsets (fine and coarse) version:
//
//    0    /12 at first level fine offsets (83 ms)
//    0    /2.4 for first level keyframes or coarse (416 ms)
//    0    /2.4 for second level fine (416 ms)
//    0    /0.5 for third level fine (2 s)
//    0    /0.5 for second level keyframes or coarse (2 s)
//    0    /0.5 for first level keyframes* (2 s)
//    0    /0.1 for fourth level fine (10.4 s)
//    0    /0.1 for third level keyframes or coarse (10.4 s)
//    0    /0.1 for second level keyframes* (10.4 s)
//    0    /0.02 for fifth level fine offsets (52 s)
//    0.02 /0.02 for fourth level keyframes (52 s)
//    0    /0.02 for fourth level coarse offsets (52 s)
//    0.02 /0.02 for third level keyframes* (52 s)
//    0.004/0.004 for fifth level keyframes (260 s)
//    0.004/0.004 for fourth level keyframes* (260 s)
//    0.001/0.001 for sixth level keyframes (22 min)
//    0.001/0.001 for fifth level keyframes* (22 min)
//
// =  0.025 for either version (= 2160 per day, or 276 KB)
//
// What did it cost to get to this ~10 s per each coordinate
// idle time? (1440 coordinates):
//
// Cost for zero levels: 4 (only need one per level)
// Cost for keyframes at each level (count followed by MB):
//   2.4/s: 2.4 * 10 * 1440 = 34560   (4.4 MB)
//   0.5/s: 0.5 * 10 * 1440 =  6912   (885 KB)
//   0.1/s: 0.1 * 10 * 1440 =   138   (18 KB)
//                          = 41610   (5.3 MB)
//
// If using fine+coarse, then discard the 2.4/s level, so: 902 KB
//
// In conclusion, it's not looking like the fine+coarse distinction
// is worth it.

var startX = 0;
var x = 0;
var len = 80;
var i = len;

var startButton = document.getElementById('start');
startButton.addEventListener('click', function (event) {
    x = startX = event.clientX;
    i = 0;
});

window.addEventListener('mousemove', function (event) {
    x = event.clientX;
});

var xs = [];

var go = function (now) {
    if (i < len) {
        xs[i] = x;
        i++;
        if (i === len) {
            results();
        }
    }
    window.requestAnimationFrame(go);
};

var keyBy = 5;

var pad = function (num) {
    return ('   ' + num).slice(-4);
};

var line = function (j) {
    var key = xs[j];
    var previousKey = j > 0 ? xs[j - keyBy] : key;
    var text = pad(key - previousKey) + ' | ';

    var i;
    var lastX = key;
    for (i = 1; i < keyBy; i++) {
        var x = xs[j + i];
        text += pad(x - lastX) + ' ';
        lastX = x;
    }
    console.log(text);
};

var block = function (j) {
    var keyBySquared = keyBy * keyBy
    var key = xs[j];
    var previousKey = j > 0 ? xs[j - keyBySquared] : key;
    console.log(key - previousKey);

    var i;
    for (i = 1; i < keyBy; i++) {
        line(j + keyBy * i);
    }
};

var results = function () {
    var keyBySquared = keyBy * keyBy

    var j;
    for (j = 0; j <= (len - keyBySquared); j += keyBySquared) {
        block(j);
    }
    console.log('---------');
    console.log('');
};

go();
