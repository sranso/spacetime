'use strict';
var Runner = {};
(function () {

var x = 0;
var y = 0;
var lastX = 0;
var lastY = 0;
var lastAdjustedX = 0;
var lastAdjustedY = 0;

var positions = new Array(80);
var positionIndex = positions.length;

var quantizations;

Runner.initialize = function () {
    quantizations = Quantizer.generateQuantizations();
    Ui.initialize();
    window.requestAnimationFrame(Runner.run);
};

Runner.start = function (startX, startY) {
    x = startX;
    y = startY;
    lastX = x;
    lastY = y;
    lastAdjustedX = x;
    lastAdjustedY = y;

    positionIndex = 0;
};

Runner.updatePosition = function (newX, newY) {
    x = newX;
    y = newY;
};

Runner.run = function (now) {
    var positionDiff = x - lastAdjustedX;
    var velocity = x - lastX;
    var diffX = Quantizer.quantize(quantizations, positionDiff, velocity);
    var adjustedX = lastAdjustedX + diffX;

    positionDiff = y - lastAdjustedY;
    velocity = y - lastY;
    var diffY = Quantizer.quantize(quantizations, positionDiff, velocity);
    var adjustedY = lastAdjustedY + diffY;

    if (positionIndex < positions.length) {
        positions[positionIndex] = x;
        positionIndex++;
        if (positionIndex === positions.length) {
            var results = Results.create(positions);
            Results.output(results);
        }
    }

    Ui.draw(x, y, adjustedX, adjustedY);

    window.requestAnimationFrame(Runner.run);

    lastY = y;
    lastX = x;
    lastAdjustedX = adjustedX;
    lastAdjustedY = adjustedY;
};

Runner.initialize();

})();
