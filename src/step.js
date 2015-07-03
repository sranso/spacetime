'use strict';
var Step = {};
(function () {

Step.create = function () {
    var step = {
        id: Main.newId(),
        matchesId: null,
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
        forceEnabled: [],
        // editable: true/false,  // only environment steps
    };
    step.stepView = StepView.create(step);
    return step;
};

Step.createForEnvironment = function () {
    var step = Step.create();
    step.__index = -1;
    step.editable = true;
    step.updatedBy = null;
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
    if (step.forceDisabled) {
        return false;
    }
    if (step.forceEnabled) {
        var enabledBy = _.difference(step.enabledBy, step.forceEnabled);
    } else {
        var enabledBy = step.enabledBy;
    }
    return _.every(enabledBy, 'result');
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
        if (resultStep.__index === -1) {
            absolute = true;
        }
        _.each(Global.active, function (stretch) {
            var sink = stretch.steps[0];
            if (absolute) {
                var source = resultStep;
            } else {
                var source = Global.steps[sink.__index - referenceAway];
            }
            _.each(Global.inputReferenceIs, function (referenceI) {
                var reference = sink.references[referenceI];
                reference.absolute = absolute;
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
        _.each(Global.active, function (stretch) {
            var step = stretch.steps[0];
            step.text = text;
            var reference = Reference.create();
            if (resultStep.__index === -1) {  // TODO: better way of doing this
                reference.source = resultStep;
                reference.absolute = true;
            } else {
                reference.source = Global.steps[step.__index - referenceAway];
            }
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
        _.each(Global.active, function (stretch) {
            var multiStep = MultiStep.findFromSteps(stretch.steps);
            if (multiStep) {
                multiStep.text = expressionEl.textContent; // TODO: multi-step references
            }
        });
    } else {
        var referenceClasses = [];
        d3.select(expressionEl).selectAll('.reference-placeholder').each(function () {
            referenceClasses = referenceClasses.concat(_.toArray(this.classList));
        });
        referenceClasses = _.without(referenceClasses, 'reference-placeholder');
        var referenceIs = _.map(referenceClasses, function (ref) {
            return +ref.slice('reference-'.length);
        });
        _.each(Global.active, function (stretch) {
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
        var enabledBy = MultiStep.enabledBy(stepView);
        var add = !_.contains(enabledBy, resultStep);

        // TODO: make this work with a different "resultStep" per stretch
        _.each(Global.active, function (stretch) {
            var referenceAway = stretch.steps[0].__index - resultStep.__index;
            if (referenceAway <= 0) {
                return;
            }
            _.each(stretch.steps, function (step) {
                step.enabledBy = _.without(step.enabledBy, resultStep);
                resultStep.enables = _.without(resultStep.enables, step);
                if (add) {
                    step.enabledBy.push(resultStep);
                    resultStep.enables.push(step);
                }
            });
        });

    } else {
        var clearDisabled = MultiStep.forceDisabled(stepView);
        var clearEnabled = MultiStep.forceEnabled(stepView);
        if (clearDisabled || clearEnabled) {
            var forceEnabled = false;
            var forceDisabled = false;
        } else {
            var forceEnabled = d3.event.ctrlKey;
            var forceDisabled = !d3.event.ctrlKey;
        }
        _.each(Global.active, function (stretch) {
            if (forceDisabled) {
                var disableDiff = +1;
            } else {
                var disableDiff = -MultiStep.forceDisabled(stretch);
            }
            if (forceEnabled) {
                var forceEnabledBy = MultiStep.enabledBy(stretch);
                forceEnabledBy.push(true);
            } else {
                var forceEnabledBy = [];
            }
            _.each(stretch.steps, function (step) {
                step.forceDisabled += disableDiff;
                step.forceEnabled = forceEnabledBy;
            });
        });
    }

    Selection.clear('foreground');
    Main.update();
};

Step.setEnvironmentUpdatedBy = function (stepView) {
    var step = stepView.step;
    if (!step.editable) {
        return;
    }
    var resultStep = Global.connectStepView.steps[Global.connectStepView.steps.length - 1];
    if (step.updatedBy === resultStep) {
        step.updatedBy = null;
    } else {
        step.updatedBy = resultStep;
    }

    Main.update();
};

})();
