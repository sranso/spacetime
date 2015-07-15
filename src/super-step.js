'use strict';
var SuperStep = {};
(function () {

SuperStep.create = function () {
    var superStep = {
        id: Main.newId(),
        matchesId: null,
        text: '',
        steps: [],
        collapsed: false,
        groupStretch: null,
        references: [],
    };
    superStep.stepView = StepView.create(superStep);
    return superStep;
};

SuperStep.isSuperStep = function (step) {
    return step.steps && step.hasOwnProperty('text');
};

SuperStep.isExpression = function (superStep) {
    return superStep.text === null;
};

// debug only
SuperStep.allSuperSteps = function () {
    var stepStretches = _.flatten(_.pluck(Global.steps, 'stretches'));
    return _.uniq(_.filter(stepStretches, SuperStep.isSuperStep));
};

SuperStep.findFromSteps = function (steps) {
    var candidates = steps[0].stretches;
    return _.find(candidates, function (stretch) {
        if (!SuperStep.isSuperStep(stretch)) {
            return false;
        }
        return stretch.steps[0] === steps[0] && stretch.steps[stretch.steps.length - 1] === steps[steps.length - 1];
    });
};

SuperStep.isEnabled = function (superStep) {
    return _.some(superStep.steps, function (step) {
        return Step.isEnabled(step);
    });
};

SuperStep.forceDisabled = function (superStep) {
    return _.min(_.pluck(superStep.steps, 'forceDisabled'));
};

SuperStep.forceEnabled = function (superStep) {
    return _.some(superStep.steps, function (step) {
        return step.forceEnabled.length && Step.isEnabled(step);
    });
};

SuperStep.enabledBy = function (superStep) {
    return _.intersection.apply(_, _.pluck(superStep.steps, 'enabledBy'));
};

SuperStep.insertOrUpdateReference = function (containingStep, reference) {
    if (!Global.inputStepView) {
        return false;
    }

    if (!SuperStepView.isSuperStepView(Global.inputStepView)) {
        return false;
    };

    var inputStep = Global.inputStepView.step;
    if (!SuperStep.isSuperStep(inputStep)) {
        return false;
    }

    if (inputStep === containingStep) {
        return false;
    }

    if (!_.contains(inputStep.steps, reference.sink)) {
        return false;
    }

    d3.event.stopPropagation();

    var expressionEl = d3.select(Global.inputStepView.__el__).select('.expression').node();

    var referenceAway = reference.sink.__index - inputStep.steps[0].__index;
    var referenceI = _.indexOf(reference.sink.references, reference);

    if (Global.inputReferenceIs.length) {
        _.each(Global.active, function (stretch) {
            var step = SuperStep.findFromSteps(stretch.steps);
            if (!step) {
                return;
            }
            var sink = Global.steps[step.steps[0].__index + referenceAway];
            var reference = sink.references[referenceI];
            if (!reference) {
                return;
            }
            _.each(Global.inputReferenceIs, function (referenceI) {
                step.references[referenceI] = reference;
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
            var step = SuperStep.findFromSteps(stretch.steps);
            if (!step) {
                return;
            }
            var sink = Global.steps[step.steps[0].__index + referenceAway];
            var reference = sink.references[referenceI];
            if (reference) {
                step.text = text;
                step.references.splice(insertBeforeI, 0, reference);
            }
        });
        DomRange.setCurrentCursorOffset(expressionEl, (before + innerText).length);
    }

    Main.update();
    return true;
};

})();
