'use strict';
var SuperStepView = {};
(function () {

SuperStepView.create = function (superStep) {
    return {
        step: superStep,
        steps: superStep.steps,
        __el__: null,
    };
};

SuperStepView.computeViews = function () {
    _.each(Global.stepViews, function (stepView) {
        var startStep = stepView.steps[0];
        var endStep = stepView.steps[stepView.steps.length - 1];
        var startSuperSteps = _.filter(startStep.stretches, function (stretch) {
            return (
                SuperStep.isSuperStep(stretch) &&
                stretch.steps[0] === startStep &&
                !stretch.collapsed &&
                _.contains(stretch.steps, endStep)
            );
        });
        startSuperSteps = _.sortBy(startSuperSteps, function (superStep) {
            var endStep = superStep.steps[superStep.steps.length - 1];
            return startStep.__index - endStep.__index;
        });
        stepView.startSuperSteps = _.map(startSuperSteps, SuperStepView.create);

        var endSuperSteps = _.filter(endStep.stretches, function (stretch) {
            return (
                SuperStep.isSuperStep(stretch) &&
                stretch.steps[stretch.steps.length - 1] === endStep &&
                !stretch.collapsed &&
                _.contains(stretch.steps, startStep)
            );
        });
        endSuperSteps = _.sortBy(endSuperSteps, function (superStep) {
            var startStep = superStep.steps[0];
            return startStep.__index - endStep.__index;
        });
        stepView.endSuperSteps = _.map(endSuperSteps, SuperStepView.create);
    });
};

SuperStepView.isSuperStepView = function (stepView) {
    return !stepView.startSuperSteps;
};

})();
