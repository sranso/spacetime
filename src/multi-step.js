'use strict';
var MultiStep = {};
(function () {

MultiStep.create = function () {
    var multiStep = {
        id: Main.newId(),
        matchesId: null,
        text: '',
        steps: [],
        collapsed: false,
        groupStretch: null,
        references: [],
    };
    multiStep.stepView = StepView.create(multiStep);
    return multiStep;
};

MultiStep.isMultiStep = function (step) {
    return step.steps && step.hasOwnProperty('text');
};

MultiStep.isExpression = function (multiStep) {
    return multiStep.text === null;
};

// debug only
MultiStep.allMultiSteps = function () {
    var stepStretches = _.flatten(_.pluck(Global.steps, 'stretches'));
    return _.uniq(_.filter(stepStretches, MultiStep.isMultiStep));
};

MultiStep.findFromSteps = function (steps) {
    var candidates = steps[0].stretches;
    return _.find(candidates, function (stretch) {
        if (!MultiStep.isMultiStep(stretch)) {
            return false;
        }
        return stretch.steps[0] === steps[0] && stretch.steps[stretch.steps.length - 1] === steps[steps.length - 1];
    });
};

MultiStep.isEnabled = function (multiStep) {
    return _.some(multiStep.steps, function (step) {
        return Step.isEnabled(step);
    });
};

MultiStep.forceDisabled = function (multiStep) {
    return _.min(_.pluck(multiStep.steps, 'forceDisabled'));
};

MultiStep.forceEnabled = function (multiStep) {
    return _.some(multiStep.steps, function (step) {
        return step.forceEnabled.length && Step.isEnabled(step);
    });
};

MultiStep.enabledBy = function (multiStep) {
    return _.intersection.apply(_, _.pluck(multiStep.steps, 'enabledBy'));
};

MultiStep.insertOrUpdateReference = function (reference) {
    if (!Global.inputStepView) {
        return false;
    }

    if (!MultiStepView.isMultiStepView(Global.inputStepView)) {
        return false;
    };

    var inputStep = Global.inputStepView.step;
    if (!MultiStep.isMultiStep(inputStep)) {
        return false;
    }

    if (!_.contains(inputStep.steps, reference.sink)) {
        return false;
    }

    d3.event.stopPropagation();

    var expressionEl = d3.select(Global.inputStepView.__el__).select('.expression').node();

    if (Global.inputReferenceIs.length) {
        //_.each(Global.active, function (stretch) {
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
        //});
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
        //_.each(Global.active, function (stretch) {
            //var step = stretch.steps[0];
            var step = inputStep;
            step.text = text;
            step.references.splice(insertBeforeI, 0, reference);
        //});
        DomRange.setCurrentCursorOffset(expressionEl, (before + innerText).length);
    }

    Main.update();
    return true;
};

})();
