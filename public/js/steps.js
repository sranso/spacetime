var createStep = function (step) {
    return _.extend({
        text: '',
        pseudo: false,
        groups: [],
        position: null,
        __el__: null,
        next: null,
        previous: null,
    }, step);
};

var createPseudoStep = function (stretch) {
    return {
        text: stretch.group.text,
        pseudo: true,
        stretch: stretch,
        group: stretch.group,
        position: null,
        __el__: null,
        next: null,
        previous: null,
    };
};

var realSteps = function (pseudoSteps) {
    var steps = [];
    _.each(pseudoSteps, function (step) {
        if (step.pseudo) {
            steps = steps.concat(step.stretch);
        } else {
            steps.push(step);
        }
    });
    return steps;
};

var addUnderGroup = function (steps, group) {
    _.each(steps, function (step) {
        step.groups = _.union(step.groups, [group]);
    });
};

var removeUnderGroup = function (steps, group) {
    _.each(steps, function (step) {
        step.groups = _.without(step.groups, group);
    });
};

var computePseudoSteps = function () {
    allPseudoSteps = [];
    var pseudo = null;

    var real = allSteps[0];
    while (real) {
        var maxStretch = {length: 0};
        _.each(real.groups, function (group) {
            if (!group.expanded) {
                var stretches = groupByStretches(orderElements(group.elements));
                var stretch = _.find(stretches, function (stretch) {
                    return _.contains(stretch, real);
                });
                stretch.group = group;
                if (stretch.length > maxStretch.length) {
                    maxStretch = stretch;
                }
            }
        });

        if (maxStretch.length) {
            var pseudo = createPseudoStep(maxStretch);
            allPseudoSteps.push(pseudo);
            real = maxStretch[maxStretch.length - 1].next;
        } else {
            allPseudoSteps.push(real);
            real = real.next;
        }
    }
};
