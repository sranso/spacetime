'use strict';
var MultiStep = {};
(function () {

MultiStep.create = function () {
    var multiStep = {
        id: Main.newId(),
        text: '',
        steps: [],
        collapsed: false,
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

MultiStep.enabledBy = function (multiStep) {
    return _.intersection.apply(_, _.pluck(multiStep.steps, 'enabledBy'));
};

})();
