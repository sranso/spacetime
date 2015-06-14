'use strict';
var StepExecution = {};
(function () {

StepExecution.execute = function () {
    var start = +Date.now();
    _.each(Global.steps, executeStep);
    var end = +Date.now();
    console.log(end - start);
};

StepExecution.parse = function (step) {
    var text = step.text;
    var parsed = [];
    var segment = {
        type: 'text',
        text: '',
    };
    parsed.push(segment);
    var referenceI = 0;
    for (var i = 0; i < text.length; i++) {
        if (text[i] === Reference.sentinelCharacter) {
            var segment = {
                type: 'reference',
                referenceI: referenceI,
            }
            referenceI += 1;
            parsed.push(segment);

            var segment = {
                type: 'text',
                text: '',
            };
            parsed.push(segment);
        } else {
            segment.text += text[i];
        }
    }

    return parsed;
};

var executeStep = function (step) {
    var parsed = StepExecution.parse(step);
    var toEval = _.map(parsed, function (segment) {
        if (segment.type === 'reference') {
            var result = step.references[segment.referenceI].source.result;
            return '(' + result + ')';
        }
        return segment.text;
    });
    toEval = toEval.join('');

    try {
        step.result = eval(toEval);
    } catch (exception) {
        console.log(exception);
        step.result = NaN;
    }
    if (_.isFunction(step.result)) {
        step.result.toString = function () { return this.name };
    }
    if (step.result == null) {
        step.result = NaN;
    }
};

})();
