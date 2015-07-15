'use strict';
var Draw = {};
(function () {

Draw.trackContainer = null;
Draw.trackHtml = null;
Draw.trackSvg = null;
Draw.trackForegroundIndices = null;

var selectionInfoEl;
var controlContainer;
var environmentContainer;

var superStepTopLength = 22;
var superStepBottomLength = 4;

Draw.setup = function () {
    drawOverallSetup();
    DrawSteps.setup();
    DrawStretches.setup();
    drawEnvironmentSetup();
    drawControlSetup();
    drawSelectionInfoSetup();
};

Draw.draw = function () {
    DrawSteps.draw(Global.stepViews);
    DrawStretches.draw();
    drawControl();
    drawEnvironment();
    drawSelectionInfo();
};

var drawOverallSetup = function() {
    Draw.trackContainer = d3.select('#track');

    Draw.trackSvg = d3.select('svg#track-svg');
    Draw.trackHtml = d3.select('div#track-html');
    Draw.trackForegroundIndices = d3.select('div#track-foreground-indices');

    Draw.trackHtml.append('div')
        .attr('class', 'selection-area-background') ;

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

    d3.select('#add-environment')
        .on('click', function () {
            var step = Step.createForEnvironment();
            var stepView = StepView.create(step);
            Global.environment.push(stepView);
            Main.update();
            d3.select(stepView.__el__).select('.name').node().focus();
        }) ;
};


///////////////// Control

var drawControlSetup = function () {
    controlContainer = d3.select('#control');
};

var drawControl = function () {

    var playerEls = controlContainer.selectAll('.player')
        .data([Global.player], function (d) { return d.id }) ;

    var playerEnterEls = playerEls.enter().append('div')
        .attr('class', 'player') ;


    var goToBeginningEnterEls = playerEnterEls.append('div')
        .attr('class', 'go-to-beginning player-result')
        .datum(function (d) { return d.atBeginning.stepView }) ;

    goToBeginningEnterEls.append('div')
        .attr('class', 'go-to-beginning-button')
        .on('click', function (d) {
            if (!Global.inputStepView && !Global.connectStepView) {
                d.player.time.result = 0;
                Main.update();
                d3.event.stopPropagation();
            }
        }) ;

    var playPauseEnterEls = playerEnterEls.append('div')
        .attr('class', 'play-pause player-result')
        .datum(function (d) { return d.playing.stepView }) ;

    playPauseEnterEls.append('div')
        .attr('class', 'play-pause-button')
        .on('mousedown', function (d) {
            if (!Global.inputStepView && !Global.connectStepView) {
                d.step.result = !d.step.result;
                Main.update();
                d3.event.stopPropagation();
            }
        }) ;

    var repeatEnterEls = playerEnterEls.append('div')
        .attr('class', 'repeat player-result')
        .datum(function (d) { return d.repeating.stepView }) ;

    repeatEnterEls.append('div')
        .attr('class', 'repeat-button')
        .on('click', function (d) {
            if (!Global.inputStepView && !Global.connectStepView) {
                d.step.result = !d.step.result;
                Main.update();
                d3.event.stopPropagation();
            }
        }) ;


    var currentTimeContainerEnterEls = playerEnterEls.append('div')
        .attr('class', 'time-info-container current-time-container') ;

    var currentTimeEnterEls = currentTimeContainerEnterEls.append('div')
        .attr('class', 'time-info current-time player-result')
        .datum(function (d) { return d.time.stepView }) ;

    currentTimeEnterEls.append('div')
        .attr('class', 'current-time-content time-info-content') ;


    var playerSliderEnterEls = playerEnterEls.append('div')
        .attr('class', 'slider') ;

    playerSliderEnterEls.append('div')
        .attr('class', 'slider-bar') ;

    playerSliderEnterEls.append('div')
        .attr('class', 'slider-bar-completed') ;


    var sliderHandleEnterEls = playerSliderEnterEls.append('div')
        .attr('class', 'slider-handle player-result')
        .datum(function (d) { return d.time.stepView }) ;

    sliderHandleEnterEls.append('div')
        .attr('class', 'slider-handle-knob') ;


    var endTimeContainerEnterEls = playerEnterEls.append('div')
        .attr('class', 'time-info-container end-time-container') ;

    var endTimeEnterEls = endTimeContainerEnterEls.append('div')
        .attr('class', 'time-info end-time player-result')
        .datum(function (d) { return d.endTime.stepView }) ;

    endTimeEnterEls.append('div')
        .attr('class', 'end-time-content time-info-content') ;


    var playerResultEnterEls = playerEnterEls.selectAll('.player-result')
        .on('mousedown', function (d) {
            if (Global.connectStepView) {
                Step.setEnvironmentUpdatedBy(d);
            } else if (Global.inputStepView) {
                Step.insertOrUpdateReference(d);
                d3.event.preventDefault();
            }
            d3.event.stopPropagation();
        })
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverResultStepView = d;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverResultStepView === d) {
                        Global.hoverResultStepView = null;
                    }
                });
            }, 0);
        }) ;

    DrawHelper.drawResultBorder(playerResultEnterEls);


    playerEls.exit().remove();

    playerEls
        .attr('class', function (d) {
            var classes = ['player'];
            if (d.playing.result) {
                classes.push('playing');
            } else {
                classes.push('paused');
            }
            if (d.repeating.result) {
                classes.push('repeating');
            }
            return classes.join(' ');
        }) ;

    playerEls.selectAll('.player-result')
        .attr('class', function (d) {
            var classes = this.classList;
            classes = _.difference(classes, [
                'referenced-by-color',
                'reference-color-1',
                'reference-color-2',
                'reference-color-3',
                'reference-color-4',
                'reference-color-5-or-more',
            ]);
            classes.push(DrawReferences.colorForResult(d));
            return classes.join(' ');
        }) ;

    var sliderLeft = function (d) {
        var fractionComplete = d.player.time.result / d.player.endTime.result;
        return Math.floor(fractionComplete * 140) + 'px';
    };
    playerEls.select('.slider-bar-completed')
        .datum(function (d) { return d.time.stepView })
        .style('width', sliderLeft) ;

    playerEls.select('.slider-handle')
        .datum(function (d) { return d.time.stepView })
        .style('left', sliderLeft) ;

    playerEls.select('.current-time-content')
        .text(function (d) { return Math.floor(d.time.result) }) ;

    playerEls.select('.end-time-content')
        .text(function (d) { return Math.floor(d.endTime.result) }) ;
};


///////////////// Environment

var drawEnvironmentSetup = function () {
    environmentContainer = d3.select('#environment');
};

var drawEnvironment = function () {
    var environmentEls = environmentContainer.selectAll('.environment')
        .data(Global.environment) ;

    var environmentEnterEls = environmentEls.enter().append('div')
        .attr('class', 'environment')
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverResultStepView = d;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverResultStepView === d) {
                        Global.hoverResultStepView = null;
                    }
                });
            }, 0);
        }) ;

    var nameEnterEls = environmentEnterEls.append('div')
        .attr('class', 'name')
        .attr('contenteditable', function (d) { return d.step.editable })
        .on('input', function (d) {
            d.step.text = this.textContent;
        })
        .on('keypress', function () {
            d3.event.stopPropagation();
        })
        .on('keydown', function () {
            d3.event.stopPropagation();
        })
        .on('keyup', function () {
            d3.event.stopPropagation();
        }) ;

    var resultEnterEls = environmentEnterEls.append('div')
        .attr('class', 'result')
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverResultStepView = d;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverResultStepView === d) {
                        Global.hoverResultStepView = null;
                    }
                });
            }, 0);
        })
        .on('mousedown', function (d) {
            if (Global.connectStepView) {
                Step.setEnvironmentUpdatedBy(d);
            } else if (Global.inputForegroundIndexStretch) {
                Series.setActiveSeriesTargetLengthBy(d);
            } else {
                Step.insertOrUpdateReference(d);
            }
            d3.event.stopPropagation();
            d3.event.preventDefault();
        }) ;

    resultEnterEls.append('div')
        .attr('class', 'result-content-text') ;

    resultEnterEls.append('div')
        .attr('class', 'result-content-canvas') ;

    DrawHelper.drawResultBorder(resultEnterEls);

    environmentEnterEls.append('div')
        .style('clear', 'both') ;


    environmentEls.exit().remove();

    var environment = d3.select('#environment').node();
    var addEnvironment = d3.select('#add-environment').node();
    environment.removeChild(addEnvironment);
    environment.appendChild(addEnvironment);

    environmentEls.each(function (d) { d.__el__ = this });

    environmentEls
        .attr('class', function (d) {
            var classes = ['environment'];
            var step = d.steps[d.steps.length - 1];
            if (step.result && Quads.isQuads(step.result)) {
                classes.push('canvas-result');
            } else {
                classes.push('text-result');
            }
            return classes.join(' ');
        }) ;

    environmentEls.select('.result')
        .attr('class', function (d) {
            return 'result ' + DrawReferences.colorForResult(d);
        }) ;

    environmentEls.select('.name')
        .text(function (d) { return d.step.text }) ;

    environmentEls.select('.result-content-text')
        .text(function (d) {
            if (d.step.result === null) {
                return '';
            }
            if (Quads.isQuads(d.step.result)) {
                return 'pic';
            } else {
                return DrawHelper.clipNumber(d.step.result, 12);
            }
        }) ;

    environmentEls.select('.result-content-canvas')
        .each(function (d) {
            var result = d.step.result;
            if (result && Quads.isQuads(result)) {
                Webgl.drawResult(this, result);
            } else {
                while (this.firstChild) {
                    this.removeChild(this.firstChild);
                }
            }
        });
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
