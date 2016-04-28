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
// 1.43 GB  in 13.6 days  (9.5 * 60 * 60 * 24 * 128 * 13.6) = max in one hash table (1.33 GiB)
//
// What if only record keyframes every 15625 frames (4.3 min)?
//    0.5 at lowest level (0 to 1 out of 12)
//    0.004 for keyframes (0% repeated)
//    2.0 for second level (16.7% repeated out of 2.4)
//    0.5 for third level (0% repeated)
//    0.1 for fourth level (0% repeated)
//    0.024 for all remaining levels combined
//  = 3.13 total for one coordinate (for active mouse.)
//  = 6.26 total for both coordinates.
//
// How quickly will 6.26 hashes per second fill up?
//
//     0.5 MB in 10 min   (6.26 * 60 * 10      * 128)
//     2.9 MB in  1 hr    (6.26 * 60 * 60      * 128)
//    69.  MB in  1 day   (6.26 * 60 * 60 * 24 * 128)
// 1.43 GB  in 20.7 days  (6.26 * 60 * 60 * 24 * 128 * 20.7) = max in one hash table (1.33 GiB)

var x = 0;
var y = 0;
var len = 80;
var positionIndex = len;

var canvasTop = document.getElementById('canvas-top');
canvasTop.addEventListener('click', function (event) {
    console.log('Recording...\n\n\n\n\n\n\n');
    x = event.clientX;
    y = event.clientY;
    lastAdjustedX = x;
    lastAdjustedY = y;
    positionIndex = 0;
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

var positions = [];
var velocities = [];
var accelerations = [];

var lastX = 0;
var lastAdjustedX = 0;
var lastY = 0;
var lastAdjustedY = 0;

var boxSize = 10;

ctxBottom.fillStyle = '#ff0000';
ctxTop.fillStyle = '#000000';
var offsetLeft = canvasTop.offsetLeft;
var offsetTop = canvasTop.offsetTop;

var quantizeAtEachLevel = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,15, 17, 19, 22, 25, 29, 33, 38, 44, 51, 59, 68, 78, 90, /* not used */ 90];
var countsAtEachLevel =   [20, 5, 4, 2, 2, 2, 2, 1, 1,  1,  1,  1,  1, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1, 9];

// levelRanges
//   0   20   30   42   50   60   72   86   94  103  113  124  136  149  164  181  200  222  247  276  309  347  391  442  501  569  647
// quantizedLevels
//   0   20   25   29   31   33   35   37   38   39   40   41   42   43   44   45   46   47   48   49   50   51   52   53   54   55   56
// errors
//4.76 4.76 4.55 4.76 4.76 4.64 4.44 4.57 4.63 4.64 4.62 4.56 4.79 4.93 4.99 5.21 5.33 5.54 5.64 5.79 5.96 6.12 6.26 6.36 6.41  6.5    3

var calcQuantization = function () {
    var lastSum = 0;
    var levelRanges = [];
    var quantizedLevels = [];
    var lastQuantizedCount = 0;
    var errors = [];
    var i;
    for (i = 0; i < countsAtEachLevel.length; i++) {
        var quantize = quantizeAtEachLevel[i];
        var count = countsAtEachLevel[i];

        quantizedLevels[i] = lastQuantizedCount;
        lastQuantizedCount += count;

        var sum = lastSum + count * quantize;
        levelRanges[i] = lastSum;
        lastSum = sum;

        var nextQuantize = quantizeAtEachLevel[i + 1];
        var error = nextQuantize / 2;
        var errorFraction = 100 * error / (sum + error);
        var errorRound = Math.round(100 * errorFraction) / 100;
        errors[i] = errorRound;
    }
    console.log(quantizeAtEachLevel.map(pad).join(''));
    console.log(countsAtEachLevel.map(pad).join(''));
    console.log(levelRanges.map(pad).join(''));
    console.log(quantizedLevels.map(pad).join(''));
    console.log(errors.map(pad).join(''));
};

var quantizeDiff = function (velocity, positionDiff) {
    var diff = (2 * velocity + 3 * positionDiff) / 5;
    var absDiff = Math.abs(diff);
    var i;
    var min = 0;
    for (i = 0; i < countsAtEachLevel.length; i++) {
        var quantize = quantizeAtEachLevel[i];
        var max = min + quantize * countsAtEachLevel[i];
        if (absDiff < max) {
            var overBy = absDiff - min;
            var level = Math.round(overBy / quantize);
            var quantizedDiff = min + quantize * level;
            if (diff < 0) {
                quantizedDiff = -quantizedDiff;
            }
            return quantizedDiff;
        }
        min = max;
    }
};

var go = function (now) {
    // Test quantized
    var velocity = x - lastX;
    var positionDiff = x - lastAdjustedX;
    var adjustedX = lastAdjustedX + quantizeDiff(velocity, positionDiff);
    velocity = y - lastY;
    positionDiff = y - lastAdjustedY;
    var adjustedY = lastAdjustedY + quantizeDiff(velocity, positionDiff);

    // Test exact
    //var adjustedX = x;
    //var adjustedY = y;

    if (positionIndex < len) {
        positions[positionIndex] = adjustedX;
        positionIndex++;
        if (positionIndex === len) {
            results();
        }
    }

    ctxBottom.fillRect(x - offsetLeft, y - offsetTop + document.body.scrollTop, boxSize, boxSize);
    ctxTop.fillRect(adjustedX - offsetLeft, adjustedY - offsetTop + document.body.scrollTop, boxSize, boxSize);

    window.requestAnimationFrame(go);

    lastY = y;
    lastX = x;
    lastAdjustedX = adjustedX;
    lastAdjustedY = adjustedY;
};

var pad = function (num) {
    return ('    ' + num).slice(-5);
};

var lastPosition = 0;
var lastVelocity = 0;

var groupSize = 5;
var lineSize = 6 * groupSize;

var line = function (k, displayType) {
    var text = '';
    var j;
    for (j = 0; j < lineSize; j += groupSize) {
        var i;
        for (i = 0; i < groupSize; i++) {
            var value;
            if (displayType === 'position') {
                value = positions[k + j + i];
            } else if (displayType === 'velocity') {
                value = velocities[k + j + i];
            } else if (displayType === 'acceleration') {
                value = accelerations[k + j + i];
            }

            text += pad(value);
        }
        text += '  ';
    }
    console.log(text);
};

var results = function () {
    console.log('---------');
    console.log('');

    var i;
    var lastPosition = positions[0];
    var lastVelocity = 0;
    for (i = 0; i < positions.length; i++) {
        var position = positions[i];
        var velocity = position - lastPosition;
        var acceleration = velocity - lastVelocity;
        velocities[i] = velocity;
        accelerations[i] = acceleration;

        lastPosition = position;
        lastVelocity = velocity;
    }


    var k;
    for (k = 0; k <= (len - lineSize); k += lineSize) {
        line(k, 'position');
        line(k, 'velocity');
        line(k, 'acceleration');
    }
};

go();
