'use strict';
var DrawHelper = {};
(function () {

DrawHelper.clipNumber = function (number, length) {
    var numString = '' + number;
    if (numString.length <= length) {
        return numString;
    }
    var before = numString.slice(0, length);
    if (! _.isNumber(number)) {
        return before;
    }
    if (before.indexOf('.') === -1 || numString.slice(0, 4) === '0.000') {
        numString = number.toExponential(20);
    }

    var eIndex = numString.indexOf('e');
    if (eIndex !== -1) {
        var exponent = numString.slice(eIndex);
        var mantissaLength = length - exponent.length;
        var pointAndBeforeLength = numString.indexOf('.') + 1;
        var fractionDigits = mantissaLength - pointAndBeforeLength;
        if (fractionDigits < 0) {
            fractionDigits = 0;
        }
        return number.toExponential(fractionDigits);
    }

    var pointIndex = numString.indexOf('.');
    var fractionDigits = length - pointIndex - 1;
    if (fractionDigits < 0) {
        fractionDigits = 0;
    }
    return number.toFixed(fractionDigits);
};

DrawHelper.lexStepView = function (stepView) {
    if (MultiStep.isMultiStep(stepView.step)) {
        // TODO: make multi-steps lex-able
        return [{
            type: 'text',
            text: stepView.step.text,
        }];
    } else {
        return StepExecution.lex(stepView.step);
    }
};

DrawHelper.drawEnableDisableOuter = function (stepEls) {
    var containerEls = stepEls.select('.enable-disable-outer-container');
    var enableDisableOuterEls = containerEls.selectAll('.enable-disable-outer')
        .data(function (d) {
            var allEnabledBy = MultiStep.enabledBy(d);
            allEnabledBy = _.sortBy(allEnabledBy, '__index');
            return _.map(allEnabledBy, function (enabledBy) {
                return {
                    enabledBy: enabledBy,
                    stepView: d,
                    allEnabledByLength: allEnabledBy.length,
                };
            });
        }) ;

    var enableDisableOuterEnterEls = enableDisableOuterEls.enter().append('div');

    enableDisableOuterEls.exit().remove();

    var targetStepView = Main.targetStepView();

    enableDisableOuterEls
        .attr('class', function (d) {
            var color = DrawReferences.colorForEnableOuterConnector(d.stepView, d.enabledBy);
            return 'enable-disable-outer ' + color;
        })
        .style('top', function (d, i) {
            var px = i * 6 - 3 * d.allEnabledByLength + 2;
            return px + 'px';
        }) ;
};

})();
