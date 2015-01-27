var copySelectionSteps = function () {
    var stretches = groupByStretches(orderElements(selection.elements));
    if (stretches.length !== 1) {
        return; // TODO: For multi-stretch groups: copy each stretch?
    }
    var stretch = stretches[0];

    var groups = partitionInternalExternalGroups(stretch, stretch);
    var internal = groups[0];
    var external = groups[1];
    var internalCloneMap = {};
    _.each(internal, function (originalGroup) {
        var group = createGroup(_.pick(originalGroup, 'text', 'expanded'));
        internalCloneMap[originalGroup.id] = group;
        allGroups.push(group);
    });

    var bothGroup = createGroup({elements: stretch.slice()});
    addUnderGroup(stretch, bothGroup);
    allGroups.push(bothGroup);

    var copy = _.map(stretch, function (original) {
        var step = createStep(original);
        step.groups = _.map(original.groups, function (originalGroup) {
            var group = internalCloneMap[originalGroup.id] || originalGroup;
            group.elements.push(step);
            return group;
        });
        return step;
    });

    var previous = stretch[stretch.length - 1];
    var next = previous.next;
    linkSteps([previous, copy[0]]);
    linkSteps(copy);
    linkSteps([copy[copy.length - 1], next]);

    update();
};

var insertNewStep = function () {
    var previousPseudo = target() || {entity: allStepsLinkedList};
    var previous = previousPseudo.entity;
    var next = previous.next;
    var step = createStep({});
    linkSteps([previous, step, next]);

    inserting = {entity: step};
    update();
    stepTextInput.select('input').node().focus();
    setTextForStepTextInput();
};
