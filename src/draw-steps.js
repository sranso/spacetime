'use strict';
var DrawSteps = {};
(function () {

DrawSteps.setup = function () {
};

DrawSteps.draw = function () {
    var stepEls = Draw.trackHtml.selectAll('div.step')
        .data(Global.stepViews, function (d) { return d.step.id }) ;

    ///// enter

    var stepEnterEls = stepEls.enter().append('div');

    DrawSuperSteps.setup(stepEnterEls);

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
        .attr('contenteditable', function (d) {
            return !d.step.base
        })
        .on('focus', function (d) {
            Main.maybeUpdate(function () { Input.startInput(d) });
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
                if (!d.step.base) {
                    Input.startInput(d);
                }
                Global.lostLiterals = {};
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

    ///// exit

    stepEls.exit().remove();

    ///// update

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
            if (d.step.base) {
                classes.push('base');
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

    DrawSuperSteps.draw(stepEls);

    stepBoxEls.select('.expression-container').each(function (d) {
        var container = d3.select(this);
        var expressionEl = container.select('.expression').node();

        var html = DrawSteps.stepHtml(d);
        var cursorOffset = DomRange.currentCursorOffset(expressionEl);
        if (expressionEl.innerHTML !== html) {
            expressionEl.innerHTML = html;
            if (cursorOffset !== -1) {
                DomRange.setCurrentCursorOffset(expressionEl, cursorOffset);
            }
        }
    });

    DrawReferences.updateInputting();

    stepBoxEls.select('.expression-container').each(function (d) {
        DrawReferences.draw(this, d, false);
    });
    DrawSuperSteps.drawReferences(stepEls);

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

DrawSteps.stepHtml = function (stepView) {
    var tokens = StepExecution.lex(stepView.step.text);
    var references = stepView.step.references;
    var htmls = _.map(tokens, function (token) {
        if (token.type === 'reference') {
            var reference = references[token.referenceI];
            var result = reference.source.result;
            if (Reference.isLiteral(reference)) {
                return '<span class="reference-placeholder literal-placeholder' +
                        ' reference-'+token.referenceI +
                        '">' + result + '</span>';
            }

            if (result === null) {
                var resultText = '-';
            } else if (Quads.isQuads(result)) {
                var resultText = 'pic';
            } else {
                var resultText = DrawHelper.clipNumber(result, 6);
            }
            var width = 9 + 9 * resultText.length;
            if (resultText.indexOf('.') !== -1) {
                width -= 4;
            }
            return '<span class="reference-placeholder variable-placeholder reference-' +
                    token.referenceI + '" style="width: ' + width + 'px;">' +
                    token.text + '</span>';

        }
        return token.text;
    });
    return htmls.join('');
};

///// enable disable outer
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

})();
