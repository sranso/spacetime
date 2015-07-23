'use strict';
var SuperStep = {};
(function () {

SuperStep.create = function () {
    var superStep = {
        id: Main.newId(),
        matchesId: null,
        text: '',
        steps: [],
        collapsed: false,
        groupStretch: null,
        references: [],
        autocompleted: false,
    };
    superStep.stepView = StepView.create(superStep);
    return superStep;
};

SuperStep.isSuperStep = function (step) {
    return step.steps && step.hasOwnProperty('text');
};

SuperStep.isExpression = function (superStep) {
    return superStep.text === null;
};

// debug only
SuperStep.allSuperSteps = function () {
    var stepStretches = _.flatten(_.pluck(Global.steps, 'stretches'));
    return _.uniq(_.filter(stepStretches, SuperStep.isSuperStep));
};

SuperStep.findFromSteps = function (steps) {
    var candidates = steps[0].stretches;
    return _.find(candidates, function (stretch) {
        if (!SuperStep.isSuperStep(stretch)) {
            return false;
        }
        return stretch.steps[0] === steps[0] && stretch.steps[stretch.steps.length - 1] === steps[steps.length - 1];
    });
};

SuperStep.isEnabled = function (superStep) {
    return _.some(superStep.steps, function (step) {
        return Step.isEnabled(step);
    });
};

SuperStep.forceDisabled = function (superStep) {
    return _.min(_.pluck(superStep.steps, 'forceDisabled'));
};

SuperStep.forceEnabled = function (superStep) {
    return _.some(superStep.steps, function (step) {
        return step.forceEnabled.length && Step.isEnabled(step);
    });
};

SuperStep.enabledBy = function (superStep) {
    return _.intersection.apply(_, _.pluck(superStep.steps, 'enabledBy'));
};

SuperStep.insertOrUpdateReference = function (containingStep, reference) {
    if (!Global.inputStepView) {
        return false;
    }

    if (!SuperStepView.isSuperStepView(Global.inputStepView)) {
        return false;
    };

    var inputStep = Global.inputStepView.step;
    if (!SuperStep.isSuperStep(inputStep)) {
        return false;
    }

    if (inputStep === containingStep) {
        return false;
    }

    var isSeries = Series.isSeries(reference.sink);
    if (isSeries) {
        var stretches = reference.sink.stretches;
        if (!_.contains(inputStep.steps, stretches[0].steps[0])) {
            return false;
        }
        var lastStretch = stretches[stretches.length - 1];
        if (!_.contains(inputStep.steps, lastStretch.steps[lastStretch.steps.length - 1])) {
            return false;
        }
    } else {
        if (!_.contains(inputStep.steps, reference.sink)) {
            return false;
        }
    }

    d3.event.stopPropagation();

    var expressionEl = d3.select(Global.inputStepView.__el__).select('.expression').node();

    if (isSeries) {
        var stretch = reference.sink.stretches[0];
        var active = Active.computeActive(stretch.group.stretches, Global.active, stretch, Global.active.focus);
    } else {
        var referenceI = _.indexOf(reference.sink.references, reference);
        var referenceAway = reference.sink.__index - inputStep.steps[0].__index;
        var active = _.map(Global.active, function (stretch) {
            return [null, stretch];
        });
    }

    if (Global.inputReferenceIs.length) {
        var inputReferenceI = Global.inputReferenceIs[0];
        var replaceReference = inputStep.references[inputReferenceI];
        var fixCursor = Reference.isLiteral(reference) !== Reference.isLiteral(replaceReference);

        _.each(active, function (a) {
            var stretch = a[1];
            var step = SuperStep.findFromSteps(stretch.steps);
            if (!step) {
                return;
            }
            if (isSeries) {
                var series = a[0].series;
                var reference = series && series.targetLengthBy;
            } else {
                var sink = Global.steps[step.steps[0].__index + referenceAway];
                var reference = sink.references[referenceI];
            }
            if (!reference) {
                return;
            }
            _.each(Global.inputReferenceIs, function (referenceI) {
                step.references[referenceI] = reference;
            });
        });

        Main.update();

        if (fixCursor) {
            var container = d3.select(expressionEl);
            DrawReferences.selectReference(reference, inputReferenceI, container);
        }

    } else {
        var insertBeforeI = Global.inputReferenceIs.cursorIndex;
        var cursorOffset = DomRange.currentCursorOffset(expressionEl);
        var fullRange = document.createRange();
        fullRange.selectNodeContents(expressionEl);
        var before = fullRange.toString().slice(0, cursorOffset);
        var after = fullRange.toString().slice(cursorOffset);
        if (Reference.isLiteral(reference)) {
            var innerText = reference.result;
        } else {
            var innerText = Reference.sentinelCharacter;
        }
        if (before && before[before.length - 1] !== ' ') {
            innerText = ' ' + innerText;
        }
        expressionEl.textContent = before + innerText + after;
        var tokens = StepExecution.lex(expressionEl.textContent);
        var text = Step.textFromLexedTokens(tokens);

        _.each(active, function (a) {
            var stretch = a[1];
            var step = SuperStep.findFromSteps(stretch.steps);
            if (!step) {
                return;
            }
            var sinkStep = Global.steps[step.steps[0].__index + referenceAway];
            if (isSeries) {
                var series = a[0].series;
                var reference = series && series.targetLengthBy;
            } else {
                var sink = Global.steps[step.steps[0].__index + referenceAway];
                var reference = sink.references[referenceI];
            }
            if (reference) {
                step.text = text;
                step.references.splice(insertBeforeI, 0, reference);
            }
        });
        DomRange.setCurrentCursorOffset(expressionEl, (before + innerText).length);

        Main.update();
    }

    return true;
};

})();
