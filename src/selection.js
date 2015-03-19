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
    under = findUnderMouse();
    if (under) {
        selectionStart = under.stretch[0];
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
        selectionEnd = under.stretch[0];
    }
    var startI = _.indexOf(allPseudoSteps, selectionStart.underPseudo);
    var endI = _.indexOf(allPseudoSteps, selectionEnd.underPseudo);
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
