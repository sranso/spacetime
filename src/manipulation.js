var copySelectionSteps = function () {
    var stretches = selection.stretches;
    if (stretches.length !== 1) {
        return; // TODO: For multi-stretch groups: copy each stretch?
    }
    var stretch = stretches[0];

    var p = stretchPartitions(stretch);

    var internalCloneMap = {};
    _.each(p.internal, function (originalStretch) {
        var stretch = cloneStretch(originalStretch);
        internalCloneMap[originalStretch.id] = stretch;
        stretch.group.stretches.push(stretch);
    });

    var copy = cloneStretch(stretch);
    copy.group.stretches.push(copy);
    copy.steps = _.map(stretch.steps, function (original) {
        var step = cloneStep(original);
        step.stretches = _.filter(original.stretches, function (originalStretch) {
            return _.contains(p.internal, originalStretch);
        });
        step.stretches = _.map(step.stretches, function (originalStretch) {
            var stretch = internalCloneMap[originalStretch.id];
            stretch.steps.push(step);
            step.stretches.push(stretch);
            return stretch;
        });
        return step;
    });

    var previous = stretch.steps[stretch.steps.length - 1];
    var next = previous.next;
    linkSteps([previous, copy.steps[0]]);
    linkSteps(copy.steps);
    linkSteps([copy.steps[copy.steps.length - 1], next]);

    update();
};

var insertNewStep = function (targetPseudo) {
    var previousPseudo = targetPseudo; // TODO: default for if there is none. || {stretch: [allStepsLinkedList]};
    var previous = previousPseudo.stretch.steps[previousPseudo.stretch.steps.length - 1];
    var next = previous.next;
    var newStep = createStep();
    linkSteps([previous, newStep, next]);
    update();
    d3.select(newStep.underPseudo.__el__).select('.expression').node().focus();
};
