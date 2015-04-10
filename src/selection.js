var Selection = function () {
    this.foreground = {
        focus: null,
        group: null,
    };
    this.background = {
        focus: null,
        group: null,
    };
};

var selection = new Selection();

var selectingData = {
    kind: null, // 'foreground' || 'background'
    start: null,
    end: null,
};

// var browseSelectionHistory = function (forward) {
//     var pop = function () {
//         if (selectionHistoryI > saveHistoryI) {
//             selectionHistory.pop();
//             selectionHistoryI -= 1;
//             return true;
//         }
//         return false;
//     }
//
//     if (forward) {
//         pop();
//         selectionHistoryI += 1;
//         if (selectionHistoryI === selectionHistory.length) {
//             var stretch = createStretch();
//             var nextSelection = createGroup({stretches: [stretch]});
//             stretch.group = nextSelection;
//             selectionHistory.push({selection: nextSelection});
//             allGroups.push(nextSelection);
//         }
//     } else if (selectionHistoryI > 0 && !pop()) {
//         selectionHistoryI -= 1;
//     }
//     selection = selectionHistory[selectionHistoryI].selection;
// };

var toggleExpanded = function () {
    var focus = selection.foreground.focus;
    if (focus) {
        focus.expanded = !focus.expanded;
    }
    update();
};

var selectStepUnderMouse = function (mouse) {
    var x = mouse[0], y = mouse[1];
    var selectionStartX = trackHtml.node().offsetLeft;
    var selectionEndX = selectionStartX + 60;
    return _.find(allPseudoSteps, function (step) {
        var el = step.__el__;
        if (el.offsetTop <= y && y < el.offsetTop + el.offsetHeight) {
            return selectionStartX <= x && x < selectionEndX;
        }
        return false;
    });
};

var selectionKind = function () {
    return d3.event.button === 2 ? 'background' : 'foreground';
};

var maybeStartSelecting = function (mouse) {
    var step = selectStepUnderMouse(mouse);
    var kind = selectionKind();
    if (step) {
        startSelecting(step, kind);
    } else {
        clearSelection(kind);
    }
};

var startSelecting = function (step, kind) {
    var stretch = createStretch();
    var group;
    if (d3.event.ctrlKey) {
        group = selection[kind].group;
    }
    if (! group) {
        group = createGroup();
        allGroups.push(group);
    }
    stretch.group = group;
    group.stretches.push(stretch);

    selectingData.start = step;
    selectingData.kind = kind;
    selection[kind].focus = stretch;
    selection[kind].group = group;
    // if (selectionHistoryI !== selectionHistory.length - 1) {
    //     selectionHistory.push({selection: selection});
    //     selectionHistoryI = selectionHistory.length - 1;
    // }
    changeSelecting(step);
};

var clearSelection = function (kind) {
    selection[kind].focus = null;
    selection[kind].group = null;
    update();
};

var maybeChangeSelection = function (mouse) {
    if (!selectingData.start) {
        return;
    }
    var step = selectStepUnderMouse(mouse);
    if (step) {
        changeSelecting(step);
    }
};

var changeSelecting = function (end) {
    selectingData.end = end;
    var startI = _.indexOf(allPseudoSteps, selectingData.start);
    var endI = _.indexOf(allPseudoSteps, selectingData.end);
    if (endI < startI) {
        var temp = startI;
        startI = endI;
        endI = temp;
    }
    var steps = realSteps(allPseudoSteps.slice(startI, endI + 1));
    setStretchSteps(selection[selectingData.kind].focus, steps);

    // if (selection.stretches[0].steps.length) {
    //     saveHistoryI = selectionHistoryI;
    // } else {
    //     saveHistoryI = selectionHistoryI - 1;
    // }

    update();

    // TODO: is this a browser bug?
    var el = document.activeElement;
    if (el && el.isContentEditable) {
        el.blur();
    }
};

var stopSelecting = function () {
    selectingData.start = null;
    selectingData.end = null;
    selectingData.kind = null;
};

var computeSelectionInfo = function () {
    __activeSteps = _.flatten(_.pluck(__active.stretches, 'steps'));
};
