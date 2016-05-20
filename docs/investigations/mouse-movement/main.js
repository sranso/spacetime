'use strict';
var Main = {};
(function () {

// State variables:
//   * adjusted{X,Y} are the x/y values after the
//     change in x/y has been quantized.
var current = {
    level: 0,
    x: 0,
    y: 0,
    adjustedX: 0,
    adjustedY: 0,
};
var last = current;

var running = false;
var animationRequestId;
window.levelHistogram = null;
window.levelChangeHistogram = null;

var cloneState = function (state) {
    return {
        level: state.level,
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

    var minLevel = Quantize.levelFromDiff(-1440);
    levelHistogram = Histogram.create(minLevel);
    levelChangeHistogram = Histogram.create(minLevel);

    Ui.startRunning();
    Main.run();
};

var stop = function () {
    Ui.stopRunning();
    Histogram.output(levelHistogram);
    Histogram.output(levelChangeHistogram);
    window.cancelAnimationFrame(animationRequestId);
};

Main.updatePosition = function (newX, newY) {
    current.x = newX;
    current.y = newY;
};

Main.run = function () {
    current.adjustedX = Quantize.adjustPosition(current.x, last.x, last.adjustedX);
    current.adjustedY = Quantize.adjustPosition(current.y, last.y, last.adjustedY);

    current.level = Quantize.levelFromDiff(current.adjustedX - last.adjustedX);
    Histogram.push(levelHistogram, current.level);
    Histogram.push(levelChangeHistogram, current.level - last.level);

    Ui.draw(current);

    last = cloneState(current);
    animationRequestId = window.requestAnimationFrame(Main.run);
};

Main.initialize();

})();
