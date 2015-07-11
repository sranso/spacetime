'use strict';
var Draw = {};
(function () {

Draw.trackContainer = null;
Draw.trackHtml = null;

var trackSvg;
var trackForegroundIndices;
var foregroundIndexInputEl;
var selectionInfoEl;
var __stretchViews = [];
var controlContainer;
var environmentContainer;

Draw.setup = function () {
    drawOverallSetup();
    drawStepsSetup();
    drawEnvironmentSetup();
    drawControlSetup();
    drawSelectionInfoSetup();
    drawStretchesSetup();
    drawForegroundIndicesSetup();
};

Draw.draw = function () {
    drawSteps(Global.stepViews);
    drawControl();
    drawEnvironment();
    computeStretchPositions(Group.groupsToDraw(Global.groups));
    drawSelectionInfo();
    drawStretches(__stretchViews);
    drawForegroundIndices(__stretchViews);
};

var verticallyPositionStretchView = function (stretchView) {
    var first = stretchView.steps[0];
    var last = stretchView.steps[stretchView.steps.length - 1];
    var firstTop = first.step.__el__.offsetTop;
    var lastTop = last.step.__el__.offsetTop;
    var lastHeight = last.step.__el__.offsetHeight;
    stretchView.y = firstTop;
    stretchView.h = lastTop + lastHeight - firstTop;
};

var computeStretchPositions = function (groups, stepViews) {
    __stretchViews = [];

    var offset = (
        Draw.trackHtml.node().offsetLeft +
        d3.select('.step-box').node().offsetLeft +
        d3.select('.selection-area').node().offsetLeft
    );

    var x = offset;
    var selectionX = {
        foreground: x + 13,
        background: x + 31,
    };
    x -= 30 + 9;

    _.each(groups, function (group) {
        _.each(group.stretchViews, function (stretchView) {
            verticallyPositionStretchView(stretchView);
            stretchView.x = x;
            stretchView.w = 9;
            stretchView.kind = 'unselected';

            __stretchViews.push(stretchView);
        });
        x -= 9;
    });
    _.each(['foreground', 'background'], function (kind) {
        var group = Global.selection[kind].group;
        if (group) {
            _.each(group.stretchViews, function (stretchView) {
                stretchView.kind = 'selected';
            });
            _.each(Group.computeStretchViews(group), function (stretchView) {
                stretchView.kind = kind;
                stretchView.selectedArea = true;
                verticallyPositionStretchView(stretchView);
                stretchView.x = selectionX[kind];
                stretchView.w = 11;
                __stretchViews.push(stretchView);
            });
        }
    });
};


var drawOverallSetup = function() {
    Draw.trackContainer = d3.select('#track');

    trackSvg = d3.select('svg#track-svg');
    trackForegroundIndices = d3.select('div#track-foreground-indices');
    Draw.trackHtml = d3.select('div#track-html');

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
        .on('mousedown', function () {
            var step = Step.createForEnvironment();
            var stepView = StepView.create(step);
            Global.environment.push(stepView);
            Main.update();
            d3.select(stepView.__el__).select('.name').node().focus();
        }) ;
};


///////////////// Steps

var drawStepsSetup = function () {
};

var stepHtml = function (stepView) {
    var parsed = DrawHelper.lexStepView(stepView);
    var references = stepView.step.references;
    var htmls = _.map(parsed, function (token) {
        if (token.type === 'reference') {
            var source = references[token.referenceI].source;
            if (source.result === null) {
                var result = '-';
            } else if (Quads.isQuads(source.result)) {
                var result = 'pic';
            } else {
                var result = DrawHelper.clipNumber(source.result, 6);
            }
            var width = 9 + 9 * result.length;
            if (result.indexOf('.') !== -1) {
                width -= 4;
            }
            return '<span class="reference-placeholder reference-' +
                    token.referenceI + '" style="width: ' + width + 'px;">' +
                    token.text + '</span>';
        }
        return token.text;
    });
    return htmls.join('');
};

var drawSteps = function (stepViews) {
    var stepEls = Draw.trackHtml.selectAll('div.step')
        .data(stepViews, function (d) { return d.step.id }) ;

    var stepEnterEls = stepEls.enter().append('div')
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverStepView = d;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverStepView === d) {
                        Global.hoverStepView = null;
                    }
                });
            }, 0);
        }) ;

    var stepBoxEnterEls = stepEnterEls.append('div')
        .attr('class', 'step-box') ;

    var matchesIndicatorContainerEnterEls = stepBoxEnterEls.append('div')
        .attr('class', 'matches-indicator-container')
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverMatchesStepView = d;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverMatchesStepView === d) {
                        Global.hoverMatchesStepView = null;
                    }
                });
            }, 0);
        }) ;

    matchesIndicatorContainerEnterEls.append('div')
        .attr('class', 'matches-indicator') ;

    var enableDisableEnterEls = stepBoxEnterEls.append('div')
        .attr('class', 'enable-disable')
        .on('mousedown', function (d) {
            Step.clickEnableRegion(d);
            d3.event.stopPropagation();
        })
        .on('click', function (d) {
            d3.event.stopPropagation();
        }) ;

    enableDisableEnterEls.append('div')
        .attr('class', 'enable-disable-outer-container') ;

    stepBoxEnterEls.append('div')
        .attr('class', 'selection-area')
        .on('mousedown', function (d) {
            Global.inputStepView = null;
            Global.inputForegroundIndexStretch = null;
            Global.connectStepView = null;
            window.getSelection().removeAllRanges();
            Selection.maybeStart();
            d3.event.stopPropagation();
        });

    var selectionEdgeEnterEls = stepBoxEnterEls.append('div')
        .attr('class', 'selection-edge') ;

    var expressionContainerEnterEls = stepBoxEnterEls.append('div')
        .attr('class', 'expression-container') ;

    expressionContainerEnterEls.append('div')
        .attr('class', 'expression')
        .attr('contenteditable', true)
        .on('focus', function (d) {
            Main.maybeUpdate(function () { Input.startInput(d) });
        })
        .on('blur', function (d) {
            Main.maybeUpdate(function () { Global.inputStepView = null });
        })
        .on('input', function (d) {
            if (d !== Global.inputStepView) {
                Input.startInput(d);
            }
            Step.updateText(this);
        })
        .on('mousedown', function (d) {
            Main.maybeUpdate(function () {
                Input.startInput(d);
                Global.inputForegroundIndexStretch = null;
                Global.connectStepView = null;
            });
            d3.event.stopPropagation();
        })
        .on('keypress', function () {
            d3.event.stopPropagation();
        })
        .on('keydown', function (d) {
            Input.textInputEvent(d, Input.keyForEvent());
        })
        .on('keyup', function () {
            d3.event.stopPropagation();
        }) ;

    var resultEnterEls = stepBoxEnterEls.append('div')
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
            if (Global.inputForegroundIndexStretch) {
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


    stepBoxEnterEls.append('div')
        .style('clear', 'both') ;

    stepEls.exit().remove();

    stepEls.each(function (d) { d.__el__ = this });
    stepEls.order();

    var targetStepView = Main.targetStepView();

    stepEls
        .attr('class', function (d) {
            var classes = ['step'];
            if (MultiStep.isEnabled(d)) {
                classes.push('enabled');
            } else {
                classes.push('disabled');
            }
            if (MultiStep.forceEnabled(d)) {
                classes.push('force-enabled');
            } else if (MultiStep.forceDisabled(d)) {
                classes.push('force-disabled');
            }
            if (_.intersection(d.steps, Global.__activeSteps).length) {
                classes.push('active');
            }
            if (d === Global.hoverStepView) {
                classes.push('hover');
            }
            if (d === Global.inputStepView) {
                classes.push('inputting');
            }
            if (d === Global.connectStepView) {
                classes.push('connecting');
            }
            if (d === targetStepView) {
                classes.push('target');
            }
            if (
                targetStepView &&
                targetStepView.step.matchesId === d.step.matchesId &&
                (!Global.selection.foreground.group ||
                 !Global.selection.foreground.group.remember
                )
            ) {
                classes.push('matches');
                if (Global.hoverMatchesStepView) {
                    classes.push('matches-hover');
                }
            }
            var step = d.steps[d.steps.length - 1];
            if (step.result && Quads.isQuads(step.result)) {
                classes.push('canvas-result');
            } else {
                classes.push('text-result');
            }
            return classes.join(' ');
        })
        .style('height', function (d) { return (d.h - 1) + 'px' })
        .style('top', function (d) { return d.y + 'px' })
        .style('left', function (d) { return d.x + 'px' }) ;

    stepEls.select('.expression-container').each(function (d) {
        var container = d3.select(this);
        var expressionEl = container.select('.expression').node();

        var html = stepHtml(d);
        var cursorOffset = DomRange.currentCursorOffset(expressionEl);
        if (expressionEl.innerHTML !== html) {
            expressionEl.innerHTML = html;
            if (cursorOffset !== -1) {
                DomRange.setCurrentCursorOffset(expressionEl, cursorOffset);
            }
        }
    });

    DrawReferences.updateInputting();

    DrawReferences.draw(stepEls.select('.expression-container'));

    /////////////////// must be after updateInputting

    stepEls.select('.enable-disable')
        .attr('class', function (d) {
            var enabledBy = MultiStep.enabledBy(d);
            var classes = ['enable-disable'];
            if (enabledBy.length) {
                var color = DrawReferences.colorForEnabledBy(d, enabledBy);
                classes.push(color);
                classes.push('enabled-by-connected');
            }
            return classes.join(' ');
        }) ;

    DrawHelper.drawEnableDisableOuter(stepEls);

    stepEls.select('.result')
        .attr('class', function (d) {
            var step = d.steps[d.steps.length - 1];
            if (!step) {
                debugger;
            }
            return 'result ' + DrawReferences.colorForResult(d);
        }) ;

    stepEls.select('.result-content-text')
        .text(function (d) {
            var step = d.steps[d.steps.length - 1];
            if (step.result === null) {
                return '';
            }
            if (Quads.isQuads(step.result)) {
                return 'pic';
            } else {
                return DrawHelper.clipNumber(step.result, 12);
            }
        }) ;

    stepEls.select('.result-content-canvas')
        .each(function (d) {
            var result = d.steps[d.steps.length - 1].result;
            if (result && Quads.isQuads(result)) {
                Webgl.drawResult(this, result);
            } else {
                while (this.firstChild) {
                    this.removeChild(this.firstChild);
                }
            }
        });
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


///////////////// Stretches

var drawStretchesSetup = function () {
};

var drawStretches = function (stretchViews) {
    var stretchEls = trackSvg.selectAll('g.stretch')
        .data(stretchViews) ;

    var stretchEnterEls = stretchEls.enter().append('g');

    stretchEnterEls.append('rect')
        .attr('class', 'background')
        .attr('x', 0.5)
        .attr('y', 2.5)
        .attr('rx', 2)
        .attr('ry', 2) ;

    stretchEnterEls.append('rect')
        .attr('class', 'index-in-series-border')
        .attr('rx', 4)
        .attr('ry', 4) ;

    stretchEnterEls.append('text')
        .attr('class', 'index-in-series') ;

    stretchEnterEls.append('rect')
        .attr('class', 'mouse')
        .attr('x', 0)
        .attr('y', 0)
        .on('mousedown', function (d) {
            var kind = Selection.buttonSelectionKind();
            Global.selection[kind].focus = d.stretch;
            Global.selection[kind].group = d.stretch.group;
            Global.connectStepView = null;
            Main.update();
            d3.event.stopPropagation();
        })
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverIndexStretch = d.stretch;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverIndexStretch === d.stretch) {
                        Global.hoverIndexStretch = null;
                    }
                });
            }, 0);
        }) ;

    stretchEls.exit().remove();

    stretchEls
        .attr('class', function (d) {
            var classes = ['stretch', 'selection-' + d.kind];
            if (d.kind === 'foreground' || d.kind === 'background') {
                if (d.stretch === Global.selection[d.kind].focus) {
                    classes.push('selection-focus');
                }
            }
            if (d.selectedArea) {
                classes.push('selected-area');
            }
            classes.push(DrawReferences.colorForIndex(d));
            return classes.join(' ');
        })
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;

    stretchEls.select('rect.background')
        .attr('width', function (d) { return d.w - 2 })
        .attr('height', function (d) { return d.h - 4 })
        .style('fill', function (d, i) {
            if (d.kind === 'selected') {
                return 'white';
            }
            if (d.stretch.group.remember) {
                var c = d.stretch.group.color;
            } else {
                var c = [0, 0, 78];
            }
            var light = c[2];
            if (d.kind === 'foreground' &&
                d.stretch === Global.selection.foreground.focus) {
                light -= 20;
            }
            return 'hsl(' + c[0] + ',' + c[1] + '%,' + light + '%)';
        }) ;

    var widthOffset = function (d) {
        var series = d.stretch.series;
        if (!series) {
            return 0;
        }
        var text = _.indexOf(series.stretches, d.stretch) + 1;
        return ('' + text).length * 4;
    };

    stretchEls.select('rect.index-in-series-border')
        .attr('y', function (d) { return d.h / 2 - 9 })
        .attr('x', function (d) {
            return -1 - widthOffset(d) / 2;
        })
        .attr('width', function (d) {
            var w = d.kind === 'background' ? 11 : 9;
            return w + widthOffset(d);
        })
        .attr('height', 15) ;

    stretchEls.select('text.index-in-series')
        .attr('x', function (d) {
            return d.kind === 'background' ? 5 : 4;
        })
        .attr('y', function (d) { return d.h / 2 + 2 })
        .text(function (d) {
            var series = d.stretch.series;
            if (series) {
                return _.indexOf(series.stretches, d.stretch) + 1;
            } else {
                return '';
            }
        }) ;

    stretchEls.select('rect.mouse')
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;
};

///////////////// Foreground Indices

var drawForegroundIndicesSetup = function () {
    foregroundIndexInputEl = trackForegroundIndices.append('div')
        .attr('class', 'foreground-index foreground-index-input') ;

    foregroundIndexInputEl.append('div')
        .attr('class', 'foreground-index-content')
        .attr('contenteditable', true)
        .on('blur', function () {
            Main.maybeUpdate(function () { Global.inputForegroundIndexStretch = null });
        })
        .on('mousedown', function () {
            d3.event.stopPropagation();
        })
        .on('input', function () {
            d3.event.stopPropagation();
            Series.setActiveSeriesLength(this.textContent);
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
};

var drawForegroundIndices = function (stretchViews) {
    var foregroundStretchViews = _.filter(stretchViews, function (stretchView) {
        return stretchView.kind === 'foreground';
    });
    var foregroundIndexViews = _.map(foregroundStretchViews, function (stretchView) {
        var stretch = stretchView.stretch;
        var series = stretch.series;
        if (series) {
            var text = _.indexOf(series.stretches, stretch) + 1;
        } else {
            var text = '1';
        }
        return {
            top: stretchView.y + stretchView.h / 2,
            stretch: stretch,
            text: '' + text,
        };
    });

    var foregroundIndexEls = trackForegroundIndices.selectAll('div.foreground-index.static')
        .data(foregroundIndexViews, function (d) { return d.stretch.id }) ;

    var foregroundIndexEnterEls = foregroundIndexEls.enter().append('div')
        .on('click', function (d) {
            var series = d.stretch.series;
            var lastStretch = series.stretches[series.stretches.length - 1];
            Global.selection.foreground.focus = lastStretch;
            Main.maybeUpdate(function () { Global.inputForegroundIndexStretch = lastStretch });
            d3.event.stopPropagation();
        })
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverIndexStretch = d.stretch;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverIndexStretch === d.stretch) {
                        Global.hoverIndexStretch = null;
                    }
                });
            }, 0);
        })
        .on('mousedown', function () {
            d3.event.stopPropagation();
        }) ;

    foregroundIndexEnterEls.append('div')
        .attr('class', 'foreground-index-content') ;

    foregroundIndexEls.exit().remove();

    foregroundIndexEls.each(function (d) { d.__el__ = this });

    foregroundIndexEls
        .attr('class', function (d) {
            var classes = ['foreground-index', 'static'];
            var series = d.stretch.series;
            if (series) {
                classes.push('series');
            }
            classes.push(DrawReferences.colorForIndex(d));
            return classes.join(' ');
        })
        .style('top', function (d) {
            return d.top + 'px';
        }) ;

    foregroundIndexEls.select('.foreground-index-content')
        .text(function (d) { return d.text }) ;


    var targetIndexStretch = Main.targetIndexStretch();
    var targetIndexView = _.find(foregroundIndexViews, function (indexView) {
        return indexView.stretch === targetIndexStretch;
    });
    if (Global.inputForegroundIndexStretch) {
        var wasInputting = foregroundIndexInputEl.classed('inputting');
        foregroundIndexInputEl
            .classed('inputting', true)
            .style('top', function () {
                return targetIndexView.top + 'px';
            }) ;
        if (!wasInputting) {
            var contentEl = foregroundIndexInputEl.select('.foreground-index-content')
                .text(targetIndexView.text) ;
            contentEl.node().focus();
            DomRange.setCurrentCursorOffset(contentEl.node(), targetIndexView.text.length);
        }
    }
    foregroundIndexInputEl
        .attr('class', function () {
            var classes = ['foreground-index', 'foreground-index-input'];
            if (Global.inputForegroundIndexStretch) {
                classes.push('inputting');
            }
            if (targetIndexView) {
                classes.push(DrawReferences.colorForIndex(targetIndexView));
            }
            return classes.join(' ');
        }) ;
};

})();
