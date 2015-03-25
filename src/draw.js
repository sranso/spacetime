var stepsX = 200; var stepW = 420;
var stepsResultW = 130;
var stepsSelectedW = 60;
var stepsExpressionW = stepW - stepsResultW - stepsSelectedW - 2;
var lineHeight = 35;
var historyWidth = 20;
var selectionInfoWidth = 32;

var selectionArea = {
    startX: stepsX - 4,
    right: stepsX + 26,
    left: stepsX + 12,
    hover: stepsX + 0,
    endX: stepsX + 47,
};

var trackContainer;
var trackHtml;
var trackSvg;
var selectionInfoEl;
var selectionHistoryEl;
var selectionHistoryCursor;

var computePositions = function () {
    computeStepPositions(allPseudoSteps);
    //computeSelectionHistoryPositions();
    computeStretchPositions(groupsToDraw(allGroups));
};

var drawSetup = function () {
    drawOverallSetup();
    drawStepsSetup();
    //drawSelectionHistorySetup();
    drawSelectionInfoSetup();
    drawStretchesSetup();
};

var draw = function () {
    drawSteps(allPseudoSteps);
    //drawSelectionHistory();
    drawSelectionInfo();
    drawStretches(__stretches);
};


var computeStepPositions = function (steps) {
    var prevPos = {x: 0, y: -lineHeight, w: 0, h: 0};
    _.each(steps, function (step) {
        var pos = {
            x: stepsX,
            y: prevPos.y + lineHeight,
            w: stepW,
            h: lineHeight,
        };
        step.position = pos;
        _.extend(step, pos);
        prevPos = pos;
    });
};

var computeSelectionHistoryPositions = function () {
    var prevPos = {x: 360, y: 200, w: 0, h: 0};
    __selectionHistoryAll = selectionHistory;
    for (var i = selectionHistory.length - 1; i >= 0; i--) {
        var selectionView = selectionHistory[i];
        var pos = {
            x: prevPos.x - historyWidth,
            y: prevPos.y,
            w: historyWidth,
            h: historyWidth,
        };
        selectionView.position = pos;
        _.extend(selectionView, pos);
        prevPos = pos;
    }
};

var computeStretchPositions = function (groups, pseudoSteps) {
    __stretches = [];
    var x = selectionArea.startX - 19;
    _.each(groups, function (group) {
        _.each(group.pseudoStretches, function (stretch) {
            var first = stretch.steps[0];
            var last = stretch.steps[stretch.steps.length - 1];
            var pos = {
                x: x,
                y: first.step.y,
                w: 9,
                h: last.step.y + last.step.h - first.step.y,
            };
            stretch.position = pos;
            stretch.kind = 'unselected';
            _.extend(stretch, pos);

            __stretches.push(stretch);
        });
        x -= 9;
    });
    _.each(['hover', 'left', 'right'], function (kind) {
        if (selection[kind].group) {
            _.each(selection[kind].group.pseudoStretches, function (originalStretch) {
                originalStretch.kind = 'selected';
                var stretch = _.clone(originalStretch);
                stretch.kind = kind;
                stretch.selectedArea = true;
                stretch.x = selectionArea[kind];
                stretch.w = 11;
                __stretches.push(stretch);
            });
        }
    });
};


var drawOverallSetup = function() {
    trackContainer = d3.select('#track')
        .on('mousemove', mouseMove)
        .on('mousedown', mouseDown)
        .on('contextmenu', function () {
            d3.event.preventDefault();
        }) ;

    trackHtml = d3.select('div#track-html');
    trackSvg = d3.select('svg#track-svg')
        .attr('width', stepsX + 40)
        .attr('height', '2000px') ;

    d3.select(document)
        .on('keydown', function () { inputEvent(keyForEvent(), 'down') })
        .on('keyup', function () { inputEvent(keyForEvent(), 'up') })
        .on('keypress', function () { keypressEvent(d3.event.keyCode) })
        .on('mouseup', mouseUp) ;

    var background = trackSvg.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;
};


///////////////// Steps

var drawStepsSetup = function () {
};

var drawSteps = function (steps) {
    var stepEls = trackHtml.selectAll('div.step')
        .data(steps, function (d) { return d.stretch.id }) ;

    var stepEnterEls = stepEls.enter().append('div');

    var stepBoxEnterEls = stepEnterEls.append('div')
        .classed('step-box', true) ;

    var selectedContainerEnterEls = stepBoxEnterEls.append('div')
        .classed('selected-container', true) ;

    var resultContainerEnterEls = stepBoxEnterEls.append('div')
        .classed('result-container', true)
        .style('width', stepsResultW + 'px')
        .style('height', function (d) { return (d.h - 1) + 'px' }) ;

    resultContainerEnterEls.append('div')
        .classed('result', true) ;

    var expressionContainerEnterEls = stepBoxEnterEls.append('div')
        .classed('expression-container', true)
        .style('width', stepsExpressionW + 'px')
        .style('height', function (d) { return (d.h - 1) + 'px' })
        .on('dblclick', function (d) {
            var expression = d3.select(this).select('.expression').node();
            expression.focus();
            var range = document.createRange();
            range.selectNodeContents(expression);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }) ;

    expressionContainerEnterEls.append('div')
        .classed('expression', true)
        .attr('contenteditable', true)
        .on('input', function (d) {
            d.stretch.text = this.textContent;
            update();
        })
        .on('keypress', function () {
            d3.event.stopPropagation();
        })
        .on('keydown', function (d) { textInputEvent(d, keyForEvent()) })
        .on('keyup', function () {
            d3.event.stopPropagation();
        }) ;

    stepEls.exit().remove();

    stepEls.each(function (d) { d.__el__ = this });

    stepEls
        .attr('class', function (d) {
            var classes = [];
            classes.push('step');
            var selectionCount = _.intersection(d.stretch.steps, selection.__steps).length;
            if (selectionCount) {
                classes.push('selection');
                classes.push('selection-n' + selectionCount);
            }
            return classes.join(' ');
        })
        .style('width', function (d) { return d.w + 'px' })
        .style('height', function (d) { return (d.h - 1) + 'px' })
        .style('top', function (d) { return d.y + 'px' })
        .style('left', function (d) { return d.x + 'px' }) ;

    stepEls.select('.expression')
        .text(function (d) { return d.stretch.text }) ;

    stepEls.select('.result')
        .text(function (d) {
            return d.stretch.steps[d.stretch.steps.length - 1].result;
        }) ;
};


///////////////// Selections

var drawSelectionHistorySetup = function () {
    selectionHistoryEl = trackSvg.append('g')
        .classed('selection-history', true)
        .attr('transform', 'translate(600,200)') ;

    selectionHistoryCursor = selectionHistoryEl.append('rect')
        .classed('selection-cursor', true)
        .attr('x', 1)
        .attr('y', 1)
        .attr('width', historyWidth - 2)
        .attr('height', historyWidth - 2) ;
};

var drawSelectionInfoSetup = function () {
    selectionInfoEl = d3.select('#selection');
    selectionInfoEl.selectAll('.selection-name')
        .on('keypress', function () {
            d3.event.stopPropagation();
        }) ;
};

var drawSelectionHistory = function () {
    var historyEls = selectionHistoryEl.selectAll('g.history')
        .data(__selectionHistoryAll) ;

    var historyEnterEls = historyEls.enter().append('g')
        .classed('history', true) ;

    historyEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 3)
        .attr('y', 3)
        .attr('width', function (d) { return d.w - 6 })
        .attr('height', function (d) { return d.h - 6 }) ;

    historyEnterEls.append('text')
        .attr('x', 10)
        .attr('y', historyWidth / 2 + 3) ;

    historyEnterEls.append('rect')
        .classed('mouse', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', _.property('w'))
        .attr('height', _.property('h'))
        .on('click', function (d, i) {
            selectionHistoryI = i;
            selection = selectionHistory[selectionHistoryI].selection;
            update();
        }) ;

    historyEls.exit().remove();

    historyEls
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;

    historyEls.select('rect.background')
        .style('fill', function (d, i) {
            var c = d.selection.color;
            return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
        }) ;

    historyEls.select('text')
        .text(function (d) {
            return d.selection.text.slice(0, 2);
        }) ;

    selectionHistoryCursor
        .attr('transform', function () {
            var d = selectionHistory[selectionHistoryI];
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;
};

var drawSelectionInfo = function () {
    var selections = [
        selection.hover,
        selection.left,
        selection.right,
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
                var c = d.group.color;
                return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
            }
            return 'white';
        }) ;

    selectionEls.select('.selection-name')
        .attr('disabled', function (d) {
            return d.group ? null : 'disabled';
        })
        .property('value', function (d) {
            return d.group ? d.group.text : '';
        })
        .attr('placeholder', function (d) {
            if (d.group && !d.group.text) {
                return 'Unnamed group';
            }
            return '';
        })
        .on('input', function (d) {
            if (d.group) {
                d.group.text = this.value;
                update();
            }
        }) ;
};


///////////////// Stretches

var drawStretchesSetup = function () {
};

var drawStretches = function (stretches) {
    var stretchEls = trackSvg.selectAll('g.stretch')
        .data(stretches) ;

    var stretchEnterEls = stretchEls.enter().append('g');

    stretchEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 0.5)
        .attr('y', 2.5)
        .attr('rx', 2)
        .attr('ry', 2) ;

    stretchEnterEls.append('rect')
        .classed('mouse', true)
        .attr('x', 0)
        .attr('y', 0)
        .on('mousedown', function (d) {
            selection.focus = d.stretch;
            var kind = selectionKind();
            selection[kind].group = d.stretch.group;
            // selectionHistoryI = saveHistoryI + 1;
            // selectionHistory[selectionHistoryI] = {selection: selection};
            update();
            d3.event.stopPropagation();
        }) ;

    stretchEls.exit().remove();

    stretchEls
        .attr('class', function (d) {
            var classes = ['stretch', 'selection-' + d.kind];
            if (d.stretch.group === selection.left.group ||
                d.stretch.group === selection.right.group) {
                classes.push('selection-group');
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
            // if (d.stretch.group.stretches.length === 1) {
            //     return '#ccc';
            // }
            var c = d.stretch.group.color;
            return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
        }) ;

    stretchEls.select('rect.mouse')
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;
};
