'use strict';
var Autocomplete = {};
(function () {

var stepBank = [];

Autocomplete.computeAutocomplete = function () {
    if (
        !Global.inputStepView ||
        SuperStepView.isSuperStepView(Global.inputStepView)
    ) {
        Global.autocomplete = null;
        return;
    }

    var step = Global.inputStepView.step;

    if (step.autocompleted) {
        Global.autocomplete = null;
        return;
    }

    var search = Autocomplete.searchInfo(step);
    if (!search.searchable) {
        Global.autocomplete = null;
        return;
    }

    var matches = [];
    _.each(stepBank, function (step) {
        var s = Autocomplete.searchInfo(step);
        if (
            s.searchable &&
            s.text.length >= 2 &&
            s.text.indexOf(search.text) === 0
        ) {
            var typesMatch = _.every(search.referenceTypes, function (type, i) {
                return type === s.referenceTypes[i];
            });
            if (typesMatch) {
                matches.push({
                    step: step,
                    text: s.text,
                });
            }
        }
    });

    if (!matches.length) {
        Global.autocomplete = null;
        return;
    }

    var sortMatches = function (matches) {
        return _.sortBy(matches, function (match) {
            return -match.step.id; // TODO: better sorting
        });
    };

    matches = sortMatches(matches);
    var matchesByMatchesId = _.groupBy(matches, function (match) {
        return match.step.matchesId;
    });
    matchesByMatchesId = _.map(matchesByMatchesId, function (matches) {
        matches = sortMatches(matches);
        return _.uniq(matches, false, 'text');
    });
    var firstOfMatchesId = _.map(matchesByMatchesId, _.first);
    var restOfMatchesId = _.map(matchesByMatchesId, _.rest);
    restOfMatchesId = sortMatches(_.flatten(restOfMatchesId));
    matches = _.flatten(firstOfMatchesId).concat(restOfMatchesId);

    Global.autocomplete = _.map(matches, function (match) {
        return {
            step: match.step,
            __el__: null,
        };
    });
};

Autocomplete.registerStep = function (step) {
    stepBank.push(step);
};

Autocomplete.searchInfo = function (step) {
    var ignoreAutocompleteChars = '()+-*/%';
    if (_.intersection(step.text, ignoreAutocompleteChars).length) {
        return {searchable: false};
    }

    var tokens = StepExecution.lex(step.text);
    var references = _.filter(tokens, function (token) {
        return token.type === 'reference';
    });
    references = _.map(references, function (token) {
        return step.references[token.referenceI];
    });
    var referenceTypes = _.map(references, function (reference) {
        if (Quads.isQuads(reference.source.result)) {
            return 'quads';
        } else {
            return 'number';
        }
    });

    var textTokens = _.filter(tokens, function (token) {
        return token.type === 'text';
    });
    var searchText = _.pluck(tokens, 'text').join(' ');

    return {
        searchable: true,
        text: searchText,
        referenceTypes: referenceTypes,
    };
};

Autocomplete.select = function (original) {
    if (!Global.inputStepView) {
        return;
    }

    _.each(Global.active, function (stretch) {
        var copy = Manipulation.copyStretch(original, true, stretch);
        if (_.intersection(stretch.steps, Global.inputStepView.steps).length) {
            Global.inputStepView = copy.stepView;
        }
    });

    _.each(Global.active, function (stretch) {
        Manipulation.deleteStretch(stretch, false);
    });

    Main.update();
    window.getSelection().removeAllRanges();
    var expressionEl = d3.select(Global.inputStepView.__el__).select('.expression').node();
    expressionEl.focus();
    DomRange.setCurrentCursorOffset(expressionEl, expressionEl.textContent.length);
};

})();
