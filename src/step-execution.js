'use strict';
var StepExecution = {};
(function () {

StepExecution.execute = function () {
    var start = +Date.now();
    Global.lastQuads = null;
    Series.clearStartSeries();
    Series.tagStartSeries(Global.series);
    executeSteps();
    _.each(Global.environment, updateEnvironment);
    Player.updateAfterExecute();
    var end = +Date.now();
    console.log(end - start);
};

var startNumberChars = ['-', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
var numberChars = ['.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

var tokenChars = ['(', ')', '+', '-', '*', '/', '%'];

StepExecution.lex = function (text) {
    var tokens = [];
    var referenceI = 0;
    var token = {type: 'start-token'};
    for (var i = 0; i < text.length; i++) {
        var c = text[i];
        var nextC = text[i + 1];

        if (c === ' ') {
            if (token.type !== 'whitespace') {
                token = {
                    type: 'whitespace',
                    text: '',
                }
                tokens.push(token);
            }
            token.text += c;
            continue;
        }

        if (c === Reference.sentinelCharacter) {
            token = {
                type: 'reference',
                referenceI: referenceI,
                text: c,
            }
            referenceI += 1;
            tokens.push(token);
            continue;
        }

        if (
            _.contains(startNumberChars, c) &&
            token.type !== 'literal' &&
            (c !== '-' || _.contains(numberChars, nextC))
        ) {
            token = {
                type: 'literal',
                referenceI: referenceI,
                text: '',
            };
            tokens.push(token);
            referenceI += 1;
            token.text += c;
            continue;
        } else if (_.contains(numberChars, c) && token.type === 'literal') {
            token.text += c;
            continue;
        }

        if (_.contains(tokenChars, c)) {
            token = {
                type: 'token',
                text: c,
            };
            tokens.push(token);
            continue;
        }

        if (token.type !== 'text') {
            token = {
                type: 'text',
                text: '',
            };
            tokens.push(token);
        }
        token.text += c;
    }

    return tokens;
};

var actions = {
    combine: {args: [2, 2], execute: Quads.combine},
    shear: {args: [2, 2], execute: Quads.shear},
    move: {args: [3, 3], execute: Quads.move},
    pin: {args: [2, 3], execute: Quads.pin},
    pixel: {args: [0, 1], execute: Quads.pixel},
    rotate: {args: [2, 2], execute: Quads.rotate},
    scale: {args: [3, 3], execute: Quads.scale},
};

var parse = function (step) {
    var tokens = StepExecution.lex(step.text);
    tokens = parseTokenType(step, tokens);
    tokens = consumeActionArguments(tokens);
    return tokens;
};

var parseTokenType = function (step, lexedTokens) {
    var tokens = [];
    for (var i = 0; i < lexedTokens.length; i++) {
        var token = lexedTokens[i];

        if (token.type === 'text' && actions[token.text]) {
            tokens.push({
                type: 'action',
                action: actions[token.text],
            });
        } else if (token.type === 'reference') {
            tokens.push({
                type: 'reference',
                reference: step.references[token.referenceI],
            });
        } else if (token.type === 'token') {
            tokens.push({
                type: 'token',
                value: token.text,
            });
        } // else if 'whitespace' or non-action text, throw out
    }
    return tokens;
};

var consumeActionArguments = function (typedTokens) {
    var tokens = [];
    var i = 0;
    while (i < typedTokens.length) {
        var token = typedTokens[i];
        var tokensRemaining = typedTokens.length - 1 - i;

        if (token.type === 'action') {
            var take = Math.min(tokensRemaining, token.action.args[1]);
            token.args = typedTokens.slice(i + 1, i + 1 + take);
            tokens.push(token);
            i += take || 1;
        } else {
            tokens.push(token);
            i += 1;
        }
    }
    return tokens;
};

var evaluateToken = function (token) {
    if (token.type === 'action') {
        var action = token.action;
        if (token.args.length < action.args[0]) {
            token.result = null;
            token.error = 'too few args';
            return token;
        }
        var args = _.map(token.args, evaluateToken);
        var error = _.find(args, 'error');
        if (error) {
            token.result = null;
            token.error = error;
            return token;
        }
        token.result = action.execute.apply(null, _.pluck(args, 'result'));
        token.error = null;
    } else if (token.type === 'reference') {
        token.result = token.reference.source.result;
        token.error = token.reference.source.error;
    } else {
        token.result = token.value;
        token.error = null;
    }
    return token;
};

var prepareToEval = function (token) {
    if (token.type === 'reference') {
        return '(' + token.result + ')';
    } else {
        return token.result;
    }
};

var executeSteps = function () {
    var lastStep = Global.stepsHead;

    while (true) {
        var step = lastStep.next;
        if (!step) {
            return;
        }
        Series.adjustSeriesLengthFor(step);
        executeStep(step);
        lastStep = step;
    }
};

var executeStep = function (step) {
    if (Step.isEnabled(step)) {
        var tokens = parse(step);

        if (!tokens.length) {
            step.result = null;
            step.error = null;
            return;
        }

        tokens = _.map(tokens, evaluateToken);

        var error = _.find(tokens, 'error');
        if (error) {
            step.result = null;
            step.error = error;
            return;
        }

        var quadsResult = _.find(tokens, function (token) {
            return Quads.isQuads(token.result);
        });
        if (quadsResult) {
            quadsResult = quadsResult.result;
            Global.lastQuads = quadsResult;
            step.result = quadsResult;
            step.error = null;
            return;
        }

        var toEval = _.map(tokens, prepareToEval);
        toEval = toEval.join('');

        try {
            step.result = eval(toEval);
            step.error = null;
        } catch (exception) {
            step.result = null;
            step.error = exception.message;
        }
    } else {
        if (step.previous) {
            step.result = step.previous.result;
            step.error = step.previous.error;
        } else {
            step.result = null;
            step.error = null;
        }
    }
};

var updateEnvironment = function (stepView) {
    var step = stepView.step;
    if (step.editable) {
        step.result = step.updatedBy ? step.updatedBy.result : null;
    }
};

})();
