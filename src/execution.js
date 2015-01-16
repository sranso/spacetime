var executeSteps = function () {
    _.each(allSteps, executeStep);
};

var executeStep = function (step) {
    try {
        step.result = eval(step.text);
    } catch (exception) {
        console.log(exception);
        step.result = null;
    }
};
