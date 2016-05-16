'use strict';
var Main = {};
(function () {

// State variables:
//   * adjusted{X,Y} are the x/y values after the
//     change in x/y has been quantized.
var current = {
    x: 0,
    y: 0,
    adjustedX: 0,
    adjustedY: 0,
};
var last = current;

var running = false;
var animationRequestId;

var cloneState = function (state) {
    return {
        x: state.x,
        y: state.y,
        adjustedX: state.adjustedX,
        adjustedY: state.adjustedY,
    };
};

Main.initialize = function () {
    Ui.initialize();
};

Main.toggleRunning = function (x, y) {
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

    Ui.startRunning();
    Main.run();
};

var stop = function () {
    Ui.stopRunning();
    window.cancelAnimationFrame(animationRequestId);
};

Main.updatePosition = function (newX, newY) {
    current.x = newX;
    current.y = newY;
};

Main.run = function () {
    current.adjustedX = Quantize.adjustPosition(current.x, last.x, last.adjustedX);
    current.adjustedY = Quantize.adjustPosition(current.y, last.y, last.adjustedY);

    Ui.draw(current);

    last = cloneState(current);
    animationRequestId = window.requestAnimationFrame(Main.run);
};

Main.initialize();

})();
