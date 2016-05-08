'use strict';
var Runner = {};
(function () {

// adjusted{X,Y} are the x/y values after the
// change in x/y has been quantized.
var current = {
    x: 0,
    y: 0,
    adjustedX: 0,
    adjustedY: 0,
};
var last = current;

var running = false;
var analysis;
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
    quantizations = Quantize.generateQuantizations();
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

    analysis = Analysis.create();

    Ui.startRunning();
    Runner.run();
};

var stop = function () {
    Ui.stopRunning();
    window.cancelAnimationFrame(animationRequestId);
    Analysis.outputResults(analysis, quantizations);
};

Runner.updatePosition = function (newX, newY) {
    current.x = newX;
    current.y = newY;
};

Runner.run = function () {
    current.adjustedX = Quantize.adjustPosition(quantizations, current.x, last.x, last.adjustedX);
    current.adjustedY = Quantize.adjustPosition(quantizations, current.y, last.y, last.adjustedY);

    Analysis.collect(analysis, current.adjustedX);
    Ui.draw(current);

    animationRequestId = window.requestAnimationFrame(Runner.run);

    last = cloneState(current);
};

Runner.initialize();

})();
