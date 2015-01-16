var stepsX = 240;
var stepsTextX = 50;
var lineHeight = 35;
var stepW = 400;
var historyWidth = 20;
var selectionInfoWidth = 32;

var computePositions = function () {
    computeStepPositions(allPseudoSteps);
    computeSelectionHistoryPositions();
    computeGroupPositions(groupsToDraw(allGroups));
};

var drawSetup = function () {
    drawOverallSetup();
    drawStepsSetup();
    drawSelectionHistorySetup();
    drawSelectionInfoSetup();
    drawGroupsSetup();
};

var draw = function () {
    drawSteps(allPseudoSteps);
    drawSelectionHistory();
    drawSelectionInfo();
    drawGroups(__stretches);
};


var computeStepPositions = function (steps) {
    var prevPos = {x: 0, y: 0, w: 0, h: 0};
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

var computeGroupPositions = function (groups) {
    __stretches = [];
    var x = 230;
    _.each(groups, function (group) {
        _.each(group.stretches, function (stretch) {
            var lastEl = stretch[stretch.length - 1];
            var pos = {
                x: x,
                y: stretch[0].step.y,
                w: 9,
                h: lastEl.step.y + lastEl.step.h - stretch[0].step.y,
            };
            stretch.position = pos;
            _.extend(stretch, pos);
            stretch.group = group;

            __stretches.push(stretch);
        });
        x -= 9;
    });
};




var drawOverallSetup = function() {
    svg = d3.select('svg#code')
        .attr('width', '100%')
        .attr('height', '2000px') ;

    camera = svg.append('g')
        .classed('camera', true)
        .on('mousemove', mouseMove)
        .on('mousedown', mouseDown) ;

    d3.select(document)
        .on('keydown', function () { inputEvent(keyForEvent(), 'down') })
        .on('keyup', function () { inputEvent(keyForEvent(), 'up') })
        .on('keypress', function () { keypressEvent(d3.event.keyCode) })
        .on('mouseup', mouseUp) ;

    var background = camera.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;
};


///////////////// Steps

var drawStepsSetup = function () {
    stepTextInput = d3.select('#step-text-input')
        .style('left', (stepsX + stepsTextX + 23) + 'px') ;

    stepTextInput.select('input')
        .style('width', (stepW - stepsTextX - 20) + 'px')
        .style('height', (lineHeight - 12) + 'px')
        .on('input', function () {
            if (under) {
                under.entity.text = this.value;
                update();
            }
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

    camera.append('rect')
        .classed('track-rail', true)
        .attr('x', stepsX + 70)
        .attr('y', 10)
        .attr('width', 10)
        .attr('height', 10000) ;

    camera.append('rect')
        .classed('track-rail', true)
        .attr('x', stepsX + stepW - 80)
        .attr('y', 10)
        .attr('width', 10)
        .attr('height', 10000) ;
};

var drawSteps = function (steps) {
    var stepEls = camera.selectAll('g.step')
        .data(steps, _.property('id')) ;

    var stepEnterEls = stepEls.enter().append('g')
        .each(function (d) {
            d.__el__ = this;
        }) ;

    stepEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 0)
        .attr('y', 1)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('width', _.property('w'))
        .attr('height', function (d) { return d.h - 3 }) ;

    stepEnterEls.append('text')
        .classed('text', true)
        .attr('y', 21)
        .attr('x', stepsTextX) ;

    stepEnterEls.append('text')
        .classed('result', true)
        .attr('y', 25)
        .attr('x', stepW - 120) ;

    stepEls.exit().remove();

    stepEls
        .attr('class', function (d) {
            var classes = [];
            if (_.intersection(d.stretch, selection.elements).length) {
                classes.push('selection');
            }
            if (under && under.entity == d.entity) {
                classes.push('under-input');
            }
            classes.push('step');
            return classes.join(' ');
        })
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;

    stepEls.select('text.text')
        .text(_.property('text')) ;

    stepEls.select('text.result')
        .text(function (d) {
            return d.stretch[d.stretch.length - 1].result;
        }) ;
};


///////////////// Selections

var drawSelectionHistorySetup = function () {
    selectionHistoryEl = svg.append('g')
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
    selectionInfoEl = svg.append('g')
        .classed('selection-info', true)
        .attr('transform', 'translate(850,300)') ;

    selectionInfoEl.append('rect')
        .classed('selection-cursor', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', selectionInfoWidth)
        .attr('height', selectionInfoWidth) ;

    selectionInfoEl.append('rect')
        .classed('selection-color', true)
        .attr('x', 2)
        .attr('y', 2)
        .attr('width', selectionInfoWidth - 4)
        .attr('height', selectionInfoWidth - 4) ;

    selectionTextInput = d3.select('#selection-text-input')
        .style('left', '930px')
        .style('top', '327px') ;

    selectionTextInput.select('input')
        .property('placeholder', 'Group name') ;
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
    selectionInfoEl.select('rect.selection-color')
        .style('fill', function () {
            var c = selection.color;
            return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
        }) ;

    selectionTextInput.select('input')
        .property('value', selection.text)
        .on('input', function () {
            selection.text = this.value;
            update();
        })
        .on('keypress', function () {
            d3.event.stopPropagation();
        }) ;
};


///////////////// Groups

var drawGroupsSetup = function () {
};

var drawGroups = function (stretches) {
    var stretchEls = camera.selectAll('g.group-stretch')
        .data(stretches) ;

    var stretchEnterEls = stretchEls.enter().append('g');

    stretchEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 1)
        .attr('y', 1)
        .attr('rx', 2)
        .attr('ry', 2) ;

    stretchEnterEls.append('rect')
        .classed('mouse', true)
        .attr('x', 0)
        .attr('y', 0)
        .on('click', function (d) {
            selection = d.group;
            selectionHistoryI = saveHistoryI + 1;
            selectionHistory[selectionHistoryI] = {selection: selection};
            update();
        }) ;

    stretchEls
        .attr('class', function (d) {
            if (d.group === selection) {
                return 'group-stretch showing';
            }
            return 'group-stretch';
        })
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;

    stretchEls.select('rect.background')
        .attr('width', function (d) { return d.w - 2 })
        .attr('height', function (d) { return d.h - 2 })
        .style('fill', function (d, i) {
            if (d.group === selection) {
                return '#afa';
            }
            var c = d.group.color;
            return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
        }) ;

    stretchEls.select('rect.mouse')
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;
};
