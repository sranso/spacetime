'use strict';
var Step = {};
(function () {

Step.create = function () {
    var step = {
        id: Main.newId(),
        text: '',
        stretches: [],
        references: [],
        next: null,
        previous: null,
        underStepView: null,
        result: null,
    };
    // TODO: remove this
    step.stretch = Stretch.create();
    step.stretch.steps = [step];
    step.stretch.expression = true;
    return step;
};

Step.computeSteps = function () {
    Global.steps = [];
    var step = Global.stepsHead.next;
    while (step) {
        Global.steps.push(step);
        step = step.next;
    }
};

Step.linkSteps = function (steps) {
    var previous = null;
    _.each(steps, function (step) {
        if (!step) {
            return;
        }
        if (previous) {
            previous.next = step;
            step.previous = previous;
        }
        previous = step;
    });
};


// TODO: make this work right for stretches (stepViews)
Step.computeReferenceInfo = function () {
    _.each(Global.steps, function (step, i) {
        step.__index = i;
        step.referenceAway = null;
        var references = _.filter(StepExecution.parse(step), function (d) {
            return d._type === 'reference';
        });
        step.references = _.pluck(references, 'reference');
    });
    var stepView = Main.targetStepView();
    if (!stepView || !stepView.stretch.expression) {
        return;
    };
    var step = stepView.stretch.steps[0];
    _.each(step.references, function (reference) {
        reference.referenceAway = step.__index - reference.__index;
    });
};

Step.insertOrUpdateReference = function (resultStepView) {
    if (!Global.insertStepView.stretch.expression) {
        return;
    }
    var resultStep = resultStepView.stretch.steps[resultStepView.stretch.steps.length - 1];
    var stepView = Global.insertStepView.stretch.steps[0].underStepView;
    var expressionEl = d3.select(stepView.__el__).select('.expression').node();

    var referenceAway = Global.insertStepView.stretch.steps[0].__index - resultStep.__index;
    if (referenceAway <= 0) {
        return;
    }
    var innerText = Array(referenceAway + 1).join('.');

    if (Global.insertReferences.length) {
        _.each(Global.insertReferences, function (reference) {
            reference.textEl.textContent = innerText;
        });
        var text = expressionEl.textContent;
        _.each(Global.active.stretches, function (stretch) {
            stretch.steps[0].text = text;
            stretch.steps[0].stretch.text = text;
        });
        var range = DomRange.currentRange();
        if (range) {
            var lastRef = Global.insertReferences[Global.insertReferences.length - 1];
            range.setEnd(lastRef.textEl.firstChild, innerText.length);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    } else {
        var cursorOffset = DomRange.currentCursorOffset(expressionEl);
        var fullRange = document.createRange();
        fullRange.selectNodeContents(expressionEl);
        var before = fullRange.toString().slice(0, cursorOffset);
        var after = fullRange.toString().slice(cursorOffset);
        if (before && before[before.length - 1] !== ' ') {
            innerText = ' ' + innerText;
        }
        var text = before + innerText + after;
        expressionEl.textContent = text;
        _.each(Global.active.stretches, function (stretch) {
            stretch.steps[0].text = text;
            stretch.steps[0].stretch.text = text;
        });
        DomRange.setCurrentCursorOffset(expressionEl, (before + innerText).length);
    }

    Main.update();
};

})();
