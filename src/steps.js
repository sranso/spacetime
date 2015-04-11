var idSequence = 0;

var newId = function () {
    idSequence += 1;
    return idSequence;
};

// A step is its own stretch.
var createStep = function (step) {
    step = _.extend({
        _type: 'step',
        text: '',
        parsedText: null,
        expanded: true,
        stretches: [],
        referencedBy: [],
        next: null,
        previous: null,
        underPseudo: null,
        result: null,
    }, step || {});
    step.steps = [step];
    step.id = newId();
    step.pseudo = createPseudoStep(step);
    return step;
};

var cloneStep = function (original) {
    var step = createStep(original);
    step.stretches = [];
    return step;
};

var createPseudoStep = function (stretch) {
    return {
        _type: 'pseudo',
        stretch: stretch,
        __el__: null,
        next: null,
        previous: null,
    };
};

var realSteps = function (pseudoSteps) {
    return _.reduce(pseudoSteps, function (steps, pseudo) {
        return steps.concat(pseudo.stretch.steps);
    }, []);
};

var computeSteps = function () {
    allSteps = [];
    var step = allStepsHead.next;
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
        var maxStretch = {steps: []};
        _.each(real.stretches, function (stretch) {
            if (!stretch.expanded) {
                if (stretch.steps.length > maxStretch.steps.length) {
                    maxStretch = stretch;
                }
            }
        });

        if (!maxStretch.steps.length) {
            maxStretch = real;
        }
        allPseudoSteps.push(maxStretch.pseudo);
        var nextReal = maxStretch.steps[maxStretch.steps.length - 1].next;
        while (real && real !== nextReal) {
            real.underPseudo = maxStretch.pseudo;
            real = real.next;
        }
    }

    linkSteps(allPseudoSteps);
};

var linkSteps = function (steps) {
    var previous = null;
    _.each(steps, function (step) {
        if (!step) {
            return;
        }
        if (previous) {
            previous.next = step;
            step.previous = previous;
        }
        previous = step;
    });
};


// TODO: make this work right for pseudoSteps
var computeReferenceInfo = function () {
    _.each(allSteps, function (step, i) {
        step.__index = i;
        step.referencedBy = [];
        var references = _.filter(step.parsedText, function (d) {
            return d._type === 'reference';
        });
        _.each(references, function (reference) {
            reference.reference.__maxReferenceI = i;
            reference.reference.referencedBy.push(step);
        });
    });
    _.each(allSteps, function (step) {
        step.farthestReferenceAway = (step.__maxReferenceI - step.__index) || 1;
        delete step.__index;
        delete step.__maxReferenceI;
    });
};
