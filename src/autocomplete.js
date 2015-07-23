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

    var matches = _.filter(stepBank, function (step) {
        var s = Autocomplete.searchInfo(step);
        if (
            s.searchable &&
            s.text.length >= 2 &&
            s.text.indexOf(search.text) === 0
        ) {
            return _.every(search.referenceTypes, function (type, i) {
                return type === s.referenceTypes[i];
            });
        }
        return false;
    });

    if (!matches.length) {
        Global.autocomplete = null;
        return;
    }

    matches = _.sortBy(matches, function (match) {
        return -match.id; // TODO: better sorting
    });

    var matchesByMatchesId = _.groupBy(matches, 'matchesId');
    var firstOfMatchesId = _.map(matchesByMatchesId, _.first);
    var restOfMatchesId = _.map(matchesByMatchesId, _.rest);
    restOfMatchesId = _.sortBy(_.flatten(restOfMatchesId), function (match) {
        return -match.id; // TODO: better sorting
    });
    matches = _.flatten(firstOfMatchesId).concat(restOfMatchesId);

    Global.autocomplete = matches;
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

Autocomplete.select = function (step) {
    if (!Global.inputStepView) {
        return;
    }

    console.log(step.text);
};

})();
