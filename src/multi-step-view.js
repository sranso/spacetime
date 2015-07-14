'use strict';
var MultiStepView = {};
(function () {

MultiStepView.create = function (multiStep) {
    return {
        step: multiStep,
        steps: multiStep.steps,
        __el__: null,
    };
};

MultiStepView.computeViews = function () {
    _.each(Global.stepViews, function (stepView) {
        var startStep = stepView.steps[0];
        var endStep = stepView.steps[stepView.steps.length - 1];
        var startMultiSteps = _.filter(startStep.stretches, function (stretch) {
            return (
                MultiStep.isMultiStep(stretch) &&
                stretch.steps[0] === startStep &&
                !stretch.collapsed &&
                _.contains(stretch.steps, endStep)
            );
        });
        startMultiSteps = _.sortBy(startMultiSteps, function (multiStep) {
            var endStep = multiStep.steps[multiStep.steps.length - 1];
            return startStep.__index - endStep.__index;
        });
        stepView.startMultiSteps = _.map(startMultiSteps, MultiStepView.create);

        var endMultiSteps = _.filter(endStep.stretches, function (stretch) {
            return (
                MultiStep.isMultiStep(stretch) &&
                stretch.steps[stretch.steps.length - 1] === endStep &&
                !stretch.collapsed &&
                _.contains(stretch.steps, startStep)
            );
        });
        endMultiSteps = _.sortBy(endMultiSteps, function (multiStep) {
            var startStep = multiStep.steps[0];
            return startStep.__index - endStep.__index;
        });
        stepView.endMultiSteps = _.map(endMultiSteps, MultiStepView.create);
    });
};

MultiStepView.isMultiStepView = function (stepView) {
    return !stepView.startMultiSteps;
};

})();
