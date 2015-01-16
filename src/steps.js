var idSequence = 0;

var newId = function () {
    idSequence += 1;
    return idSequence;
};

var createStep = function (step) {
    step = _.extend({
        text: '',
        pseudo: false,
        groups: [],
        next: null,
        previous: null,
        underPseudo: null,
        result: null,
    }, step);
    step.stretch = [step];
    step.id = newId();
    return step;
};

// TODO: only allow groups of single stretches to become
// pseudo steps.
var createPseudoStep = function (stretch) {
    var entity = stretch.group ? stretch.group : stretch[0];
    return {
        id: newId(),
        //id: group.id,
        entity: entity,
        text: entity.text,
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
    return _.reduce(pseudoSteps, function (steps, step) {
        return steps.concat(step.stretch);
    }, []);
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

var computeSteps = function () {
    allSteps = [];
    var step = allStepsLinkedList.next;
    while (step) {
        allSteps.push(step);
        step = step.next;
    }
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

        if (!maxStretch.length) {
            maxStretch = [real];
        }
        var pseudo = createPseudoStep(maxStretch);
        allPseudoSteps.push(pseudo);
        var nextReal = maxStretch[maxStretch.length - 1].next;
        while (real && real !== nextReal) {
            real.underPseudo = pseudo;
            real = real.next;
        }
    }

    linkSteps(allPseudoSteps);

    // TODO: handle inserting (and under) and pseudo steps better.
    if (inserting) {
        inserting = _.find(allPseudoSteps, function (pseudo) {
            return pseudo.entity === inserting.entity;
        });
    }
};

var linkSteps = function (steps) {
    var previous = null;
    _.each(steps, function (step) {
        if (previous) {
            previous.next = step;
        }
        step.previous = previous;
        previous = step;
    });
};
