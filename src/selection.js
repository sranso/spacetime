var browseSelectionHistory = function (forward) {
    var pop = function () {
        if (selectionHistoryI > saveHistoryI) {
            selectionHistory.pop();
            selectionHistoryI -= 1;
            return true;
        }
        return false;
    }

    if (forward) {
        pop();
        selectionHistoryI += 1;
        if (selectionHistoryI === selectionHistory.length) {
            var stretch = createStretch();
            var nextSelection = createGroup({stretches: [stretch]});
            stretch.group = nextSelection;
            selectionHistory.push({selection: nextSelection});
            allGroups.push(nextSelection);
        }
    } else if (selectionHistoryI > 0 && !pop()) {
        selectionHistoryI -= 1;
    }
    selection = selectionHistory[selectionHistoryI].selection;
};

var toggleExpanded = function () {
    selection.stretches[0].expanded = !selection.stretches[0].expanded;
    update();
};

var startSelection = function () {
    under = findUnderMouse();
    if (under) {
        selectionStart = under;
        if (selectionHistoryI !== selectionHistory.length - 1) {
            selectionHistory.push({selection: selection});
            selectionHistoryI = selectionHistory.length - 1;
        }
        changeSelection();
    }
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
    var steps = realSteps(allPseudoSteps.slice(startI, endI + 1));
    setStretchSteps(selection.stretches[0], steps);

    if (selection.stretches[0].steps.length) {
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
