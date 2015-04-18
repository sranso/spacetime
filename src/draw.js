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

    drawSteps(allPseudoSteps);
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

var computeStretchPositions = function (groups, pseudoSteps) {
    __stretches = [];

    var x = trackHtml.node().offsetLeft;
    var selectionX = {
        foreground: x + 10,
        background: x + 28,
    };
    x -= 15 + 9;

    _.each(groups, function (group) {
        _.each(group.pseudoStretches, function (stretch) {
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
            _.each(selection[kind].group.pseudoStretches, function (originalStretch) {
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

var currentRange = function () {
    var selection = window.getSelection();
    if (selection.rangeCount === 0) {
        return null;
    }
    return selection.getRangeAt(0);
};

var currentRangeUnder = function (element) {
    var range = currentRange();
    if (!range) {
        return null;
    }
    var end = range.endContainer;
    var found = false;
    while (end.parentNode) {
        if (end === element) {
            return range;
        }
        end = end.parentNode;
    }
    return null;
};

var currentCursorOffset = function (element) {
    var range = currentRangeUnder(element);
    if (!range) {
        return -1;
    }
    var preCursorRange = range.cloneRange();
    preCursorRange.selectNodeContents(element);
    preCursorRange.setEnd(range.endContainer, range.endOffset);
    return preCursorRange.toString().length;
};

var leafNode = function (node, which) {
    var lower;
    while (lower = node[which]) {
        node = lower;
    }
    return node;
};

var nodeLength = function (node) {
    if (node.nodeType === 3) {
        return node.nodeValue.length;
    } else {
        return node.childNodes.length;
    }
}

var setCurrentCursorOffset = function (element, targetOffset) {
    var range = currentRangeUnder(element);
    if (!range) {
        return;
    }
    range.selectNodeContents(element);

    while (range.toString().length > targetOffset) {
        if (range.endContainer.nodeType === 3) {
            if (range.endOffset > 0) {
                range.setEnd(range.endContainer, range.endOffset - 1);
            } else if (range.endContainer.previousSibling) {
                range.setEndAfter(range.endContainer.previousSibling);
            } else {
                range.setEndAfter(range.endContainer.parentNode.previousSibling);
            }
        } else {
            var end = range.endContainer;
            if (range.endOffset === 0) {
                end = end.childNodes[range.endOffset];
                end = leafNode(end, 'firstChild');
                range.setEnd(end, 0);
            } else {
                end = end.childNodes[range.endOffset - 1]
                end = leafNode(end, 'lastChild');
                range.setEnd(end, nodeLength(end));
            }
        }
    }

    range.collapse(false);  // collapse to end boundary
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
};

var parsePseudo = function (pseudo) {
    // TODO: make stretches parseable
    if (pseudo.stretch._type === 'stretch') {
        return [{
            _type: 'text',
            text: pseudo.stretch.text,
        }];
    }
    return pseudo.stretch.parsedText;
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

        var parsed = parsePseudo(d);
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

var referenceClass = function (step, containingStep, referenceI) {
    if (step.referenceAway == null || !targetStep()) {
        return '';
    }
    var lastTargetStep = targetStep().steps[targetStep().steps.length - 1];
    if (containingStep && containingStep !== lastTargetStep) {
        return '';
    }

    var classes = [];
    var insertRef = _.find(insertReferences, function (ref) {
        return (
            ref.reference === step &&
            (!containingStep || ref.referenceI === referenceI)
        );
    });
    if (insertRef) {
        classes.push('reference-inserting');
    }
    if (step.referenceAway <= 4) {
        classes.push('reference-color-' + step.referenceAway);
    } else {
        classes.push('reference-color-5-or-more');
    }
    return classes.join(' ');
}

var updateInsertingReference = function () {
    insertReferences = [];
    var cursorRange = currentRange();
    if (!cursorRange) {
        return;
    }
    var end = cursorRange.endContainer;
    while (
        end.parentNode &&
        (end.nodeType !== 1 || !end.classList.contains('step'))
    ) {
        end = end.parentNode;
    }
    if (!end.parentNode) {
        return;
    }
    var stepEl = d3.select(end);
    var container = stepEl.select('.expression-container');
    var pseudo = stepEl.datum();
    var references = _.filter(parsePseudo(pseudo), function (d) {
        return d._type === 'reference';
    });
    if (!references.length) {
        return;
    }

    cursorRange = cursorRange.cloneRange();
    var start = cursorRange.startContainer;
    if (start.childNodes.length) {
        if (cursorRange.startOffset === start.childNodes.length) {
            start = start.childNodes[cursorRange.startOffset - 1];
            start = leafNode(start, 'lastChild');
            cursorRange.setStart(start, nodeLength(start));
        } else {
            start = start.childNodes[cursorRange.startOffset];
            start = leafNode(start, 'firstChild');
            cursorRange.setStart(start, 0);
        }
    }
    var end = cursorRange.endContainer;
    if (end.childNodes.length) {
        if (cursorRange.endOffset === 0) {
            end = end.childNodes[cursorRange.endOffset];
            end = leafNode(end, 'firstChild');
            cursorRange.setEnd(end, 0);
        } else {
            end = end.childNodes[cursorRange.endOffset - 1]
            end = leafNode(end, 'lastChild');
            cursorRange.setEnd(end, nodeLength(end));
        }
    }

    _.each(references, function (reference, i) {
        var textEl = container.select('.reference-text.reference-' + i).node();
        var range = document.createRange();
        range.selectNodeContents(textEl);
        if (textEl.previousSibling && textEl.previousSibling.nodeType === 3) {
            var offset = textEl.previousSibling.nodeValue.length;
            range.setStart(textEl.previousSibling, offset);
        }
        if (textEl.nextSibling && textEl.nextSibling.nodeType === 3) {
            range.setEnd(textEl.nextSibling, 0);
        }

        // The naming of Range.END_TO_START is awful, since you'd
        // think that END would apply to cursorRange and START would
        // apply to range, because that's how they're layed out
        // spatially, but no it's the opposite. So I'm using
        // "flipped" names.
        // -1 means cursor is before, +1 means it is after.
        var cursorStartToRefEnd = cursorRange.compareBoundaryPoints(Range.END_TO_START, range);
        var cursorEndToRefStart = cursorRange.compareBoundaryPoints(Range.START_TO_END, range);
        if (cursorStartToRefEnd > 0 || cursorEndToRefStart < 0) {
            return;
        }
        insertReferences.push({
            reference: reference.reference,
            referenceI: i,
            textEl: textEl,
        });
    });
};

var drawReferences = function (expressionContainerEls) {
    expressionContainerEls.each(function (d) {
        var container = d3.select(this);

        var containingStep = d.stretch.steps[d.stretch.steps.length - 1];
        var references = _.filter(parsePseudo(d), function (d) {
            return d._type === 'reference';
        });
        var referenceEls = container.selectAll('.reference')
            .data(references) ;

        referenceEls.enter().append('div')
            .attr('class', 'reference')
            .on('click', function (d, i) {
                selectReference(container, i);
            }) ;

        referenceEls.exit().remove();

        referenceEls.each(function (reference) {
            d3.select(this)
                .text(clipNumber(reference.reference.result, 6)) ;
        });

        referenceEls.each(function (reference, i) {
            var textEl = container.select('.reference-text.reference-' + i).node();
            var color = referenceClass(reference.reference, containingStep, i);
            d3.select(this)
                .attr('class', 'reference ' + color)
                .style('top', textEl.offsetTop + 'px')
                .style('left', textEl.offsetLeft + 'px')
                .style('width', (textEl.offsetWidth - 2) + 'px') ;
        });
    });
};

var selectReference = function (container, i) {
    var textEl = container.select('.reference-text.reference-' + i).node();

    var range = document.createRange();
    range.setEnd(textEl, 1);
    range.collapse(false);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
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
