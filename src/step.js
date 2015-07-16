'use strict';
var Step = {};
(function () {

Step.create = function () {
    var step = {
        id: Main.newId(),
        matchesId: null,
        text: '',
        stretches: [],
        references: [],
        referencedBy: [],
        next: null,
        previous: null,
        underStepView: null,
        result: null,
        enabledBy: [],
        enables: [],
        forceDisabled: 0,
        forceEnabled: [],
        __startSeries: [],
        // editable: true/false,  // only environment steps
    };
    step.stepView = StepView.create(step);
    return step;
};

Step.createForEnvironment = function () {
    var step = Step.create();
    step.__index = -1;
    step.editable = true;
    step.updatedBy = null;
    return step;
};

Step.computeSteps = function () {
    Global.steps = [];
    var step = Global.stepsHead.next;
    var i = 0;
    while (step) {
        step.__index = i;
        Global.steps.push(step);
        step = step.next;
        i += 1;
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

Step.setReferences = function (step, references) {
    _.each(step.references, function (oldReference) {
        if (!Reference.isLiteral(oldReference)) {
            oldReference.source.referencedBy = _.without(oldReference.source.referencedBy, oldReference);
        }
    });
    _.each(references, function (newReference) {
        if (!Reference.isLiteral(newReference)) {
            newReference.source.referencedBy.push(newReference);
        }
    });
    step.references = references;
};

Step.isEnabled = function (step) {
    if (step.forceDisabled) {
        return false;
    }
    if (step.forceEnabled) {
        var enabledBy = _.difference(step.enabledBy, step.forceEnabled);
    } else {
        var enabledBy = step.enabledBy;
    }
    return _.every(enabledBy, 'result');
};

Step.insertOrUpdateReference = function (resultStepView) {
    if (!Global.inputStepView) {
        return;
    }

    var resultStep = resultStepView.steps[resultStepView.steps.length - 1];
    var stepView = Global.inputStepView;
    var expressionEl = d3.select(stepView.__el__).select('.expression').node();

    var referenceAway = stepView.steps[0].__index - resultStep.__index;
    if (referenceAway <= 0) {
        return;
    }

    var isSuperStep = SuperStep.isSuperStep(stepView.step);
    if (isSuperStep && !Global.inputReferenceIs.length) {
        return;
    }

    if (Global.inputReferenceIs.length) {
        var inputReferences = Global.inputStepView.step.references;
        var absolute = inputReferences[Global.inputReferenceIs[0]].absolute;
        if (resultStep.__index === -1) {
            absolute = true;
        }

        _.each(Global.active, function (stretch) {
            if (isSuperStep) {
                var step = SuperStep.findFromSteps(stretch.steps);
                if (!step) {
                    return;
                }
            } else {
                var step = stretch.steps[0];
            }
            if (absolute) {
                var source = resultStep;
            } else if (isSuperStep) {
                var source = Global.steps[step.steps[0].__index - referenceAway];
            } else {
                var source = Global.steps[step.__index - referenceAway];
            }
            _.each(Global.inputReferenceIs, function (referenceI) {
                var reference = step.references[referenceI];
                reference.absolute = absolute;
                Reference.setSource(reference, source);
            });
        });

    } else {
        var insertBeforeI = Global.inputReferenceIs.cursorIndex;
        var cursorOffset = DomRange.currentCursorOffset(expressionEl);
        var fullRange = document.createRange();
        fullRange.selectNodeContents(expressionEl);
        var before = fullRange.toString().slice(0, cursorOffset);
        var after = fullRange.toString().slice(cursorOffset);
        var innerText = Reference.sentinelCharacter;
        if (before && before[before.length - 1] !== ' ') {
            innerText = ' ' + innerText;
        }
        expressionEl.textContent = before + innerText + after;
        var parsed = StepExecution.lex(expressionEl.textContent);
        var text = Step.textFromParsed(parsed);

        _.each(Global.active, function (stretch) {
            var step = stretch.steps[0];
            step.text = text;
            var reference = Reference.create();
            if (resultStep.__index === -1) {  // TODO: better way of doing this
                reference.source = resultStep;
                reference.absolute = true;
            } else {
                reference.source = Global.steps[step.__index - referenceAway];
            }
            reference.sink = step;
            step.references.splice(insertBeforeI, 0, reference);
            Step.setReferences(step, step.references);
        });

        DomRange.setCurrentCursorOffset(expressionEl, (before + innerText).length);
    }

    Main.update();
};

var lexFromExpression = function (expressionEl) {
    var parsed = [];
    _.each(expressionEl.childNodes, function (childNode) {
        if (childNode.nodeType === 3) {
            var originalReferenceI = null;
        } else {
            var referenceIs = _.map(childNode.classList, function (klass) {
                return +klass.slice('reference-'.length);
            });
            var originalReferenceI = _.find(referenceIs, function (i) {
                return !_.isNaN(i);
            });
        }
        var childParsed = StepExecution.lex(childNode.textContent);
        _.each(childParsed, function (token) {
            if (token.type === 'reference' || token.type === 'literal') {
                token.originalReferenceI = originalReferenceI;
            }
        });
        parsed = parsed.concat(childParsed);
    });

    var mergedParsed = [];
    var lastToken = {type: 'start-token'};
    _.each(parsed, function (token) {
        if (token.type === 'literal' && lastToken.type === 'literal') {
            lastToken.text += token.text;
            if (lastToken.originalReferenceI == null) {
                lastToken.originalReferenceI = token.originalReferenceI;
            }
        } else {
            mergedParsed.push(token);
            lastToken = token;
        }
    });

    return mergedParsed;
};

Step.textFromParsed = function (parsed) {
    return _.map(parsed, function (token) {
        if (token.type === 'reference' || token.type === 'literal') {
            return Reference.sentinelCharacter;
        } else {
            return token.text;
        }
    }).join('');
};

Step.updateText = function (expressionEl) {
    var parsed = lexFromExpression(expressionEl);
    var text = Step.textFromParsed(parsed);
    var referenceTokens = _.filter(parsed, function (token) {
        return token.type === 'literal' || token.type === 'reference';
    });

    var isSuperStep = SuperStep.isSuperStep(Global.inputStepView.step);
    _.each(Global.active, function (stretch) {
        if (isSuperStep) {
            var step = SuperStep.findFromSteps(stretch.steps);
            if (!step) {
                return;
            }
        } else {
            var step = stretch.steps[0];
        }
        step.text = text;
        var references = _.map(referenceTokens, function (ref) {
            if (ref.originalReferenceI == null) {
                var reference = Reference.create();
                reference.sink = step;
            } else {
                var reference = step.references[ref.originalReferenceI];
            }
            if (ref.type === 'literal') {
                reference.source = reference;
                reference.result = ref.text;
            }
            return reference;
        });
        if (isSuperStep) {
            step.references = references;
        } else {
            Step.setReferences(step, references);
        }
    });

    Main.update();
};

Step.clickEnableRegion = function (stepView) {
    var active = Active.computeActive([], Selection.backgroundStretches(), [stepView]);
    active = _.pluck(active, '0');
    if (Global.connectStepView) {
        var resultStep = Global.connectStepView.steps[Global.connectStepView.steps.length - 1];
        Global.connectStepView = null;
        var enabledBy = SuperStep.enabledBy(stepView);
        var add = !_.contains(enabledBy, resultStep);

        // TODO: make this work with a different "resultStep" per stretch
        _.each(active, function (stretch) {
            var referenceAway = stretch.steps[0].__index - resultStep.__index;
            if (referenceAway <= 0) {
                return;
            }
            _.each(stretch.steps, function (step) {
                step.enabledBy = _.without(step.enabledBy, resultStep);
                resultStep.enables = _.without(resultStep.enables, step);
                if (add) {
                    step.enabledBy.push(resultStep);
                    resultStep.enables.push(step);
                }
            });
        });

    } else {
        var clearDisabled = SuperStep.forceDisabled(stepView);
        var clearEnabled = SuperStep.forceEnabled(stepView);
        if (clearDisabled || clearEnabled) {
            var forceEnabled = false;
            var forceDisabled = false;
        } else {
            var forceEnabled = d3.event.ctrlKey;
            var forceDisabled = !d3.event.ctrlKey;
        }
        _.each(active, function (stretch) {
            if (forceDisabled) {
                var disableDiff = +1;
            } else {
                var disableDiff = -SuperStep.forceDisabled(stretch);
            }
            if (forceEnabled) {
                var forceEnabledBy = SuperStep.enabledBy(stretch);
                forceEnabledBy.push(true);
            } else {
                var forceEnabledBy = [];
            }
            _.each(stretch.steps, function (step) {
                step.forceDisabled += disableDiff;
                step.forceEnabled = forceEnabledBy;
            });
        });
    }

    Selection.clear('foreground');
    Main.update();
};

Step.setEnvironmentUpdatedBy = function (stepView) {
    var step = stepView.step;
    if (!step.editable) {
        return;
    }
    var resultStep = Global.connectStepView.steps[Global.connectStepView.steps.length - 1];
    if (step.updatedBy === resultStep) {
        step.updatedBy = null;
    } else {
        step.updatedBy = resultStep;
    }

    Main.update();
};

})();
