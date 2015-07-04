'use strict';
var Draw = {};
(function () {

Draw.trackContainer = null;
Draw.trackHtml = null;

var trackSvg;
var selectionInfoEl;
var __stretchViews = [];
var environmentContainer;

Draw.setup = function () {
    drawOverallSetup();
    drawStepsSetup();
    drawEnvironmentSetup();
    drawSelectionInfoSetup();
    drawStretchesSetup();
};

Draw.draw = function () {
    drawSteps(Global.stepViews);
    drawEnvironment();
    computeStretchPositions(Group.groupsToDraw(Global.groups));
    drawSelectionInfo();
    drawStretches(__stretchViews);
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

    var x = Draw.trackHtml.node().offsetLeft;
    var selectionX = {
        foreground: x + 13,
        background: x + 31,
    };
    x -= 20 + 9;

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

    Draw.trackHtml = d3.select('div#track-html');
    trackSvg = d3.select('svg#track-svg');

    d3.select(document)
        .on('keydown', function () { Input.inputEvent(Input.keyForEvent(), 'down') })
        .on('keyup', function () { Input.inputEvent(Input.keyForEvent(), 'up') })
        .on('keypress', function () {
            window.getSelection().removeAllRanges();
            Main.maybeUpdate(function () {
                Global.inputStepView = null;
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
            Main.maybeUpdate(function () { Input.startInput(d) });
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
            Step.insertOrUpdateReference(d);
            d3.event.stopPropagation();
            d3.event.preventDefault();
        }) ;

    resultEnterEls.append('div')
        .attr('class', 'result-content-text') ;

    resultEnterEls.append('div')
        .attr('class', 'result-content-canvas') ;

    resultEnterEls.append('div')
        .attr('class', 'result-border') ;

    var resultCornerContainerEnterEls = resultEnterEls.append('div')
        .attr('class', 'result-corner-container') ;

    resultCornerContainerEnterEls.append('div')
        .attr('class', 'result-corner')
        .on('mousedown', function (d) {
            if (!Global.inputStepView) {
                d3.event.stopPropagation();
            }
        })
        .on('click', function (d) {
            if (!Global.inputStepView) {
                Global.connectStepView = d;
                Main.update();
                d3.event.stopPropagation();
            }
        }) ;


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
            if (_.intersection(d.steps, Selection.__activeSteps).length) {
                classes.push('active');
            }
            if (d === Global.hoverStepView) {
                classes.push('hover');
            }
            if (d === Global.inputStepView) {
                classes.push('inserting');
            }
            if (d === Global.connectStepView) {
                classes.push('connecting');
            }
            if (d === targetStepView) {
                classes.push('target');
            }
            if (
                targetStepView &&
                targetStepView.step.matchesId === d.step.matchesId
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

    DrawReferences.updateInserting();

    DrawReferences.draw(stepEls.select('.expression-container'));

    /////////////////// must be after updateInserting

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
        .on('keydown', function (d) {
            Input.textInputEvent(d, Input.keyForEvent());
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

    resultEnterEls.append('div')
        .attr('class', 'result-border') ;

    var resultCornerContainerEnterEls = resultEnterEls.append('div')
        .attr('class', 'result-corner-container') ;

    resultCornerContainerEnterEls.append('div')
        .attr('class', 'result-corner')
        .on('mousedown', function (d) {
            if (!Global.inputStepView) {
                d3.event.stopPropagation();
            }
        })
        .on('click', function (d) {
            if (!Global.inputStepView) {
                Global.connectStepView = d;
                Main.update();
                d3.event.stopPropagation();
            }
        }) ;

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

    stretchEls.select('rect.mouse')
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;
};

})();
