'use strict';
var Analysis = {};
(function () {

var groupSize = 5;
var lineSize = 6 * groupSize;

Analysis.create = function () {
    return {
        positions: [],
    };
};

Analysis.collect = function (analysis, x) {
    analysis.positions.push(x);
};

Analysis.outputResults = function (analysis, quantizations) {

    ///////// Calculate results

    var positions = analysis.positions;
    var velocities = [];
    var accelerations = [];
    var quantizationLevels = [];

    var i;
    var lastPosition = positions[0];
    var lastVelocity = 0;
    for (i = 0; i < positions.length; i++) {
        var position = positions[i];
        var velocity = position - lastPosition;
        var acceleration = velocity - lastVelocity;
        velocities[i] = velocity;
        accelerations[i] = acceleration;
        quantizationLevels[i] = Quantize.levelFromDiff(quantizations, velocity);

        lastPosition = position;
        lastVelocity = velocity;
    }

    ///////// Output results

    var k;
    for (k = 0; k < positions.length; k += lineSize) {
        // Comment or uncomment the below as desired.
        outputLine(positions, k);
        outputLine(velocities, k);
        // outputLine(accelerations, k);
        outputLine(quantizationLevels, k);
    }
};

Analysis.pad = function (num) {
    return ('    ' + num).slice(-5);
};

var outputLine = function (values, k) {
    var text = '';
    var j;
    for (j = 0; j < lineSize; j += groupSize) {
        var i;
        for (i = 0; i < groupSize; i++) {
            var value = values[k + j + i] || 0;
            text += Analysis.pad(value);
        }
        text += '  ';
    }
    console.log(text);
};

})();
