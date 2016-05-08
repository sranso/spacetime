'use strict';
var Analysis = {};
(function () {

var groupSize = 5;
var lineSize = 6 * groupSize;

Analysis.create = function () {
    return {
        positions: [],
        velocities: [],
        accelerations: [],
    };
};

Analysis.collect = function (analysis, x) {
    analysis.positions.push(x);
};

Analysis.output = function (analysis) {

    ///////// Calculate results

    var i;
    var lastPosition = analysis.positions[0];
    var lastVelocity = 0;
    for (i = 0; i < analysis.positions.length; i++) {
        var position = analysis.positions[i];
        var velocity = position - lastPosition;
        var acceleration = velocity - lastVelocity;
        analysis.velocities[i] = velocity;
        analysis.accelerations[i] = acceleration;

        lastPosition = position;
        lastVelocity = velocity;
    }

    ///////// Output results

    var k;
    for (k = 0; k < analysis.positions.length; k += lineSize) {
        line(analysis.positions, k);
        line(analysis.velocities, k);
        line(analysis.accelerations, k);
    }
};

Analysis.pad = function (num) {
    return ('    ' + num).slice(-5);
};

var line = function (values, k) {
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
