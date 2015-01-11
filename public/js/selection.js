var browseSelectionHistory = function (forward) {
    var pop = function () {
        if (selectionHistoryI > saveHistoryI) {
            selectionHistory.pop();
            if (!_.contains(_.pluck(selectionHistory, 'selection'), selection)) {
                allGroups = _.without(allGroups, selection);
            }
            selectionHistoryI -= 1;
            return true;
        }
        return false;
    }

    if (forward) {
        pop();
        selectionHistoryI += 1;
        if (selectionHistoryI === selectionHistory.length) {
            var nextSelection = createGroup();
            selectionHistory.push({selection: nextSelection});
            allGroups.push(nextSelection);
        }
    } else if (selectionHistoryI > 0 && !pop()) {
        selectionHistoryI -= 1;
    }
    selection = selectionHistory[selectionHistoryI].selection;
};

var toggleExpanded = function () {
    selection.expanded = !selection.expanded;
    update();
};

var startSelection = function () {
    fixUnder();
    selectionStart = under;
    if (selectionHistoryI !== selectionHistory.length - 1) {
        selectionHistory.push({selection: selection});
        selectionHistoryI = selectionHistory.length - 1;
    }
    changeSelection();
};

var changeSelection = function () {
    if (!selectionStart) {
        return;
    }
    if (under) {
        selectionEnd = under;
    }
    var startI = _.indexOf(allPseudoSteps, selectionStart);
    var endI = _.indexOf(allPseudoSteps, selectionEnd);
    if (endI < startI) {
        var temp = startI;
        startI = endI;
        endI = temp;
    }
    removeUnderGroup(selection.elements, selection);
    selection.elements = realSteps(allPseudoSteps.slice(startI, endI + 1));
    addUnderGroup(selection.elements, selection);

    if (selection.elements.length) {
        saveHistoryI = selectionHistoryI;
    } else {
        saveHistoryI = selectionHistoryI - 1;
    }

    update();
};

var stopSelection = function () {
    selectionStart = null;
    selectionEnd = null;
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
