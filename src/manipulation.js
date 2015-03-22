var copySelectionSteps = function () {
    // var stretches = selection.stretches;
    // if (stretches.length !== 1) {
    //     return; // TODO: For multi-stretch groups: copy each stretch?
    // }
    // var original = stretches[0];
    var original = selection.left.focus;

    var p = stretchPartitions(original);

    var cloneMap = {};
    _.each(p.notCovering, function (originalStretch) {
        var stretch = cloneStretch(originalStretch);
        cloneMap[originalStretch.id] = stretch;
        stretch.group.stretches.push(stretch);
    });

    var copy = cloneStretch(original);
    copy.group.stretches.push(copy);
    copy.steps = _.map(original.steps, function (original) {
        var step = cloneStep(original);
        step.stretches = _.filter(original.stretches, function (originalStretch) {
            return _.contains(p.notCovering, originalStretch);
        });
        step.stretches = _.map(step.stretches, function (originalStretch) {
            var stretch = cloneMap[originalStretch.id];
            stretch.steps.push(step);
            step.stretches.push(stretch);
            return stretch;
        });
        return step;
    });

    var previous = original.steps[original.steps.length - 1];
    var next = previous.next;
    var lastCopyStep = copy.steps[copy.steps.length - 1];
    linkSteps([previous, copy.steps[0]]);
    linkSteps(copy.steps);
    linkSteps([lastCopyStep, next]);

    _.each(p.coveringToEnd, function (stretch) {
        stretch.steps.push(lastCopyStep);
    });
    _.each(p.covering, fixupStretchSteps);
    _.each(p.after, function (originalAfter) {
        var stretch = cloneMap[originalAfter.id];
        stretch.steps.push(originalAfter.steps[originalAfter.steps.length - 1]);
        fixupStretchSteps(stretch);
        originalAfter.steps.push(original.steps[original.steps.length - 1]);
        fixupStretchSteps(originalAfter);
    });

    update();
};

var insertNewStep = function (targetPseudo) {
    var previousPseudo = targetPseudo; // TODO: default for if there is none. || {stretch: [allStepsLinkedList]};
    var previousStretch = previousPseudo.stretch;
    var previous = previousStretch.steps[previousStretch.steps.length - 1];
    var next = previous.next;
    var newStep = createStep();

    linkSteps([previous, newStep, next]);

    var p = stretchPartitions(previousStretch);
    _.each(p.coveringToEnd, function (stretch) {
        stretch.steps[stretch.steps.length - 1] = newStep;
    });
    _.each(p.covering, fixupStretchSteps);
    _.each(p.after, fixupStretchSteps);

    update();
    d3.select(newStep.underPseudo.__el__).select('.expression').node().focus();
};
