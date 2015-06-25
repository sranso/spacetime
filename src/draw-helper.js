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

DrawHelper.updateEnableOuterConnectors = function () {
    Draw.trackHtml.selectAll('.enable-outer-connector').remove();

    var targetStepView = Global.inputStepView || Global.hoverResultStepView || Global.hoverStepView;
    if (targetStepView === Global.hoverResultStepView) {
        return;
    }

    var stepEl = targetStepView.__el__;
    var allEnabledBy = MultiStep.enabledBy(targetStepView);
    allEnabledBy = _.sortBy(allEnabledBy, '__index');
    var container = d3.select(stepEl).select('.enable-connector-container');
    var enableOuterConnectorEls = container.selectAll('.enable-outer-connector')
        .data(allEnabledBy).enter().append('div');

    enableOuterConnectorEls
        .attr('class', function (d) {
            var color = DrawReferences.colorForEnableOuterConnector(targetStepView, d);
            return 'enable-outer-connector ' + color;
        })
        .style('top', function (d, i) {
            var px = i * 10 - 5 * allEnabledBy.length + 5;
            return px + 'px';
        }) ;
};

})();
