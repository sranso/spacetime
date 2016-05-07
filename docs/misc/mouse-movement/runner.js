'use strict';
var Runner = {};
(function () {

var cloneState = function (state) {
    return {
        x: state.x,
        y: state.y,
        adjustedX: state.adjustedX,
        adjustedY: state.adjustedY,
    };
};

var current = {
    x: 0,
    y: 0,
    adjustedX: 0,
    adjustedY: 0,
};
var last = cloneState(current);

var positions = new Array(80);
var positionIndex = positions.length;

var quantizations;

Runner.initialize = function () {
    quantizations = Quantizer.generateQuantizations();
    Ui.initialize();
    window.requestAnimationFrame(Runner.run);
};

Runner.start = function (startX, startY) {
    current.x = startX;
    current.y = startY;
    current.adjustedX = startX;
    current.adjustedY = startY;
    last = cloneState(current);

    positionIndex = 0;
};

Runner.updatePosition = function (newX, newY) {
    current.x = newX;
    current.y = newY;
};

var adjust = function (x, lastX, lastAdjustedX) {
    var positionDiff = x - lastX;
    var velocity = x - lastAdjustedX;
    var diff = Quantizer.quantize(quantizations, positionDiff, velocity);
    return lastAdjustedX + diff;
};

Runner.run = function (now) {
    current.adjustedX = adjust(current.x, last.x, last.adjustedX);
    current.adjustedY = adjust(current.y, last.y, last.adjustedY);

    if (positionIndex < positions.length) {
        positions[positionIndex] = current.x;
        positionIndex++;
        if (positionIndex === positions.length) {
            var results = Results.create(positions);
            Results.output(results);
        }
    }

    Ui.draw(current);

    window.requestAnimationFrame(Runner.run);

    last = cloneState(current);
};

Runner.initialize();

})();
