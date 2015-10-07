'use strict';
var Ui = {};
(function () {

Ui.setup = function () {
    Keyboard.setup();
    Webgl.setup();
    drawOverallSetup();
};

Ui.draw = function () {
    __stats.draw_time = performance.now();

    Global.drawTick += 1;

    if (Global.fullScreen) {
        FullScreen.draw();
    } else {
        var info = GridUi.drawInfo();
        GridUi.startDraw(info);
        Webgl.clear();
        CellUi.draw(info);
        AreaUi.draw(info);
    }
    __stats.draw_time = performance.now() - __stats.draw_time;
};

var drawOverallSetup = function () {
    d3.select(document)
        .on('keydown', function () { Keyboard.inputEvent(Keyboard.keyForEvent(), 'down') })
        .on('keyup', function () { Keyboard.inputEvent(Keyboard.keyForEvent(), 'up') })
        .on('keypress', function () {
            Keyboard.keypressEvent(d3.event.keyCode)
        })
        .on('mousedown', function () {
            Global.currentInput.mouseDown = true;
            if (!d3.event.shiftKey) {
                Do.deselectCell();
            }
        })
        .on('mouseup', function () {
            Global.currentInput.mouseDown = false;
        })
        .on('mousemove', function () {
            Global.currentInput.mouseX = d3.event.clientX;
            Global.currentInput.mouseY = window.innerHeight - d3.event.clientY;
        })
        .on('contextmenu', function () {
            d3.event.preventDefault();
        })
        .on('scroll', function () {
            Do.maybeRedrawAfterScroll(document.body.scrollTop, document.body.scrollLeft);
        }) ;

    d3.select(window)
        .on('resize', function () {
            Do.maybeRedrawAfterScroll(document.body.scrollTop, document.body.scrollLeft);
        }) ;
};

})();
