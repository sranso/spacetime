'use strict';
var DrawStretches = {};
(function () {

DrawStretches.setup = function () {
    drawStretchesSetup();
    DrawForegroundIndices.setup();
};

DrawStretches.draw = function () {
    computeStretchPositions(Group.groupsToDraw(Global.groups));
    drawStretches();
    DrawForegroundIndices.draw();
};

var verticallyPositionStretchView = function (stretchView) {
    var firstStepView = stretchView.steps[0];
    var lastStepView = stretchView.steps[stretchView.steps.length - 1];
    var firstTop = firstStepView.step.__el__.offsetTop;
    var lastTop = lastStepView.step.__el__.offsetTop;
    var lastHeight = lastStepView.step.__el__.offsetHeight;

    var steps = stretchView.stretch.steps;
    var startStep = steps[0];
    var endStep = steps[steps.length - 1];

    var startSuperSteps = firstStepView.step.startSuperSteps;
    var numLargerSuperSteps = _.findIndex(startSuperSteps, function (superStepView) {
        var steps = superStepView.step.steps;
        return steps[steps.length - 1].__index <= endStep.__index;
    });
    if (numLargerSuperSteps === -1) {
        numLargerSuperSteps = startSuperSteps.length;
    }
    //firstTop += numLargerSuperSteps * superStepTopLength;

    var endSuperSteps = lastStepView.step.endSuperSteps;
    numLargerSuperSteps = _.findIndex(endSuperSteps, function (superStepView) {
        var steps = superStepView.step.steps;
        return steps[0].__index >= startStep.__index;
    });
    if (numLargerSuperSteps === -1) {
        numLargerSuperSteps = endSuperSteps.length;
    }
    //lastHeight -= numLargerSuperSteps * superStepBottomLength;

    stretchView.y = firstTop;
    stretchView.h = lastTop + lastHeight - firstTop;
};

var computeStretchPositions = function (groups, stepViews) {
    Global.__stretchViews = [];

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

            Global.__stretchViews.push(stretchView);
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
                Global.__stretchViews.push(stretchView);
            });
        }
    });
};


///////////////// Stretches

var drawStretchesSetup = function () {
};

var drawStretches = function () {
    Draw.trackSvg
        .style('height', Draw.trackHtml.node().offsetHeight) ;

    var stretchEls = Draw.trackSvg.selectAll('g.stretch')
        .data(Global.__stretchViews) ;

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
            var series = d.stretch.series;
            if (!series || !SuperStep.insertOrUpdateReference(null, series.targetLengthBy)) {
                var kind = Selection.buttonSelectionKind();
                Global.selection[kind].focus = d.stretch;
                Global.selection[kind].group = d.stretch.group;
                Global.connectStepView = null;
                Global.inputStepView = null;
                Main.update();
            }
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
            if (d.stretch.series) {
                classes.push('series');
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

    var fill = function (d, i) {
        if (d.kind === 'selected') {
            return 'none';
        }
        if (d.stretch.group.remember) {
            var c = d.stretch.group.color;
        } else {
            var c = [0, 0, 58];
        }
        return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
    };

    stretchEls.select('rect.background')
        .attr('width', function (d) { return d.w - 2 })
        .attr('height', function (d) { return d.h - 4 })
        .style('fill', fill) ;

    var widthOffset = function (d) {
        var series = d.stretch.series;
        if (!series) {
            return 0;
        }
        var text = _.indexOf(series.stretches, d.stretch) + 1;
        var offset = ('' + text).length * 6;
        if (DrawReferences.colorForIndex(d)) {
            offset += 2;
        }
        return offset;
    };

    stretchEls.select('rect.index-in-series-border')
        .attr('fill', fill)
        .attr('y', function (d) { return d.h / 2 - 7 })
        .attr('x', function (d) {
            return 2 -widthOffset(d) / 2;
        })
        .attr('width', function (d) {
            var w = d.kind === 'background' ? 6 : 4;
            return w + widthOffset(d);
        })
        .attr('height', 15) ;

    stretchEls.select('text.index-in-series')
        .attr('x', function (d) {
            return d.kind === 'background' ? 5 : 4;
        })
        .attr('y', function (d) { return d.h / 2 + 4 })
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

})();
