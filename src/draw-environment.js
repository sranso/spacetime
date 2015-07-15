'use strict';
var DrawEnvironment = {};
(function () {

var environmentContainer;

DrawEnvironment.setup = function () {
    environmentContainer = d3.select('#environment');
};

DrawEnvironment.draw = function () {
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

})();
