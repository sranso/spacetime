'use strict';
var Quantizer = {};
(function () {

var quantizeAtEachLevel = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14,15, 17, 19, 22, 25, 29, 33, 38, 44, 51, 59, 68, 78, 90];
var countsAtEachLevel =   [18, 5, 3, 2, 2, 2, 1, 1, 1,  1,  1,  1,  1, 1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  9];

Quantizer.generateQuantizations = function () {
    var quantizations = [];

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

    console.log(quantizeAtEachLevel.map(Results.pad).join(''));
    console.log(countsAtEachLevel.map(Results.pad).join(''));
    console.log(levelRanges.map(Results.pad).join(''));
    console.log(numLevels.map(Results.pad).join(''));
    console.log(errors.map(Results.pad).join(''));

    return quantizations;
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
    while (quantizations[low] === 0) {
        low--;
    }
    while (quantizations[high] === 0) {
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
