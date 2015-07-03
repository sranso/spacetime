'use strict';
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

Selection.toggleCollapsed = function () {
    if (Global.active.byMatch) {
        return;  // TODO: make this work with non-group stretches
    }
    if (!Global.selection.foreground.group) {
        return;
    }
    var activeSteps = _.flatten(_.pluck(Global.active.stretches, 'steps'));
    var focusSteps = Global.selection.foreground.focus.steps;
    var intersectSteps = _.intersection(activeSteps, focusSteps);
    var multiStep = MultiStep.findFromSteps(intersectSteps);
    var collapsed = multiStep && multiStep.collapsed;

    var matchesId = Main.newId();
    _.each(Global.active.stretches, function (stretch) {
        var multiStep = MultiStep.findFromSteps(stretch.steps);
        if (!multiStep) {
            multiStep = MultiStep.create();
            multiStep.matchesId = matchesId;
            Stretch.setSteps(multiStep, stretch.steps);
        }
        multiStep.collapsed = !collapsed;
    });
    Main.update();
};

Selection.buttonSelectionKind = function () {
    return d3.event.button === 2 ? 'background' : 'foreground';
};

Selection.maybeStart = function () {
    var step = Global.hoverStepView;
    var kind = Selection.buttonSelectionKind();
    if (step) {
        startSelecting(step, kind);
    }
};

var startSelecting = function (step, kind) {
    var stretch = Stretch.createGroupStretch();
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
    changeSelecting(step);
};

Selection.clearForClick = function () {
    var kind = Selection.buttonSelectionKind();
    Selection.clear(kind);
};

Selection.clear = function (kind) {
    Global.selection[kind].focus = null;
    var group = Global.selection[kind].group;
    Global.selection[kind].group = null;
    if (
        group &&
        !group.remember &&
        Global.selection.foreground.group !== group &&
        Global.selection.background.group !== group
    ) {
        Group.remove(group);
    }
    if (group) {
        Main.update();
    }
};

Selection.maybeChange = function () {
    if (!selectingData.start) {
        return;
    }
    var step = Global.hoverStepView;
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
