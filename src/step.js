'use strict';
var Step = {};
(function () {

Step.create = function () {
    var step = {
        id: Main.newId(),
        text: '',
        stretches: [],
        references: [],
        referencedBy: [],
        next: null,
        previous: null,
        underStepView: null,
        result: null,
    };
    step.stepView = StepView.create(step);
    return step;
};

Step.computeSteps = function () {
    Global.steps = [];
    var step = Global.stepsHead.next;
    while (step) {
        Global.steps.push(step);
        step = step.next;
    }
};

Step.linkSteps = function (steps) {
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

Step.setReferences = function (step, references) {
    _.each(step.references, function (oldReference) {
        oldReference.source.referencedBy = _.without(oldReference.source.referencedBy, oldReference);
    });
    _.each(references, function (newReference) {
        newReference.source.referencedBy.push(newReference);
    });
    step.references = references;
};


// TODO: make this work right for multi-steps (stepViews)
Step.computeReferenceInfo = function () {
    _.each(Global.steps, function (step, i) {
        step.__index = i;
        step.referenceAway = null;
    });
    var stepView = Main.targetStepView();
    if (!stepView || MultiStep.isMultiStep(stepView.step)) {
        return;
    };
    var step = stepView.steps[0];
    _.each(step.references, function (reference) {
        reference.source.referenceAway = step.__index - reference.source.__index;
    });
};

Step.insertOrUpdateReference = function (resultStepView) {
    if (!Global.insertStepView) {
        return;
    }

    // TODO: get this working for multi-step
    if (MultiStep.isMultiStep(Global.insertStepView.step)) {
        return;
    }
    var resultStep = resultStepView.steps[resultStepView.steps.length - 1];
    var stepView = Global.insertStepView;
    var expressionEl = d3.select(stepView.__el__).select('.expression').node();

    var referenceAway = stepView.step.__index - resultStep.__index;
    if (referenceAway <= 0) {
        return;
    }

    var insertBeforeI = Math.ceil(Global.insertReferenceIs[0]);
    if (Global.insertReferenceIs[0] + 0.5 === insertBeforeI) {
        var cursorOffset = DomRange.currentCursorOffset(expressionEl);
        var fullRange = document.createRange();
        fullRange.selectNodeContents(expressionEl);
        var before = fullRange.toString().slice(0, cursorOffset);
        var after = fullRange.toString().slice(cursorOffset);
        var innerText = Reference.sentinelCharacter;
        if (before && before[before.length - 1] !== ' ') {
            innerText = ' ' + innerText;
        }
        var text = before + innerText + after;
        expressionEl.textContent = text;
        _.each(Global.active.stretches, function (stretch) {
            var step = stretch.steps[0];
            step.text = text;
            var reference = Reference.create();
            reference.source = Global.steps[step.__index - referenceAway];
            reference.sink = step;
            step.references.splice(insertBeforeI, 0, reference);
            Step.setReferences(step, step.references);
        });
        DomRange.setCurrentCursorOffset(expressionEl, (before + innerText).length);
    } else {
        _.each(Global.active.stretches, function (stretch) {
            var sink = stretch.steps[0];
            var source = Global.steps[sink.__index - referenceAway];
            _.each(Global.insertReferenceIs, function (referenceI) {
                var reference = sink.references[referenceI];
                Reference.setSource(reference, source);
            });
        });
    }

    Main.update();
};

Step.updateText = function (expressionEl) {
    if (MultiStep.isMultiStep(Global.insertStepView.step)) {
        _.each(Global.active.stretches, function (stretch) {
            var multiStep = MultiStep.findFromSteps(stretch.steps);
            if (multiStep) {
                multiStep.text = expressionEl.textContent; // TODO: multi-step references
            }
        });
    } else {
        var referenceClasses = [];
        d3.select(expressionEl).selectAll('.reference-text').each(function () {
            referenceClasses = referenceClasses.concat(_.toArray(this.classList));
        });
        referenceClasses = _.without(referenceClasses, 'reference-text');
        var referenceIs = _.map(referenceClasses, function (ref) {
            return +ref.slice('reference-'.length);
        });
        _.each(Global.active.stretches, function (stretch) {
            _updateText(stretch.steps[0], expressionEl, referenceIs);
        });
    }
    Main.update();
};

var _updateText = function (step, expressionEl, referenceIs) {
    step.text = expressionEl.textContent;
    var references = _.map(referenceIs, function (referenceI) {
        return step.references[referenceI];
    });
    Step.setReferences(step, references);
}

})();
