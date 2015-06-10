var createStepView = function (stretch) {
    return {
        _type: 'stepView',
        stretch: stretch,
        __el__: null,
        next: null,
        previous: null,
    };
};

var realSteps = function (stepViews) {
    return _.reduce(stepViews, function (steps, stepView) {
        return steps.concat(stepView.stretch.steps);
    }, []);
};

var computeStepViews = function () {
    allStepViews = [];
    var stepView = null;

    var real = allSteps[0];
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
            maxStretch = real;
        }
        allStepViews.push(maxStretch.stepView);
        var nextReal = maxStretch.steps[maxStretch.steps.length - 1].next;
        while (real && real !== nextReal) {
            real.underStepView = maxStretch.stepView;
            real = real.next;
        }
    }

    linkSteps(allStepViews);
};
