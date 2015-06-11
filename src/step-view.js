var StepView = {};
(function () {

StepView.create = function (stretch) {
    return {
        stretch: stretch,
        __el__: null,
        next: null,
        previous: null,
    };
};

StepView.realSteps = function (stepViews) {
    return _.reduce(stepViews, function (steps, stepView) {
        return steps.concat(stepView.stretch.steps);
    }, []);
};

StepView.computeViews = function () {
    Global.stepViews = [];
    var stepView = null;

    var real = Global.steps[0];
    while (real) {
        var maxStretch = {steps: []};
        _.each(real.stretches, function (stretch) {
            if (!stretch.expanded) {
                if (stretch.steps.length > maxStretch.steps.length) {
                    maxStretch = stretch;
                }
            }
        });

        if (!maxStretch.steps.length) {
            maxStretch = real.stretch;
        }
        Global.stepViews.push(maxStretch.stepView);
        var nextReal = maxStretch.steps[maxStretch.steps.length - 1].next;
        while (real && real !== nextReal) {
            real.underStepView = maxStretch.stepView;
            real = real.next;
        }
    }

    Step.linkSteps(Global.stepViews);
};

})();
