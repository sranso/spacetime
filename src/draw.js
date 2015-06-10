// var historyWidth = 20;

var trackContainer;
var trackHtml;
var trackSvg;
var selectionInfoEl;
var selectionHistoryEl;
var selectionHistoryCursor;

var drawSetup = function () {
    drawOverallSetup();
    drawStepsSetup();
    //drawSelectionHistorySetup();
    drawSelectionInfoSetup();
    drawStretchesSetup();
};

var draw = function () {
    //computeSelectionHistoryPositions();

    drawSteps(allStepViews);
    computeStretchPositions(groupsToDraw(allGroups));
    //drawSelectionHistory();
    drawSelectionInfo();
    drawStretches(__stretches);
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

var computeStretchPositions = function (groups, stepViews) {
    __stretches = [];

    var x = trackHtml.node().offsetLeft;
    var selectionX = {
        foreground: x + 10,
        background: x + 28,
    };
    x -= 15 + 9;

    _.each(groups, function (group) {
        _.each(group.stretchViews, function (stretch) {
            var first = stretch.steps[0];
            var last = stretch.steps[stretch.steps.length - 1];
            var firstTop = first.step.__el__.offsetTop;
            var lastTop = last.step.__el__.offsetTop;
            var lastHeight = last.step.__el__.offsetHeight;
            var pos = {
                x: x,
                y: firstTop,
                w: 9,
                h: lastTop + lastHeight - firstTop,
            };
            stretch.position = pos;
            stretch.kind = 'unselected';
            _.extend(stretch, pos);

            __stretches.push(stretch);
        });
        x -= 9;
    });
    _.each(['foreground', 'background'], function (kind) {
        if (selection[kind].group) {
            _.each(selection[kind].group.stretchViews, function (originalStretch) {
                originalStretch.kind = 'selected';
                var stretch = _.clone(originalStretch);
                stretch.kind = kind;
                stretch.selectedArea = true;
                stretch.x = selectionX[kind];
                stretch.w = 11;
                __stretches.push(stretch);
            });
        }
    });
};


var drawOverallSetup = function() {
    trackContainer = d3.select('#track');

    trackHtml = d3.select('div#track-html');
    trackSvg = d3.select('svg#track-svg');

    d3.select(document)
        .on('keydown', function () { inputEvent(keyForEvent(), 'down') })
        .on('keyup', function () { inputEvent(keyForEvent(), 'up') })
        .on('keypress', function () {
            window.getSelection().removeAllRanges();
            maybeUpdate(function () { insertStep = null });
            keypressEvent(d3.event.keyCode)
        })
        .on('mousemove', mouseMove)
        .on('mouseup', mouseUp)
        .on('mousedown', mouseDown)
        .on('contextmenu', function () {
            d3.event.preventDefault();
        }) ;
};


///////////////// Steps

var drawStepsSetup = function () {
};

var parseStepView = function (stepView) {
    // TODO: make stretches parseable
    if (stepView.stretch._type === 'stretch') {
        return [{
            _type: 'text',
            text: stepView.stretch.text,
        }];
    }
    return parseStep(stepView.stretch);
};

var stepHtml = function (parsed) {
    var ref = -1;
    var htmls = _.map(parsed, function (segment) {
        if (segment._type === 'reference') {
            ref += 1;
            var result = clipNumber(segment.reference.result, 6);
            var width = 9 + 9 * result.length;
            if (result.indexOf('.') !== -1) {
                width -= 4;
            }
            return '<span class="reference-text reference-' +
                    ref + '" style="width: ' + width + 'px;">' +
                    segment.text + '</span>';
        }
        return segment.text;
    });
    return htmls.join('');
};

var drawSteps = function (steps) {
    var stepEls = trackHtml.selectAll('div.step')
        .data(steps, function (d) { return d.stretch.id }) ;

    var stepEnterEls = stepEls.enter().append('div');

    var stepBoxEnterEls = stepEnterEls.append('div')
        .classed('step-box', true) ;

    var selectionEdgeEnterEls = stepBoxEnterEls.append('div')
        .classed('selection-edge', true) ;

    var expressionContainerEnterEls = stepBoxEnterEls.append('div')
        .classed('expression-container', true) ;

    var down = false;

    expressionContainerEnterEls.append('div')
        .classed('expression', true)
        .attr('contenteditable', true)
        .on('focus', function (d) {
            maybeUpdate(function () { insertStep = d.stretch });
        })
        .on('blur', function (d) {
            maybeUpdate(function () { insertStep = null });
        })
        .on('input', function (d) {
            var text = this.textContent;
            if (insertStep._type === 'step') {
                _.each(__active.stretches, function (stretch) {
                    stretch.steps[0].text = text;
                });
            } else {
                // TODO: make this work for stretches
                d.stretch.text = text;
            }
            update();
        })
        .on('mousedown', function (d) {
            maybeUpdate(function () { insertStep = d.stretch });
            d3.event.stopPropagation();
        })
        .on('keypress', function () {
            d3.event.stopPropagation();
        })
        .on('keydown', function (d) {
            down = true;
            textInputEvent(d, keyForEvent());
        })
        .on('keyup', function () {
            down = false;
            update();
            d3.event.stopPropagation();
        }) ;

    var resultContainerEnterEls = stepBoxEnterEls.append('div')
        .classed('result-container', true) ;

    resultContainerEnterEls.append('div')
        .classed('result', true)
        .on('mousedown', function (d) {
            if (insertStep) {
                insertOrUpdateReference(d);
            }
            d3.event.stopPropagation();
            d3.event.preventDefault();
        });

    stepBoxEnterEls.append('div')
        .style('clear', 'both') ;

    stepEls.exit().remove();

    stepEls.each(function (d) { d.__el__ = this });
    stepEls.order();

    stepEls
        .attr('class', function (d) {
            var classes = ['step'];
            if (_.intersection(d.stretch.steps, __activeSteps).length) {
                classes.push('active');
            }
            if (d.stretch === hoverStep) {
                classes.push('hover');
            }
            if (d.stretch === insertStep) {
                classes.push('inserting');
            }
            return classes.join(' ');
        })
        .style('height', function (d) { return (d.h - 1) + 'px' })
        .style('top', function (d) { return d.y + 'px' })
        .style('left', function (d) { return d.x + 'px' }) ;

    stepEls.select('.expression-container').each(function (d) {
        var container = d3.select(this);
        var expressionEl = container.select('.expression').node();

        var parsed = parseStepView(d);
        var html = stepHtml(parsed);
        var cursorOffset = currentCursorOffset(expressionEl);
        if (expressionEl.innerHTML !== html) {
            expressionEl.innerHTML = html;
            if (cursorOffset !== -1) {
                setCurrentCursorOffset(expressionEl, cursorOffset);
            }
        }
    });

    updateInsertingReference();

    drawReferences(stepEls.select('.expression-container'));

    stepEls.select('.result')
        .attr('class', function (d) {
            var step = d.stretch.steps[d.stretch.steps.length - 1];
            return 'result ' + referenceClass(step, null);
        })
        .text(function (d) {
            var step = d.stretch.steps[d.stretch.steps.length - 1];
            if (_.isNaN(step.result)) {
                return '';
            }
            return clipNumber(step.result, 13);
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
        selection.foreground,
        selection.background,
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
            var kind = selectionKind();
            selection[kind].focus = d.stretch;
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
            if (d.kind === 'foreground' || d.kind === 'background') {
                if (d.stretch === selection[d.kind].focus) {
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
            var c = d.stretch.group.color;
            var light = c[2];
            if (d.kind === 'foreground' &&
                d.stretch === selection.foreground.focus) {
                light -= 20;
            }
            return 'hsl(' + c[0] + ',' + c[1] + '%,' + light + '%)';
        }) ;

    stretchEls.select('rect.mouse')
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;
};

var clipNumber = function (number, length) {
    var numString = '' + number;
    if (numString.length <= length) {
        return numString;
    }
    var before = numString.slice(0, length);
    if (! _.isNumber(number)) {
        return before;
    }
    if (before.indexOf('.') === -1 || numString.slice(0, 4) === '0.000') {
        numString = number.toExponential(20);
    }

    var eIndex = numString.indexOf('e');
    if (eIndex !== -1) {
        var exponent = numString.slice(eIndex);
        var mantissaLength = length - exponent.length;
        var pointAndBeforeLength = numString.indexOf('.') + 1;
        var fractionDigits = mantissaLength - pointAndBeforeLength;
        if (fractionDigits < 0) {
            fractionDigits = 0;
        }
        return number.toExponential(fractionDigits);
    }

    var pointIndex = numString.indexOf('.');
    var fractionDigits = length - pointIndex - 1;
    if (fractionDigits < 0) {
        fractionDigits = 0;
    }
    return number.toFixed(fractionDigits);
};
