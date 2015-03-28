var createGroup = function (group) {
    group = _.extend({
        _type: 'group',
        stretches: [],
        color: [_.random(360), _.random(70, 95), _.random(84, 89)],
        text: '',
    }, group || {});
    group.id = newId();
    return group;
};

var createStretch = function (stretch) {
    stretch = _.extend({
        _type: 'stretch',
        text: '',
        steps: [],
        expanded: true,
        group: null,
    }, stretch || {});
    stretch.id = newId();
    stretch.pseudo = createPseudoStep(stretch);
    stretch.pseudoStretch = createPseudoStretch(stretch);
    return stretch;
};

var cloneStretch = function (original) {
    var stretch = createStretch(original);
    stretch.steps = [];
    return stretch;
};

var createPseudoStretch = function (stretch) {
    return {
        _type: 'pseudoStretch',
        kind: 'unselected',
        selectedArea: false,
        steps: [],
        stretch: stretch,
        position: null,
    };
};

var computePseudoStretchSteps = function (pseudoStretch) {
    pseudoStretch.steps = [];
    var i = 0;
    var steps = pseudoStretch.stretch.steps;
    var real = steps[i];
    while (real) {
        var pseudo = real.underPseudo;
        var pseudoStep = {step: pseudo};
        pseudoStretch.steps.push(pseudoStep);
        var missingSteps = _.difference(pseudo.stretch.steps, steps);
        pseudoStep.partial = missingSteps.length > 0;
        while (real && real.underPseudo === pseudo) {
            i += 1;
            real = steps[i];
        }
    }
};

var setStretchSteps = function (stretch, steps) {
    _.each(stretch.steps, function (oldStep) {
        oldStep.stretches = _.without(oldStep.stretches, stretch);
    });
    _.each(steps, function (newStep) {
        newStep.stretches.push(stretch);
    });
    stretch.steps = steps;
};

var stretchPartitions = function (targetStretch) {
    var firstStep = targetStretch.steps[0];
    var lastStep = targetStretch.steps[targetStretch.steps.length - 1];
    var p = _.partition(firstStep.stretches, function (stretch) {
        return stretch.steps[0] === firstStep;
    });
    var start = p[0], before = p[1];
    p = _.partition(lastStep.stretches, function (stretch) {
        return stretch.steps[stretch.steps.length - 1] === lastStep;
    });
    var end = p[0], after = p[1];

    var all = _.uniq(_.reduce(targetStretch.steps, function (all, step) {
        return all.concat(step.stretches);
    }, []));
    var internal = _.difference(all, before, after);

    var coveringFromStart = _.intersection(start, after);
    var coveringToEnd = _.intersection(before, end);
    var covering = _.union(
        _.intersection(before, after),
        coveringFromStart,
        coveringToEnd
    );
    return {
        covering: covering,
        coveringFromStart: coveringFromStart,
        coveringToEnd: coveringToEnd,
        notCovering: _.difference(all, covering),
        before: _.difference(before, covering),
        after: _.difference(after, covering),
        internal: internal,
        matching: _.intersection(start, end),
    };
};

var fixupStretchSteps = function (stretch) {
    var end = stretch.steps[stretch.steps.length - 1];
    var steps = [];
    var step = stretch.steps[0];
    while (step) {
        steps.push(step);
        if (step === end) {
            break;
        }
        step = step.next;
    }
    setStretchSteps(stretch, steps);
};

var orderGroups = function (groups) {
    return groups.sort(function (a, b) {
        if (a.stretches[0].steps.length !== b.stretches[0].steps.length) {
            return a.stretches[0].steps.length < b.stretches[0].steps.length ? -1 : +1;
        }
        return 0;
    });
};

var groupsToDraw = function (groups) {
    groups = _.filter(groups, function (group) {
        group.pseudoStretches = _.map(group.stretches, function (stretch) {
            computePseudoStretchSteps(stretch.pseudoStretch);
            return stretch.pseudoStretch;
        });
        group.pseudoStretches = _.filter(group.pseudoStretches, function (stretch) {
            return stretch.steps.length;
        });
        return group.pseudoStretches.length > 0;
    });
    return orderGroups(groups);
};
