'use strict';
var DrawSuperSteps = {};
(function () {

DrawSuperSteps.setup = function (stepEnterEls) {
    var superStepsContainer = stepEnterEls.append('div')
        .attr('class', 'super-steps-container') ;

    superStepsContainer.append('div')
        .attr('class', 'selection-area-background') ;
};

DrawSuperSteps.draw = function (stepEls) {
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

        var html = DrawSteps.stepHtml(d);
        var cursorOffset = DomRange.currentCursorOffset(expressionEl);
        if (expressionEl.innerHTML !== html) {
            expressionEl.innerHTML = html;
            if (cursorOffset !== -1) {
                DomRange.setCurrentCursorOffset(expressionEl, cursorOffset);
            }
        }
    });
};

DrawSuperSteps.drawReferences = function (stepEls) {
    var superStepsContainer = stepEls.select('.super-steps-container')
    var superStepEls = superStepsContainer.selectAll('.super-step');
    superStepEls.select('.expression-container').each(DrawReferences.draw);
};

})();
