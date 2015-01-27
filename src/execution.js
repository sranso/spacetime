var executeSteps = function () {
    _.each(allSteps, executeStep);
};

var parseStep = function (step) {
    var text = step.text;
    var lastChar = '';
    var parsed = '';
    while (text.length) {
        var nextChar = text[1];
        if (
            text[0] === '.' &&
            !('0' <= lastChar && lastChar <= '9') &&
            !('0' <= nextChar && nextChar <= '9')
        ) {
            var referencedStep = step;
            while (text[0] === '.') {
                referencedStep = referencedStep && referencedStep.previous;
                text = text.slice(1);
            }

            parsed += '(' + (referencedStep && referencedStep.result) + ')';

            if (!text.length) {
                break;
            }
        }

        parsed += text[0];
        lastChar = text[0];
        text = text.slice(1);
    }

    return parsed;
};

var executeStep = function (step) {
    var parsed = parseStep(step);
    try {
        step.result = eval(parsed);
    } catch (exception) {
        console.log(exception);
        step.result = null;
    }
};
