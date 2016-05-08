'use strict';
var Quantizer = {};
(function () {

// These arrays are hand-crafted using trial and error.
var gapAtEachLevel    = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14,15, 17, 19, 22, 25, 29, 33, 38, 44, 51, 59, 68, 78, 90];
var countsAtEachLevel = [18, 5, 3, 2, 2, 2, 1, 1, 1,  1,  1,  1,  1, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  9];

Quantizer.generateQuantizations = function () {
    var quantizations = [];

    var k;
    for (k = 0; k < countsAtEachLevel.length; k++) {
        var count = countsAtEachLevel[k];
        var gap = gapAtEachLevel[k];

        var j;
        for (j = 0; j < count; j++) {
            quantizations.push(true);

            var i;
            for (i = 1; i < gap; i++) {
                quantizations.push(false);
            }
        }
    }

    quantizationStats();

    return quantizations;
};

// These stats are used for feedback to adjust gapsAtEachLevel
// and countsAtEachLevel (by hand).
var quantizationStats = function () {
    var levelRanges = [];
    var numLevels = [];
    var errors = [];
    var sum = 0;
    var numLevelsSum = 0;

    var k;
    for (k = 0; k < countsAtEachLevel.length; k++) {
        var count = countsAtEachLevel[k];
        var gap = gapAtEachLevel[k];

        var error = gap / 2;
        var errorFraction = error / (sum + error);
        var errorPercent = 100 * errorFraction;
        var errorRounded = Math.round(100 * errorPercent) / 100;
        errors[k] = errorRounded;

        sum += count * gap;
        numLevelsSum += count;

        levelRanges[k] = sum;
        numLevels[k] = numLevelsSum;
    }

    console.log(gapAtEachLevel.map(Results.pad).join(''));
    console.log(countsAtEachLevel.map(Results.pad).join(''));
    console.log(levelRanges.map(Results.pad).join(''));
    console.log(numLevels.map(Results.pad).join(''));
    console.log(errors.map(Results.pad).join(''));
};

Quantizer.adjust = function (quantizations, position, lastPosition, lastAdjusted) {
    var positionDiff = position - lastAdjusted;
    var velocity = position - lastAdjusted;
    var targetDiff = (2 * velocity + 3 * positionDiff) / 5;
    var quantizedDiff = quantize(quantizations, targetDiff);
    return lastAdjusted + quantizedDiff;
};

var quantize = function (quantizations, targetDiff) {
    var absDiff = Math.abs(targetDiff);
    var sign = targetDiff < 0 ? -1 : +1;

    var low = Math.floor(absDiff);
    var high = Math.ceil(absDiff + 0.0000001);
    while (!quantizations[low]) {
        low--;
    }
    while (!quantizations[high]) {
        high++;
    }

    var lowDiff = absDiff - low;
    var highDiff = high - absDiff;
    if (lowDiff < highDiff) {
        return sign * low;
    } else {
        return sign * high;
    }
};

})();