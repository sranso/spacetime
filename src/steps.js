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
        references: [],
        implicitReference: null,
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


// TODO: make this work right for stretches (pseudoSteps)
var computeReferenceInfo = function () {
    _.each(allSteps, function (step, i) {
        step.__index = i;
        step.referenceAway = null;
        var references = _.filter(step.parsedText, function (d) {
            return d._type === 'reference';
        });
        step.references = _.pluck(references, 'reference');
    });
    var step = targetStep();
    if (!step || step._type !== 'step') {
        return;
    };
    _.each(step.references, function (reference) {
        reference.referenceAway = step.__index - reference.__index;
    });
};

var insertOrUpdateReference = function (resultPseudo) {
    if (insertStep._type === 'stretch') {
        return;
    }
    var resultStep = resultPseudo.stretch.steps[resultPseudo.stretch.steps.length - 1];
    var pseudo = insertStep.steps[0].underPseudo;
    var expressionEl = d3.select(pseudo.__el__).select('.expression').node();

    var referenceAway = insertStep.__index - resultStep.__index;
    if (referenceAway <= 0) {
        return;
    }
    var innerText = Array(referenceAway + 1).join('.');

    if (insertReferences.length) {
        _.each(insertReferences, function (reference) {
            reference.textEl.textContent = innerText;
        });
        var text = expressionEl.textContent;
        _.each(__active.stretches, function (stretch) {
            stretch.steps[0].text = text;
        });
        var range = currentRange();
        if (range) {
            var lastRef = insertReferences[insertReferences.length - 1];
            range.setEnd(lastRef.textEl.firstChild, innerText.length);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    } else {
        var cursorOffset = currentCursorOffset(expressionEl);
        var fullRange = document.createRange();
        fullRange.selectNodeContents(expressionEl);
        var before = fullRange.toString().slice(0, cursorOffset);
        var after = fullRange.toString().slice(cursorOffset);
        if (before && before[before.length - 1] !== ' ') {
            innerText = ' ' + innerText;
        }
        var text = before + innerText + after;
        expressionEl.textContent = text;
        _.each(__active.stretches, function (stretch) {
            stretch.steps[0].text = text;
        });
        setCurrentCursorOffset(expressionEl, (before + innerText).length);
    }

    update();
};
