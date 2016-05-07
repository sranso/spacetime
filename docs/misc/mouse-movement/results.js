'use strict';
var Results = {};
(function () {

var groupSize = 5;
var lineSize = 6 * groupSize;

Results.create = function () {
    return {
        positions: [],
        velocities: [],
        accelerations: [],
    };
};

Results.collect = function (results, x) {
    results.positions.push(x);
};

Results.output = function (results) {

    ///////// Calculate results

    var i;
    var lastPosition = results.positions[0];
    var lastVelocity = 0;
    for (i = 0; i < results.positions.length; i++) {
        var position = results.positions[i];
        var velocity = position - lastPosition;
        var acceleration = velocity - lastVelocity;
        results.velocities[i] = velocity;
        results.accelerations[i] = acceleration;

        lastPosition = position;
        lastVelocity = velocity;
    }

    ///////// Output results

    var k;
    for (k = 0; k < results.positions.length; k += lineSize) {
        line(results.positions, k);
        line(results.velocities, k);
        line(results.accelerations, k);
    }
};

Results.pad = function (num) {
    return ('    ' + num).slice(-5);
};

var line = function (values, k) {
    var text = '';
    var j;
    for (j = 0; j < lineSize; j += groupSize) {
        var i;
        for (i = 0; i < groupSize; i++) {
            var value = values[k + j + i] || 0;
            text += Results.pad(value);
        }
        text += '  ';
    }
    console.log(text);
};

})();
