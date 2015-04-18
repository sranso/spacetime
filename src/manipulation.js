var copyActiveStretches = function () {
    _.each(__active.stretches, copyStretch);

    update();
};

var copyStretch = function (original) {
    var p = stretchPartitions(original);
    var notCovering = _.union(
        p("<<[<<>_]__"),
        p("__[_<>>]>>"),
        p("__[<==>]__")
    );

    var cloneMap = {};
    _.each(notCovering, function (originalStretch) {
        var stretch = cloneStretch(originalStretch);
        cloneMap[originalStretch.id] = stretch;
        stretch.group.stretches.push(stretch);
    });

    var copy = cloneMap[original.id];
    _.each(original.steps, function (original) {
        var step = cloneStep(original);
        step.stretches = _.filter(original.stretches, function (originalStretch) {
            return _.contains(notCovering, originalStretch);
        });
        step.stretches = _.map(step.stretches, function (originalStretch) {
            var stretch = cloneMap[originalStretch.id];
            stretch.steps.push(step);
            step.stretches.push(stretch);
            return stretch;
        });
    });

    var previous = original.steps[original.steps.length - 1];
    var next = previous.next;
    var lastCopyStep = copy.steps[copy.steps.length - 1];
    linkSteps([previous, copy.steps[0]]);
    linkSteps(copy.steps);
    linkSteps([lastCopyStep, next]);

    _.each(p("<=[===>]__"), function (stretch) {
        stretch.steps.push(lastCopyStep);
    });

    _.each(p("<<[<==>]>>"), fixupStretchSteps);
    _.each(p("__[_<<<]=>"), function (originalAfter) {
        var stretch = cloneMap[originalAfter.id];
        stretch.steps.push(originalAfter.steps[originalAfter.steps.length - 1]);
        fixupStretchSteps(stretch);
        originalAfter.steps.push(original.steps[original.steps.length - 1]);
        fixupStretchSteps(originalAfter);
    });

    var focus = selection.foreground.focus;
    if (cloneMap[focus.id]) {
        selection.foreground.focus = cloneMap[focus.id];
    }
};

var insertNewStep = function (targetPseudo) {
    var previousPseudo = targetPseudo; // TODO: default for if there is none. || {stretch: [allStepsLinkedList]};
    var previousStretch = previousPseudo.stretch;
    var previous = previousStretch.steps[previousStretch.steps.length - 1];
    var next = previous.next;
    var newStep = createStep();

    linkSteps([previous, newStep, next]);

    var p = stretchPartitions(previousStretch);
    _.each(p("<=[===>]__"), function (stretch) {
        stretch.steps.push(newStep);
    });
    _.each(p("<<[<==>]>>"), fixupStretchSteps);
    _.each(p("__[_<<<]=>"), fixupStretchSteps);

    update();
    d3.select(newStep.underPseudo.__el__).select('.expression').node().focus();
};

var deleteActiveStretches = function () {
    _.each(__active.stretches, deleteStretch);
    update();
};

var deleteStretch = function (stretch) {
    var start = stretch.steps[0];
    var end = stretch.steps[stretch.steps.length - 1];
    var previous = start.previous;
    var next = end.next;
    linkSteps([previous, next]);

    var p = stretchPartitions(stretch);
    _.each(p("<=[>>>>]__"), function (stretch) {
        stretch.steps.push(previous);
        fixupStretchSteps(stretch);
    });
    _.each(p("__[<<<<]=>"), function (stretch) {
        stretch.steps.unshift(next);
        fixupStretchSteps(stretch);
    });
    _.each(p("__[<<>>]__"), function (stretch) {
        stretch.group.stretches = _.without(stretch.group.stretches, stretch);
    });
};

var selectActiveStretches = function () {
    __active.hidden = false;
    allGroups.push(__active);
    selection.foreground.focus = __active.focus;
    selection.foreground.group = __active;

    __active = createGroup({hidden: true});
};

var forgetForegroundGroup = function () {
    forgetGroup(selection.foreground.group);
    selection.foreground.focus = null;
    selection.foreground.group = null;
};

var forgetGroup = function (group) {
    if (! group) {
        return;
    }

    _.each(group.stretches, function (stretch) {
        setStretchSteps(stretch, []);
    });
    allGroups = _.without(allGroups, group);
};

var computeGroupIntersection = function () {
    if (!selection.foreground.group || !selection.background.group) {
        return;
    }
    var intersection = createGroup();
    allGroups.push(intersection);
    var stepsById = {};
    _.each(selection.foreground.group.stretches, function (stretch) {
        _.each(stretch.steps, function (step) {
            var stepInfo = {
                step: step,
                foreStretch: stretch.id,
            };
            stepsById[step.id] = stepInfo;
        });
    });
    _.each(selection.background.group.stretches, function (stretch) {
        _.each(stretch.steps, function (step) {
            if (stepsById[step.id]) {
                stepsById[step.id].backStretch = stretch.id;
            }
        });
    });
    var steps = _.sortBy(stepsById, function (step) {
        return _.indexOf(allSteps, step.step);
    });
    var stretches = [];
    var stretch = null;
    var lastStep = null;
    _.each(steps, function (step) {
        if (!step.backStretch) {
            lastStep = step;
            return;
        }
        if (
            stretch &&
            lastStep.step.next === step.step &&
            lastStep.foreStretch === step.foreStretch &&
            lastStep.backStretch === step.backStretch
        ) {
            stretch.push(step.step);
        } else {
            if (stretch) {
                stretches.push(stretch);
            }
            stretch = [step.step];
        }
        lastStep = step;
    });
    if (stretch) {
        stretches.push(stretch);
    }
    intersection.stretches = _.map(stretches, function (steps) {
        var stretch = createStretch({group: intersection});
        setStretchSteps(stretch, steps);
        return stretch;
    });
    selection.foreground.group = intersection;
    selection.background.group = intersection;
    var foreFocus = selection.foreground.focus;
    var backFocus = selection.background.focus;
    _.each(intersection.stretches, function (stretch) {
        if (_.intersection(stretch.steps, foreFocus.steps)) {
            foreFocus = stretch;
        }
        if (_.intersection(stretch.steps, backFocus.steps)) {
            backFocus = stretch;
        }
    });
    selection.foreground.focus = foreFocus;
    selection.background.focus = backFocus;
};
