'use strict';
var StepExecution = {};
(function () {

StepExecution.execute = function () {
    var start = +Date.now();
    _.each(Global.steps, executeStep);
    var end = +Date.now();
    console.log(end - start);
};

StepExecution.lex = function (step) {
    var text = step.text;
    var tokens = [];
    var referenceI = 0;
    var token = null;
    for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (c === ' ') {
            if (!token || token.type !== 'whitespace') {
                token = {
                    type: 'whitespace',
                    text: '',
                }
                tokens.push(token);
            }
            token.text += c;

        } else if (c === Reference.sentinelCharacter) {
            token = {
                type: 'reference',
                referenceI: referenceI,
                text: c,
            }
            referenceI += 1;
            tokens.push(token);

        } else {
            if (!token || token.type !== 'text') {
                token = {
                    type: 'text',
                    text: '',
                };
                tokens.push(token);
            }
            token.text += c;
        }
    }

    return tokens;
};

var actions = {
    combine: {args: [2, 2], execute: Canvas.combine},
    move: {args: [3, 3], execute: Canvas.move},
    pin: {args: [2, 3], execute: Canvas.pin},
    pixel: {args: [0, 1], execute: Canvas.pixel},
    rotate: {args: [2, 2], execute: Canvas.rotate},
    scale: {args: [3, 3], execute: Canvas.scale},
};

StepExecution.parse = function (step) {
    var tokens = StepExecution.lex(step);
    tokens = parseTokenType(step, tokens);
    tokens = consumeActionArguments(tokens);
    return tokens;
};

var parseTokenType = function (step, lexedTokens) {
    var tokens = [];
    for (var i = 0; i < lexedTokens.length; i++) {
        var token = lexedTokens[i];

        if (token.type === 'text') {
            var action = actions[token.text];
            if (action) {
                tokens.push({
                    type: 'action',
                    action: action,
                });
            } else {
                tokens.push({
                    type: 'value',
                    value: token.text,
                });
            }

        } else if (token.type === 'reference') {
            tokens.push({
                type: 'reference',
                reference: step.references[token.referenceI],
            });
        }
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

var executeStep = function (step) {
    if (Step.isEnabled(step)) {
        var tokens = StepExecution.parse(step);

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
            return Canvas.isQuads(token.result);
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

})();
