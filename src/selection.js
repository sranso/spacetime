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
(function () {

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
//             var stretch = Stretch.create();
//             var nextSelection = Group.create();
//             nextSelection.stretches = [stretch];
//             stretch.group = nextSelection;
//             selectionHistory.push({selection: nextSelection});
//             Global.groups.push(nextSelection);
//         }
//     } else if (selectionHistoryI > 0 && !pop()) {
//         selectionHistoryI -= 1;
//     }
//     Global.selection = selectionHistory[selectionHistoryI].selection;
// };

Selection.toggleExpanded = function () {
    if (Global.active.byMatch) {
        return;  // TODO: make this work with non-group stretches
    }
    if (!Global.selection.foreground.group) {
        return;
    }
    var expanded = !Global.selection.foreground.focus.expanded;
    var activeSteps = _.flatten(_.pluck(Global.active.stretches, 'steps'));
    _.each(Global.selection.foreground.group.stretches, function (stretch) {
        if (_.intersection(activeSteps, stretch.steps).length) {
            stretch.expanded = expanded;
        }
    });
    Main.update();
};

var selectStepUnderMouse = function (mouse) {
    var step = Main.findStepUnderMouse(mouse);
    var selectionWidth = 44; // change in styles.css
    var selectionEndX = Draw.trackHtml.node().offsetLeft + selectionWidth;
    return (mouse[0] <= selectionEndX) && step;
};

Selection.buttonSelectionKind = function () {
    return d3.event.button === 2 ? 'background' : 'foreground';
};

Selection.maybeStart = function (mouse) {
    var step = selectStepUnderMouse(mouse);
    var kind = Selection.buttonSelectionKind();
    if (step) {
        startSelecting(step, kind);
    } else {
        clearSelection(kind);
    }
};

var startSelecting = function (step, kind) {
    var stretch = Stretch.create();
    var group;
    if (d3.event.ctrlKey) {
        group = Global.selection[kind].group;
    }
    if (! group) {
        group = Group.create();
        Global.groups.push(group);
    }
    stretch.group = group;
    group.stretches.push(stretch);

    selectingData.start = step;
    selectingData.kind = kind;
    Global.selection[kind].focus = stretch;
    Global.selection[kind].group = group;
    // if (selectionHistoryI !== selectionHistory.length - 1) {
    //     selectionHistory.push({selection: selection});
    //     selectionHistoryI = selectionHistory.length - 1;
    // }
    changeSelecting(step);
};

var clearSelection = function (kind) {
    Global.selection[kind].focus = null;
    Global.selection[kind].group = null;
    Main.update();
};

Selection.maybeChange = function (mouse) {
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
    var startI = _.indexOf(Global.stepViews, selectingData.start);
    var endI = _.indexOf(Global.stepViews, selectingData.end);
    if (endI < startI) {
        var temp = startI;
        startI = endI;
        endI = temp;
    }
    var steps = StepView.realSteps(Global.stepViews.slice(startI, endI + 1));
    Stretch.setSteps(Global.selection[selectingData.kind].focus, steps);

    // if (Global.selection.stretches[0].steps.length) {
    //     saveHistoryI = selectionHistoryI;
    // } else {
    //     saveHistoryI = selectionHistoryI - 1;
    // }

    Main.update();
};

Selection.stop = function () {
    selectingData.start = null;
    selectingData.end = null;
    selectingData.kind = null;
};

Selection.computeInfo = function () {
    Selection.__activeSteps = _.flatten(_.pluck(Global.active.stretches, 'steps'));
};

})();
