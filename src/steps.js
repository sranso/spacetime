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
        expanded: true,
        stretches: [],
        references: [],
        next: null,
        previous: null,
        underStepView: null,
        result: null,
    }, step || {});
    step.steps = [step];
    step.id = newId();
    step.stepView = createStepView(step);
    return step;
};

var cloneStep = function (original) {
    var step = createStep(original);
    step.stretches = [];
    return step;
};

var computeSteps = function () {
    allSteps = [];
    var step = allStepsHead.next;
    while (step) {
        allSteps.push(step);
        step = step.next;
    }
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


// TODO: make this work right for stretches (stepViews)
var computeReferenceInfo = function () {
    _.each(allSteps, function (step, i) {
        step.__index = i;
        step.referenceAway = null;
        var references = _.filter(parseStep(step), function (d) {
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

var insertOrUpdateReference = function (resultStepView) {
    if (insertStep._type === 'stretch') {
        return;
    }
    var resultStep = resultStepView.stretch.steps[resultStepView.stretch.steps.length - 1];
    var stepView = insertStep.steps[0].underStepView;
    var expressionEl = d3.select(stepView.__el__).select('.expression').node();

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
