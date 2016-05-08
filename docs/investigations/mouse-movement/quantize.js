'use strict';
var Quantize = {};
(function () {

// Quantize takes a change in a mouse coordinate (delta x or y)
// and constrains it to a predetermined set of allowed changes.
// The central data structure is the `quantizations` array,
// with `true` at all allowed mouse deltas (absolute deltas),
// and `false` otherwise.
// To quantize the mouse movement, find the nearest index with
// a `true` value in the `quantizations` array, starting with
// the index equal to the delta.
//
// Example:
//                      0     1     2      3     4      5
//   quantizations = [true, false, true, false, false, true]
//
//   If mouse x moves by 3, then start at index 3. quantizations[3]
//   is false, so search for the nearest true index. In this
//   case it is 2, which becomes the quantized change.


// These two arrays are used to build the `quantizations` array,
// which is done in `Quantize.generateQuantizations`.
// The `quantizationStats` are used to help adjust them.
// These arrays and the next two methods aren't essential for
// understand the rest of the program.
var gapBetweenQuantizations = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14,15, 17, 19, 22, 25, 29, 33, 38, 44, 51, 59, 68, 78, 90];
var countsAtEachGapAmount   = [18, 5, 3, 2, 2, 2, 1, 1, 1,  1,  1,  1,  1, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  9];

Quantize.generateQuantizations = function () {
    var quantizations = [];

    var k;
    for (k = 0; k < countsAtEachGapAmount.length; k++) {
        var count = countsAtEachGapAmount[k];
        var gap = gapBetweenQuantizations[k];

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

var quantizationStats = function () {
    var levelRanges = [];
    var numLevels = [];
    var errors = [];
    var sum = 0;
    var numLevelsSum = 0;

    var k;
    for (k = 0; k < countsAtEachGapAmount.length; k++) {
        var count = countsAtEachGapAmount[k];
        var gap = gapBetweenQuantizations[k];

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

    console.log(gapBetweenQuantizations.map(Analysis.pad).join(''));
    console.log(countsAtEachGapAmount.map(Analysis.pad).join(''));
    console.log(levelRanges.map(Analysis.pad).join(''));
    console.log(numLevels.map(Analysis.pad).join(''));
    console.log(errors.map(Analysis.pad).join(''));
};

Quantize.adjustPosition = function (quantizations, position, lastPosition, lastAdjusted) {
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
