var createSelection = function (selection) {
    selection = _.extend({
        _type: 'selection',
        kind: 'left', // || hover || right
        group: null,
    }, selection || {});
    selection.id = newId();
    return selection;
};

var selection = {
    focus: null,
    hover: createSelection({kind: 'hover', group: createGroup()}),
    left: createSelection({kind: 'left', group: createGroup()}),
    //right: createSelection({kind: 'right', group: createGroup()}),
    right: createSelection({kind: 'right'}),
    start: null,
    end: null,
    selecting: null, // || 'left', 'right'
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
    if (selection.focus) {
        selection.focus.expanded = !selection.focus.expanded;
    }
    update();
};

var selectStepUnderMouse = function (mouse) {
    var x = mouse[0], y = mouse[1];
    return _.find(allPseudoSteps, function (step) {
        if (step.y <= y && y < step.y + step.h) {
            return selectionArea.left <= x && x < selectionArea.right;
        }
        return false;
    });
};

var selectionKind = function () {
    return d3.event.button === 2 ? 'right' : 'left';
};

var maybeStartSelection = function (mouse) {
    var step = selectStepUnderMouse(mouse);
    var kind = selectionKind();
    if (step) {
        startSelection(step, kind);
    } else {
        clearSelection(kind);
    }
};

var startSelection = function (step, kind) {
    selection.start = step;
    var stretch = createStretch();
    var group = createGroup({stretches: [stretch]});
    allGroups.push(group);
    selection.selecting = kind;
    selection.focus = stretch;
    selection.focus.group = group;
    selection[kind].group = group;
    // if (selectionHistoryI !== selectionHistory.length - 1) {
    //     selectionHistory.push({selection: selection});
    //     selectionHistoryI = selectionHistory.length - 1;
    // }
    changeSelection(step);
};

var clearSelection = function (kind) {
    selection[kind].group = null;
    update();
};

var maybeChangeSelection = function (mouse) {
    if (!selection.start) {
        return;
    }
    var step = selectStepUnderMouse(mouse);
    if (step) {
        changeSelection(step);
    }
};

var changeSelection = function (end) {
    selection.end = end;
    var startI = _.indexOf(allPseudoSteps, selection.start);
    var endI = _.indexOf(allPseudoSteps, selection.end);
    if (endI < startI) {
        var temp = startI;
        startI = endI;
        endI = temp;
    }
    var steps = realSteps(allPseudoSteps.slice(startI, endI + 1));
    setStretchSteps(selection.focus, steps);

    // if (selection.stretches[0].steps.length) {
    //     saveHistoryI = selectionHistoryI;
    // } else {
    //     saveHistoryI = selectionHistoryI - 1;
    // }

    update();
};

var stopSelection = function () {
    selection.start = null;
    selection.end = null;
};

var computeSelectionInfo = function () {
    var stepArrs = [];
    if (selection.left.group) {
        stepArrs.push(_.pluck(selection.left.group.stretches, 'steps'));
    }
    if (selection.right.group) {
        stepArrs.push(_.pluck(selection.right.group.stretches, 'steps'));
    }
    selection.__steps = _.flatten(stepArrs);
};
