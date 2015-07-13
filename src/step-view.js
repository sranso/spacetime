'use strict';
var StepView = {};
(function () {

StepView.create = function (step) {
    var stepView = {
        step: step,
        steps: [],
        __el__: null,
        next: null,
        previous: null,
        startMultiSteps: [],
        endMultiSteps: [],
        startSeries: false,
        endSeries: false,
    };

    // TODO: remove this.
    Object.defineProperty(stepView, 'steps', {
        get: function () {
            return MultiStep.isMultiStep(stepView.step) ? stepView.step.steps : [stepView.step];
        },
    });
    return stepView;
};

StepView.realSteps = function (stepViews) {
    return _.reduce(stepViews, function (steps, stepView) {
        return steps.concat(stepView.steps);
    }, []);
};

StepView.computeViews = function () {
    Global.stepViews = [];
    var stepView = null;

    var real = Global.steps[0];
    while (real) {
        var maxStep = {steps: []};
        _.each(real.stretches, function (multiStep) {
            if (MultiStep.isMultiStep(multiStep) && multiStep.collapsed) {
                if (multiStep.steps.length > maxStep.steps.length) {
                    maxStep = multiStep;
                }
            }
        });

        var nextReal;
        if (maxStep.steps.length) {
            nextReal = maxStep.steps[maxStep.steps.length - 1].next;
        } else {
            maxStep = real;
            nextReal = real.next;
        }
        while (real && real !== nextReal) {
            real.underStepView = maxStep.stepView;
            real = real.next;
        }
        Global.stepViews.push(maxStep.stepView);
    }

    Step.linkSteps(Global.stepViews);
    computeSeries(Global.stepViews);
};

var computeSeries = function (stepViews) {
    _.each(stepViews, function (stepView) {
        var startStep = stepView.steps[0];
        var endStep = stepView.steps[stepView.steps.length - 1];
        stepView.startSeries = _.some(startStep.stretches, function (stretch) {
            return (
                Stretch.isGroupStretch(stretch) &&
                stretch.steps[0] === startStep &&
                stretch.series &&
                _.contains(stretch.steps, endStep)
            );
        });
        stepView.endSeries = _.some(endStep.stretches, function (stretch) {
            return (
                Stretch.isGroupStretch(stretch) &&
                stretch.steps[stretch.steps.length - 1] === endStep &&
                stretch.series &&
                _.contains(stretch.steps, startStep)
            );
        });
    });
};

})();
