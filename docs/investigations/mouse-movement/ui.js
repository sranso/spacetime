'use strict';
var Ui = {};
(function () {

var boxSize = 10;

var canvasTop = document.getElementById('canvas-top');
var canvasBottom = document.getElementById('canvas-bottom');
var ctxTop = canvasTop.getContext('2d');
var ctxBottom = canvasBottom.getContext('2d');

var spaceToggle = false;

Ui.initialize = function () {
    canvasTop.width = canvasTop.offsetWidth;
    canvasTop.height = canvasTop.offsetHeight;

    canvasBottom.width = canvasBottom.offsetWidth;
    canvasBottom.height = canvasBottom.offsetHeight;

    ctxBottom.fillStyle = '#ff0000';
    ctxTop.fillStyle = '#000000';

    canvasTop.addEventListener('click', function (event) {
        Runner.toggleRunning(event.clientX, event.clientY);
    });

    canvasTop.addEventListener('mousemove', function (event) {
        Runner.updatePosition(event.clientX, event.clientY);
    });

    window.addEventListener('keydown', function (event) {
        if (event.shiftKey) {
            if (event.keyCode === 32) {
                spaceToggle = !spaceToggle;
                event.preventDefault();
            }
            showHideCanvases(event.shiftKey);
        }
    });

    window.addEventListener('keyup', function (event) {
        if (!event.shiftKey) {
            spaceToggle = false;
            showHideCanvases(event.shiftKey);
        }
    });
};

var showHideCanvases = function (shiftDown) {
    canvasTop.style.opacity = +(shiftDown === spaceToggle);
    canvasBottom.style.opacity = +!spaceToggle;
};

Ui.startRunning = function () {
    document.body.className = 'running';

    ctxTop.clearRect(0, 0, canvasTop.width, canvasTop.height);
    ctxBottom.clearRect(0, 0, canvasBottom.width, canvasBottom.height);

    console.log('Recording...\n\n\n\n\n\n\n');
};

Ui.stopRunning = function () {
    document.body.className = '';
};

Ui.draw = function (state) {
    var offsetLeft = canvasTop.offsetLeft;
    var offsetTop = canvasTop.offsetTop - document.body.scrollTop;

    ctxBottom.fillRect(state.x - offsetLeft, state.y - offsetTop, boxSize, boxSize);
    ctxTop.fillRect(state.adjustedX - offsetLeft, state.adjustedY - offsetTop, boxSize, boxSize);
};

})();
