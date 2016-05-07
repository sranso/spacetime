// Results / commentary:

// A lot of this commentary was deleted, so take a look at the
// history for more context:
//
// 5-ary tree with position changes (velocity) at the leafs.
// Recording keyframes (absolute position) every
// 15625 frames (4.3 min).
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
//     0.5 MB in 10 min   (6.26 * 60 * 10      * 128)
//     2.9 MB in  1 hr    (6.26 * 60 * 60      * 128)
//    69.  MB in  1 day   (6.26 * 60 * 60 * 24 * 128)
// 1.43 GB  in 20.7 days  (6.26 * 60 * 60 * 24 * 128 * 20.7) = max in one hash table (1.33 GiB)
//
// 4-ary tree, keyframes every 16384 (4.6 min)
//    0.67 at lowest level (96% repeated out of 15)
//    0.004 for keyframes (0% repeated)
//    3.0  for second level (20% repeated out of 3.75)
//    0.94 for third level (0% repeated)
//    0.23 for fourth level (0% repeated)
//    0.078 for all remaining levels combined
//  = 4.92 total for one coordinate (for active mouse.)
//  = 9.84 total for both coordinates (57% more?)



// Variables /////////////////

var boxSize = 10;
var groupSize = 5;
var lineSize = 6 * groupSize;

var canvasTop = document.getElementById('canvas-top');
var canvasBottom = document.getElementById('canvas-bottom');
var ctxTop = canvasTop.getContext('2d');
var ctxBottom = canvasBottom.getContext('2d');

var shiftDown = false;
var spaceToggle = false;

var x = 0;
var y = 0;
var lastX = 0;
var lastY = 0;
var lastAdjustedX = 0;
var lastAdjustedY = 0;

var quantizations = [];

var positions = new Array(80);
var positionIndex = positions.length;
var velocities = [];
var accelerations = [];

var lastPosition = 0;
var lastVelocity = 0;


var initialize = function () {

    // Initialize UI /////////////

    canvasTop.width = canvasTop.offsetWidth;
    canvasTop.height = canvasTop.offsetHeight;

    canvasBottom.width = canvasBottom.offsetWidth;
    canvasBottom.height = canvasBottom.offsetHeight;

    ctxBottom.fillStyle = '#ff0000';
    ctxTop.fillStyle = '#000000';


    // Event listeners ///////////

    window.requestAnimationFrame(go);

    canvasTop.addEventListener('click', function (event) {
        console.log('Recording...\n\n\n\n\n\n\n');

        x = event.clientX;
        y = event.clientY;
        lastX = x;
        lastY = y;
        lastAdjustedX = x;
        lastAdjustedY = y;

        positionIndex = 0;

        ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height);
        ctxBottom.clearRect(0, 0, canvasBottom.width, canvasBottom.height);
    });

    canvasTop.addEventListener('mousemove', function (event) {
        x = event.clientX;
        y = event.clientY;
    });

    window.addEventListener('keydown', function (event) {
        if (event.shiftKey) {
            shiftDown = true;
            if (event.keyCode === 32) {
                spaceToggle = !spaceToggle;
                event.preventDefault();
            }
            showHideCanvases();
        }
    });

    window.addEventListener('keyup', function (event) {
        if (!event.shiftKey) {
            shiftDown = false;
            spaceToggle = false;
            showHideCanvases();
        }
    });
};

var quantizeAtEachLevel = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14,15, 17, 19, 22, 25, 29, 33, 38, 44, 51, 59, 68, 78, 90];
var countsAtEachLevel =   [18, 5, 3, 2, 2, 2, 1, 1, 1,  1,  1,  1,  1, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  9];

var generateQuantizations = function () {
    quantizations = [];

    // For stats only
    var levelRanges = [];
    var numLevels = [];
    var numLevelsSum = 0;
    var errors = [];

    var k;
    for (k = 0; k < countsAtEachLevel.length; k++) {
        var count = countsAtEachLevel[k];
        var quantize = quantizeAtEachLevel[k];

        var error = quantize / 2;
        var errorFraction = error / (quantizations.length + error);
        var errorPercent = 100 * errorFraction;
        var errorRounded = Math.round(100 * errorPercent) / 100;
        errors[k] = errorRounded;

        var j;
        for (j = 0; j < count; j++) {
            numLevelsSum++;
            quantizations.push(1);

            var i;
            for (i = 1; i < quantize; i++) {
                quantizations.push(0);
            }
        }

        levelRanges[k] = quantizations.length;
        numLevels[k] = numLevelsSum;
    }

    console.log(quantizeAtEachLevel.map(pad).join(''));
    console.log(countsAtEachLevel.map(pad).join(''));
    console.log(levelRanges.map(pad).join(''));
    console.log(numLevels.map(pad).join(''));
    console.log(errors.map(pad).join(''));
};

var quantizeDiff = function (positionDiff, velocity) {
    var diff = (2 * velocity + 3 * positionDiff) / 5;
    var absDiff = Math.abs(diff);
    var sign = diff < 0 ? -1 : +1;

    var low = Math.floor(absDiff);
    var high = Math.floor(absDiff + 0.0000001);
    while (quantizations[low] === 0) {
        low--;
    }
    while (quantizations[high] === 0) {
        high++;
    }

    if (absDiff - low < high - absDiff) {
        return sign * low;
    } else {
        return sign * high;
    }
};

var go = function (now) {
    var positionDiff = x - lastAdjustedX;
    var velocity = x - lastX;
    var adjustedX = lastAdjustedX + quantizeDiff(positionDiff, velocity);
    positionDiff = y - lastAdjustedY;
    velocity = y - lastY;
    var adjustedY = lastAdjustedY + quantizeDiff(positionDiff, velocity);

    if (positionIndex < positions.length) {
        positions[positionIndex] = x;
        positionIndex++;
        if (positionIndex === positions.length) {
            results();
        }
    }

    var offsetLeft = canvasTop.offsetLeft;
    var offsetTop = canvasTop.offsetTop - document.body.scrollTop;
    ctxBottom.fillRect(x - offsetLeft, y - offsetTop, boxSize, boxSize);
    ctxTop.fillRect(adjustedX - offsetLeft, adjustedY - offsetTop, boxSize, boxSize);

    window.requestAnimationFrame(go);

    lastY = y;
    lastX = x;
    lastAdjustedX = adjustedX;
    lastAdjustedY = adjustedY;
};


var showHideCanvases = function () {
    canvasTop.style.opacity = +(shiftDown === spaceToggle);
    canvasBottom.style.opacity = +!spaceToggle;
};

var pad = function (num) {
    return ('    ' + num).slice(-5);
};

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
    for (k = 0; k <= (positions.length - lineSize); k += lineSize) {
        line(k, 'position');
        line(k, 'velocity');
        line(k, 'acceleration');
    }
};

generateQuantizations();
initialize();
