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
    DrawEnvironment.setup();
    DrawPlayer.setup();
    drawSelectionInfoSetup();
};

Draw.draw = function () {
    DrawSteps.draw();
    DrawStretches.draw();
    DrawEnvironment.draw();
    DrawPlayer.draw();
    drawSelectionInfo();
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
};


///////////////// Selections

var drawSelectionInfoSetup = function () {
    selectionInfoEl = d3.select('#selection');
};

var drawSelectionInfo = function () {
    var selections = [
        Global.selection.foreground,
        Global.selection.background,
    ];

    var selectionEls = selectionInfoEl.selectAll('.selection-info')
        .data(selections) ;

    selectionEls.select('.selection-color-border')
        .style('border-color', function (d) {
            return d.group ? '#555' : '#eee';
        }) ;

    selectionEls.select('.selection-color')
        .style('background-color', function (d) {
            if (d.group) {
                if (d.group.remember) {
                    var c = d.group.color;
                } else {
                    var c = [0, 0, 78];
                }
                return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
            }
            return 'white';
        }) ;
};

})();
