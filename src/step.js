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
        base: false,
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
        var inputReferenceI = Global.inputReferenceIs[0];
        var changeReference = inputReferences[inputReferenceI];
        var fixCursor = Reference.isLiteral(changeReference);

        var absolute = changeReference.absolute;
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

        Main.update();

        if (fixCursor) {
            var container = d3.select(expressionEl);
            DrawReferences.selectReference(changeReference, inputReferenceI, container);
        }

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
        var tokens = StepExecution.lex(expressionEl.textContent);
        var text = Step.textFromLexedTokens(tokens);

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

        Main.update();
    }

};

Step.enteringLiteral = function (key) {
    var inputReferenceI = Global.inputReferenceIs[0];
    var range = DomRange.currentRange();
    if (
        !range ||
        range.toString().length ||
        !Global.inputStepView ||
        inputReferenceI == null
    ) {
        return;
    }

    var inputStep = Global.inputStepView.step;
    var reference = inputStep.references[inputReferenceI];

    if (Reference.isLiteral(reference)) {
        return;
    }

    var isSuperStep = SuperStep.isSuperStep(inputStep);
    _.each(Global.active, function (stretch) {
        if (isSuperStep) {
            var step = SuperStep.findFromSteps(stretch.steps);
            if (!step) {
                return;
            }
        } else {
            var step = stretch.steps[0];
        }
        _.each(Global.inputReferenceIs, function (referenceI) {
            var reference = step.references[referenceI];
            reference.source = reference;
            reference.result = key
        });
    });

    d3.event.preventDefault();
    Main.update();
};

Step.enteringNonLiteral = function (key) {
    Global.lostLiterals = {};
};

var lexFromExpression = function (expressionEl) {
    var tokens = [];
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
        var childTokens = StepExecution.lex(childNode.textContent);
        _.each(childTokens, function (token) {
            if (token.type === 'reference' || token.type === 'literal') {
                token.originalReferenceI = originalReferenceI;
            }
        });
        tokens = tokens.concat(childTokens);
    });

    var mergedTokens = [];
    var lastToken = {type: 'start-token'};
    _.each(tokens, function (token) {
        if (token.type === 'literal' && lastToken.type === 'literal') {
            lastToken.text += token.text;
            if (lastToken.originalReferenceI == null) {
                lastToken.originalReferenceI = token.originalReferenceI;
            }
        } else {
            mergedTokens.push(token);
            lastToken = token;
        }
    });

    return mergedTokens;
};

Step.textFromLexedTokens = function (tokens) {
    return _.map(tokens, function (token) {
        if (token.type === 'reference' || token.type === 'literal') {
            return Reference.sentinelCharacter;
        } else {
            return token.text;
        }
    }).join('');
};

Step.updateText = function (expressionEl) {
    var tokens = lexFromExpression(expressionEl);
    var text = Step.textFromLexedTokens(tokens);
    var referenceTokens = _.filter(tokens, function (token) {
        return token.type === 'literal' || token.type === 'reference';
    });

    var inputStep = Global.inputStepView.step;
    var isSuperStep = SuperStep.isSuperStep(inputStep);

    ///// lost literal
    var originalReferenceIs = _.pluck(referenceTokens, 'originalReferenceI');
    var lostReferences = _.filter(inputStep.references, function (reference, i) {
        return !_.contains(originalReferenceIs, i);
    });
    if (
        lostReferences.length === 1 &&
        Reference.isLiteral(lostReferences[0])
    ) {
        var lostLiteral = lostReferences[0];
        var lostLiteralI = _.indexOf(inputStep.references, lostLiteral);
        var originalTokens = StepExecution.lex(inputStep.text);
        var minusLostTokens = _.filter(originalTokens, function (token) {
            return token.referenceI !== lostLiteralI;
        });
        var minusLostText = Step.textFromLexedTokens(minusLostTokens);
        var didLoseLiteral = text === minusLostText;

    } else {
        var didLoseLiteral = false;
    }

    if (didLoseLiteral) {
        Global.lostLiterals = {};
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

        var references = _.map(referenceTokens, function (ref) {
            if (ref.originalReferenceI == null) {
                var lostLiteral = Global.lostLiterals[step.id];
                if (
                    ref.type === 'literal' &&
                    lostLiteral
                ) {
                    var reference = lostLiteral;
                } else {
                    var reference = Reference.create();
                    reference.sink = step;
                }
            } else {
                var reference = step.references[ref.originalReferenceI];
            }
            if (ref.type === 'literal') {
                reference.source = reference;
                reference.result = ref.text;
            }
            return reference;
        });

        if (didLoseLiteral) {
            var lostLiteral = step.references[lostLiteralI];
            if (lostLiteral) {
                Global.lostLiterals[step.id] = lostLiteral;
            }
        }

        step.text = text;
        if (isSuperStep) {
            step.references = references;
        } else {
            Step.setReferences(step, references);
        }
    });

    if (!didLoseLiteral) {
        Global.lostLiterals = {};
    }

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
