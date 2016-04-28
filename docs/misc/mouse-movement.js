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

//
// Another space saver: inexact mouse positions
// If quantizing the differences by this pattern
// (number at level / quantization):
// 10+10/2+15/4+25/8+50/16+100/32 ~= 28
//   (sum of numerators == 210)
// So max would be 2 * 28 * 28 * 28 * 28 * 128 = 157 MB
// Realistically it would be way less.
// Now can also quantize keyframes and get significant
// savings there.
// Could for example, quantize to nearest 10, and then
// use the first value of offsets to do +/- 5 to get
// to exact pixel.
// Complete guess at cost now:
//    0.5 at lowest level (0 to 1 out of 12)
//    1.0 for keyframes (58% repeated out of 2.4)
//    2.0 for second level (16.7% repeated out of 2.4)
//    0.5 for third level (0% repeated)
//    0.5 for second level keyframes (0% repeated)
//    0.1 for fourth level (0% repeated)
//    0.1 for third level keyframes (0% repeated)
//    0.05 for all remaining levels combined
//  = 4.75 total for one coordinate (for active mouse.)
//  = 9.5 total for both coordinates.
//
// How quickly will 9.5 hashes per second fill up?
//
//     0.7 MB in 10 min   (9.5 * 60 * 10      * 128)
//     4.4 MB in  1 hr    (9.5 * 60 * 60      * 128)
//   105.  MB in  1 day   (9.5 * 60 * 60 * 24 * 128)
// 1.43 GB  in 13.6 days  (9.5 * 60 * 60 * 24 * 128 * 9) = max in one hash table (1.33 GiB)

var x = 0;
var y = 0;
var len = 80;
var i = len;

var canvasTop = document.getElementById('canvas-top');
canvasTop.addEventListener('click', function (event) {
    x = event.clientX;
    y = event.clientY;
    i = 0;
    ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height);
    ctxBottom.clearRect(0, 0, canvasTop.width, canvasTop.height);
});
canvasTop.width = canvasTop.offsetWidth;
canvasTop.height = canvasTop.offsetHeight;

var canvasBottom = document.getElementById('canvas-bottom');
canvasBottom.width = canvasBottom.offsetWidth;
canvasBottom.height = canvasBottom.offsetHeight;

var ctxTop = canvasTop.getContext('2d');
var ctxBottom = canvasBottom.getContext('2d');

window.addEventListener('mousemove', function (event) {
    x = event.clientX;
    y = event.clientY;
});

var spaceToggle = false;

window.addEventListener('keydown', function (event) {
    if (event.keyCode === 32 && (event.shiftKey || event.ctrlKey)) {
        spaceToggle = !spaceToggle;
        event.preventDefault();
    } else {
        spaceToggle = false;
    }
    canvasTop.style.opacity = +(event.shiftKey === spaceToggle);
    canvasBottom.style.opacity = +(event.ctrlKey === spaceToggle);
});

window.addEventListener('keyup', function (event) {
    if (event.keyCode === 32) {
        return;
    }
    if (!event.shiftKey) {
        canvasTop.style.opacity = 1;
    }
    if (!event.ctrlKey) {
        canvasBottom.style.opacity = 1;
    }
});

var xs = [];

var lastX = 0;
var lastAdjustedX = 0;
var lastY = 0;

var boxSize = 10;

ctxBottom.fillStyle = '#ff5555';
ctxTop.fillStyle = '#000000';
var offsetLeft = canvasTop.offsetLeft;
var offsetTop = canvasTop.offsetTop;

var quantizeAtEachLevel = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,15, 17, 19, 22, 25, 27, 30, 34, 38, 42, 46, 50, 54];
var countsAtEachLevel =   [18, 8, 6, 4, 3, 2, 1, 1, 1,  1,  1,  1,  1, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1];

var countsTotal = function () {
    var sum = 0;
    var i;
    return countsAtEachLevel.map(function (count, i) {
        var lastSum = sum;
        sum += count * quantizeAtEachLevel[i];
        return lastSum;
    });
};

var go = function (now) {
    // Test quantized
// 10+10/2+15/4+25/8+50/16+100/32 ~= 28
    var exactDiff = x - lastX; // diff for velocity
    var adjustedDiff = x - lastAdjustedX; // diff for position
    var diff = (exactDiff + adjustedDiff) / 2;
    var absDiff = Math.abs(diff);
    if (-10 <= diff && diff <= 10) {
        var quantizedDiff = Math.round(diff);
    } else if (-20 <= diff && diff <= 20) {
        var quantizedDiff = 2 * Math.round(diff / 2);
    } else if (-35 <= diff && diff <= 35) {
        var quantizedDiff = 4 * Math.round(diff / 4);
    } else if (-60 <= diff && diff <= 60) {
        var quantizedDiff = 8 * Math.round(diff / 8);
    } else if (-110 <= diff && diff <= 110) {
        var quantizedDiff = 16 * Math.round(diff / 16);
    } else {
        var quantizedDiff = 32 * Math.round(diff / 32);
    }

    // Test exact
    // var quantizedDiff = diff;

    var adjustedX = lastAdjustedX + quantizedDiff;

    if (i < len) {
        xs[i] = adjustedX;
        i++;
        if (i === len) {
            results();
        }
    }

    ctxBottom.fillRect(x - offsetLeft, y - offsetTop + document.body.scrollTop, boxSize, boxSize);
    ctxTop.fillRect(adjustedX - offsetLeft, y - offsetTop + document.body.scrollTop, boxSize, boxSize);

    window.requestAnimationFrame(go);

    lastY = y;
    lastX = x;
    lastAdjustedX = adjustedX;
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
    for (i = 0; i < keyBy; i++) {
        var x = xs[j + i];
        text += pad(x - lastX) + ' ';
        lastX = x;
    }
    console.log(text);
};

var block = function (j) {
    var i;
    for (i = 0; i < keyBy; i++) {
        line(j + keyBy * i);
    }
};

var results = function () {
    var keyBySquared = keyBy * keyBy

    console.log('---------');
    console.log('');
    var j;
    for (j = 0; j <= (len - keyBySquared); j += keyBySquared) {
        block(j);
    }
};

go();
