'use strict';
var DrawSteps = {};
(function () {

///////////////// Steps

DrawSteps.setup = function () {
};

var stepHtml = function (stepView) {
    var parsed = StepExecution.lex(stepView.step);
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

DrawSteps.draw = function (stepViews) {
    var stepEls = Draw.trackHtml.selectAll('div.step')
        .data(stepViews, function (d) { return d.step.id }) ;

    var stepEnterEls = stepEls.enter().append('div');

    drawSuperStepsSetup(stepEnterEls);

    var stepContainerEnterEls = stepEnterEls.append('div')
        .attr('class', 'step-container')
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

    var matchesIndicatorContainerEnterEls = stepContainerEnterEls.append('div')
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

    var stepBoxEnterEls = stepContainerEnterEls.append('div')
        .attr('class', 'step-box') ;

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
                window.getSelection().removeAllRanges();
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

    stepEls.each(function (d) {
        d.__el__ = d3.select(this).select('.step-container').node();
    });
    stepEls.order();

    var targetStepView = Main.targetStepView();

    stepEls
        .attr('class', function (d) {
            var classes = ['step'];
            if (SuperStep.isEnabled(d)) {
                classes.push('enabled');
            } else {
                classes.push('disabled');
            }
            if (SuperStep.forceEnabled(d)) {
                classes.push('force-enabled');
            } else if (SuperStep.forceDisabled(d)) {
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
        .style('left', function (d) { return d.x + 'px' })

    var stepBoxEls = stepEls.select('.step-box');

    drawSuperSteps(stepEls);

    stepBoxEls.select('.expression-container').each(function (d) {
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

    stepBoxEls.select('.expression-container').each(DrawReferences.draw);
    drawSuperStepReferences(stepEls);

    /////////////////// must be after updateInputting

    stepBoxEls.select('.enable-disable')
        .attr('class', function (d) {
            var enabledBy = SuperStep.enabledBy(d);
            var classes = ['enable-disable'];
            if (enabledBy.length) {
                var color = DrawReferences.colorForEnabledBy(d, enabledBy);
                classes.push(color);
                classes.push('enabled-by-connected');
            }
            return classes.join(' ');
        }) ;

    drawEnableDisableOuter(stepBoxEls);

    stepBoxEls.select('.result')
        .attr('class', function (d) {
            var step = d.steps[d.steps.length - 1];
            if (!step) {
                debugger;
            }
            return 'result ' + DrawReferences.colorForResult(d);
        }) ;

    stepBoxEls.select('.result-content-text')
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

    stepBoxEls.select('.result-content-canvas')
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

/////
var drawEnableDisableOuter = function (stepEls) {
    var containerEls = stepEls.select('.enable-disable-outer-container');
    var enableDisableOuterEls = containerEls.selectAll('.enable-disable-outer')
        .data(function (d) {
            var allEnabledBy = SuperStep.enabledBy(d);
            allEnabledBy = _.sortBy(allEnabledBy, '__index');
            return _.map(allEnabledBy, function (enabledBy) {
                return {
                    enabledBy: enabledBy,
                    stepView: d,
                    allEnabledByLength: allEnabledBy.length,
                };
            });
        }) ;

    var enableDisableOuterEnterEls = enableDisableOuterEls.enter().append('div');

    enableDisableOuterEls.exit().remove();

    enableDisableOuterEls
        .attr('class', function (d) {
            var color = DrawReferences.colorForEnableOuterConnector(d.stepView, d.enabledBy);
            return 'enable-disable-outer ' + color;
        })
        .style('top', function (d, i) {
            var px = i * 6 - 3 * d.allEnabledByLength + 2;
            return px + 'px';
        }) ;
};


/////////////// superSteps

var drawSuperStepsSetup = function (stepEnterEls) {
    var superStepsContainer = stepEnterEls.append('div')
        .attr('class', 'super-steps-container') ;

    superStepsContainer.append('div')
        .attr('class', 'selection-area-background') ;
};

var drawSuperSteps = function (stepEls) {
    var superStepsContainer = stepEls.select('.super-steps-container')
        .style('height', function (d) {
            if (d.startSuperSteps.length) {
                return null;
            } else if (d.previous && d.previous.endSuperSteps.length) {
                return '5px';
            } else {
                return '1px';
            }
        }) ;

    var superStepEls = superStepsContainer.selectAll('.super-step')
        .data(function (d) { return d.startSuperSteps }) ;

    var superStepEnterEls = superStepEls.enter().append('div')
        .attr('class', 'super-step')
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

    superStepEnterEls.append('div')
        .attr('class', 'group-stretch')
        .on('mousedown', function (d) {
            var stretch = d.step.groupStretch;
            var kind = Selection.buttonSelectionKind();
            Global.selection[kind].focus = stretch;
            Global.selection[kind].group = stretch.group;
            Global.connectStepView = null;
            Main.update();
            d3.event.stopPropagation();
        }) ;

    var expressionContainerEnterEls = superStepEnterEls.append('div')
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
            Input.startInput(d);
            Step.updateText(this);
        })
        .on('mousedown', function (d) {
            Main.maybeUpdate(function () {
                window.getSelection().removeAllRanges();
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


    superStepEls.exit().remove();

    superStepEls.each(function (d) { d.__el__ = this });


    superStepEls
        .attr('class', function (d) {
            var classes = ['super-step'];
            if (!_.difference(d.steps, Global.__activeSteps).length) {
                classes.push('active');
            }
            return classes.join(' ');
        }) ;

    superStepEls.select('.group-stretch')
        .style('background-color', function (d) {
            var c = d.step.groupStretch.group.color;
            return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
        }) ;

    superStepEls.select('.expression-container').each(function (d) {
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
};

var drawSuperStepReferences = function (stepEls) {
    var superStepsContainer = stepEls.select('.super-steps-container')
    var superStepEls = superStepsContainer.selectAll('.super-step');
    superStepEls.select('.expression-container').each(DrawReferences.draw);
};


})();
