'use strict';
var Draw = {};
(function () {

Draw.trackContainer = null;
Draw.trackHtml = null;
Draw.trackSvg = null;
Draw.trackForegroundIndices = null;

var selectionInfoEl;

Draw.setup = function () {
    drawOverallSetup();
    DrawSteps.setup();
    DrawStretches.setup();
    DrawAutocomplete.setup();
    DrawEnvironment.setup();
    DrawPlayer.setup();
};

Draw.draw = function () {
    DrawSteps.draw();
    DrawStretches.draw();
    DrawAutocomplete.draw();
    DrawEnvironment.draw();
    DrawPlayer.draw();
};

var drawOverallSetup = function() {
    Draw.trackContainer = d3.select('#track');

    Draw.trackSvg = d3.select('svg#track-svg');
    Draw.trackHtml = d3.select('div#track-html');
    Draw.trackForegroundIndices = d3.select('div#track-foreground-indices');

    d3.select(document)
        .on('keydown', function () { Input.inputEvent(Input.keyForEvent(), 'down') })
        .on('keyup', function () { Input.inputEvent(Input.keyForEvent(), 'up') })
        .on('keypress', function () {
            window.getSelection().removeAllRanges();
            Main.maybeUpdate(function () {
                Global.inputStepView = null;
                Global.inputForegroundIndexStretch = null;
                Global.connectStepView = null;
            });
            Input.keypressEvent(d3.event.keyCode)
        })
        .on('mousemove', Main.mouseMove)
        .on('mouseup', Main.mouseUp)
        .on('mousedown', Main.mouseDown)
        .on('contextmenu', function () {
            d3.event.preventDefault();
        }) ;

    d3.select('#canvas')
        .on('mousemove', function () {
            var mouse = d3.mouse(this);
            Global.mouseX.result = Math.max(0, Math.min(mouse[0], Global.canvasFullWidth - 1));
            var height = Global.canvasFullHeight - 1;
            Global.mouseY.result = Math.max(0, Math.min(height - mouse[1], height));
            Main.update();
        })
        .on('mousedown', function () {
            Global.mouseDown.result = true;
            Main.update();
        }) ;

    Draw.trackHtml.append('div')
        .attr('class', 'selection-area-background') ;
};

})();
