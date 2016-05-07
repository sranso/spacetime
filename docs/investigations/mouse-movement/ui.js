'use strict';
var Ui = {};
(function () {

var boxSize = 10;

var canvasTop = document.getElementById('canvas-top');
var canvasBottom = document.getElementById('canvas-bottom');
var ctxTop = canvasTop.getContext('2d');
var ctxBottom = canvasBottom.getContext('2d');

var shiftDown = false;
var spaceToggle = false;
var running = false;

Ui.initialize = function () {
    canvasTop.width = canvasTop.offsetWidth;
    canvasTop.height = canvasTop.offsetHeight;

    canvasBottom.width = canvasBottom.offsetWidth;
    canvasBottom.height = canvasBottom.offsetHeight;

    ctxBottom.fillStyle = '#ff0000';
    ctxTop.fillStyle = '#000000';

    canvasTop.addEventListener('click', function (event) {
        if (running) {
            Runner.stop();
            document.body.className = '';
        } else {
            Runner.start(event.clientX, event.clientY);
            document.body.className = 'running';

            console.log('Recording...\n\n\n\n\n\n\n');

            ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height);
            ctxBottom.clearRect(0, 0, canvasBottom.width, canvasBottom.height);
        }
        running = !running;
    });

    canvasTop.addEventListener('mousemove', function (event) {
        Runner.updatePosition(event.clientX, event.clientY);
    });

    window.addEventListener('keydown', function (event) {
        if (event.shiftKey) {
            shiftDown = true;

            if (event.keyCode === 32) {
                spaceToggle = !spaceToggle;
                event.preventDefault();
            }
            showHideCanvases();
        }
    });

    window.addEventListener('keyup', function (event) {
        if (!event.shiftKey) {
            shiftDown = false;
            spaceToggle = false;
            showHideCanvases();
        }
    });
};

var showHideCanvases = function () {
    canvasTop.style.opacity = +(shiftDown === spaceToggle);
    canvasBottom.style.opacity = +!spaceToggle;
};

Ui.draw = function (state) {
    var offsetLeft = canvasTop.offsetLeft;
    var offsetTop = canvasTop.offsetTop - document.body.scrollTop;
    ctxBottom.fillRect(state.x - offsetLeft, state.y - offsetTop, boxSize, boxSize);
    ctxTop.fillRect(state.adjustedX - offsetLeft, state.adjustedY - offsetTop, boxSize, boxSize);
};

})();
