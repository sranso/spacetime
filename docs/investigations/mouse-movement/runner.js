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

var running = false;
var results;
var quantizations;
var animationRequestId;

Runner.initialize = function () {
    quantizations = Quantizer.generateQuantizations();
    Ui.initialize();
};

Runner.toggleRunning = function (x, y) {
    if (running) {
        stop();
    } else {
        start(x, y);
    }
    running = !running;
};

var start = function (x, y) {
    current.x = x;
    current.y = y;
    current.adjustedX = x;
    current.adjustedY = y;
    last = cloneState(current);

    console.log('Recording...\n\n\n\n\n\n\n');
    Ui.startRunning();

    results = Results.create();
    Runner.run();
};

var stop = function () {
    Ui.stopRunning();
    window.cancelAnimationFrame(animationRequestId);
    Results.output(results);
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

Runner.run = function () {
    current.adjustedX = adjust(current.x, last.x, last.adjustedX);
    current.adjustedY = adjust(current.y, last.y, last.adjustedY);

    Results.collect(results, current.x);
    Ui.draw(current);

    animationRequestId = window.requestAnimationFrame(Runner.run);

    last = cloneState(current);
};

Runner.initialize();

})();
