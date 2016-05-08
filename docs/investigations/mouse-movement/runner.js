'use strict';
var Runner = {};
(function () {

var current = {
    x: 0,
    y: 0,
    adjustedX: 0,
    adjustedY: 0,
};
var last = current;

var running = false;
var results;
var quantizations;
var animationRequestId;

var cloneState = function (state) {
    return {
        x: state.x,
        y: state.y,
        adjustedX: state.adjustedX,
        adjustedY: state.adjustedY,
    };
};

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

Runner.run = function () {
    current.adjustedX = Quantizer.adjust(quantizations, current.x, last.x, last.adjustedX);
    current.adjustedY = Quantizer.adjust(quantizations, current.y, last.y, last.adjustedY);

    Results.collect(results, current.x);
    Ui.draw(current);

    animationRequestId = window.requestAnimationFrame(Runner.run);

    last = cloneState(current);
};

Runner.initialize();

})();
