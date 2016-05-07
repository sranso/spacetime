'use strict';
var Results = {};
(function () {

var groupSize = 5;
var lineSize = 6 * groupSize;

Results.create = function (positions) {
    var velocities = [];
    var accelerations = [];

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

    return {
        positions: positions,
        velocities: velocities,
        accelerations: accelerations,
    };
};


Results.output = function (results) {
    console.log('---------');
    console.log('');

    var k;
    for (k = 0; k <= (results.positions.length - lineSize); k += lineSize) {
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
            text += Results.pad(values[k + j + i]);
        }
        text += '  ';
    }
    console.log(text);
};

})();
