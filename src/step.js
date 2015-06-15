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
        enabledBy: [],
        enables: [],
        forceDisabled: 0,
    };
    step.stepView = StepView.create(step);
    return step;
};

Step.computeSteps = function () {
    Global.steps = [];
    var step = Global.stepsHead.next;
    var i = 0;
    while (step) {
        step.__index = i;
        Global.steps.push(step);
        step = step.next;
        i += 1;
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

Step.isEnabled = function (step) {
    return step.forceDisabled === 0 && _.every(step.enabledBy, 'result');
};

Step.insertOrUpdateReference = function (resultStepView) {
    if (!Global.inputStepView) {
        return;
    }

    // TODO: get this working for multi-step
    if (MultiStep.isMultiStep(Global.inputStepView.step)) {
        return;
    }
    var resultStep = resultStepView.steps[resultStepView.steps.length - 1];
    var stepView = Global.inputStepView;
    var expressionEl = d3.select(stepView.__el__).select('.expression').node();

    var referenceAway = stepView.step.__index - resultStep.__index;
    if (referenceAway <= 0) {
        return;
    }

    if (Global.inputReferenceIs.length) {
        var inputReferences = Global.inputStepView.step.references;
        var absolute = inputReferences[Global.inputReferenceIs[0]].absolute;
        _.each(Global.active.stretches, function (stretch) {
            var sink = stretch.steps[0];
            if (absolute) {
                var source = resultStep;
            } else {
                var source = Global.steps[sink.__index - referenceAway];
            }
            _.each(Global.inputReferenceIs, function (referenceI) {
                var reference = sink.references[referenceI];
                Reference.setSource(reference, source);
            });
        });
    } else {
        var insertBeforeI = Global.inputReferenceIs.cursorIndex;
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
    }

    Main.update();
};

Step.updateText = function (expressionEl) {
    if (MultiStep.isMultiStep(Global.inputStepView.step)) {
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

Step.clickEnableRegion = function (stepView) {
    Active.computeActive(stepView);
    if (Global.connectStepView) {
        var resultStep = Global.connectStepView.steps[Global.connectStepView.steps.length - 1];
        Global.connectStepView = null;
        var referenceAway = stepView.step.__index - resultStep.__index;
        //if (referenceAway <= 0) {
            Main.update();
            return;
        //}
        var enabledBy = MultiStep.enabledBy(stepView);
        var add = !_.contains(enabledBy, resultStep);
    } else {
        var enable = !MultiStep.isEnabled(stepView);
        _.each(Global.active.stretches, function (stretch) {
            if (enable) {
                var diff = -_.min(_.pluck(stretch.steps, 'forceDisabled'));
            } else {
                var diff = +1;
            }
            _.each(stretch.steps, function (step) {
                step.forceDisabled += diff;
            });
        });
    }
    // TODO: remove this after fixing active for multi-steps.
    // _.each(stepView.steps, function (step) {
    //     step.enabled = !enabled;
    // });
    Main.update();
};

})();
