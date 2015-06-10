var Active = {};

Active.computeActive = function () {
    var focus = Global.insertStep || Global.selection.foreground.focus;
    if (! focus) {
        setActiveStretches([], false);
        return;
    }

    if (! Global.selection.background.group) {
        setActiveStretches([focus], false);
        return;
    }

    if (Global.insertStep) {
        focus = Stretch.createStretch();
        Stretch.setStretchSteps(focus, [Global.insertStep]);
        var foreground = [focus];
    } else {
        var foreground = Global.selection.foreground.group.stretches;
    }
    var background = Global.selection.background.group.stretches;

    var overlaps = _.reduce(background, function (overlaps, backStretch) {
        var overBack = Stretch.allOverlappingStretches(backStretch);
        var foreStretches = _.intersection(foreground, overBack);
        var laps = _.map(foreStretches, function (foreStretch) {
            return {
                foreground: foreStretch,
                background: backStretch,
                steps: _.intersection(foreStretch.steps, backStretch.steps),
            };
        });
        laps = _.sortBy(laps, function (lap) {
            return _.indexOf(lap.background.steps, lap.steps[0]);
        });
        _.each(laps, function (lap, i) {
            lap.nthInBackground = i;
        });

        return overlaps.concat(laps);
    }, []);

    var focusOverlaps = _.filter(overlaps, function (overlap) {
        return overlap.foreground === focus;
    });

    var focusBackgrounds = _.uniq(_.pluck(focusOverlaps, 'background'));
    var backOverlaps = _.filter(overlaps, function (overlap) {
        return _.contains(focusBackgrounds, overlap.background);
    });


    if (! focusOverlaps.length) {
        setActiveStretches([focus], false);

    } else if (foreground.length > backOverlaps.length) {
        var focusNths = _.uniq(_.pluck(focusOverlaps, 'nthInBackground'));

        var activeOverlaps = _.filter(overlaps, function (overlap) {
            return _.contains(focusNths, overlap.nthInBackground);
        });

        var activeStretches = _.map(activeOverlaps, function (overlap) {
            var stretch = Stretch.cloneStretch(overlap.foreground);
            stretch.group = Global.active;
            stretch.expanded = true;
            Stretch.setStretchSteps(stretch, overlap.steps);
            return stretch;
        });

        setActiveStretches(activeStretches, false);

    } else {

        computeActiveByMatch(focusOverlaps, background);
    }

    if (Global.insertStep) {
        Stretch.setStretchSteps(focus, []);
    }
};

var setActiveStretches = function (stretches, byMatch) {
    Global.active.byMatch = byMatch;
    _.each(Global.active.stretches, function (stretch) {
        Stretch.setStretchSteps(stretch, []);
    });
    Global.active.stretches = _.map(stretches, function (original) {
        if (original.group === Global.active) {
            return original;
        }
        stretch = Stretch.cloneStretch(original);
        stretch.group = Global.active;
        stretch.expanded = true;
        Stretch.setStretchSteps(stretch, original.steps);
        return stretch;
    });
    var focus = Global.insertStep || Global.selection.foreground.focus;
    Global.active.focus = _.min(Global.active.stretches, function (stretch) {
        var steps = _.intersection(stretch.steps, focus.steps);
        if (! steps.length) {
            return focus.steps.length;
        }
        return _.indexOf(focus.steps, steps[0]);
    });
};

var computeActiveByMatch = function (focusOverlaps, background) {
    var activeStretches = [];

    _.each(focusOverlaps, function (overlap) {
        var bg = overlap.background;
        var overBack = Stretch.stretchPartitions(bg)("__[<<>>]__");
        var stepViews = _.uniq(_.pluck(overlap.steps, 'underStepView'));
        var compareSteps = [];
        _.each(stepViews, function (stepView) {
            var match = stepView.stretch;
            var matches;
            if (stepView.stretch._type === 'step') {
                matches = findStepMatches(bg, match);
            } else {
                matches = findGroupMatches(bg, overBack, match);
            }
            var individualMatch = {
                match: match,
                matches: matches,
                matchesIndex: _.indexOf(matches, match),
            };
            individualMatch.compare = individualMatch;
            scoreIndividualMatch(bg, overBack, individualMatch);
            compareSteps.push(individualMatch);
        });

        _.each(background, function (backStretch) {
            var active = activeByMatch(
                compareSteps,
                backStretch
            );
            if (active) {
                activeStretches.push(active);
            }
        });
    });

    setActiveStretches(activeStretches, true);
};

var activeByMatch = function (compareSteps, stretch) {
    var overBack = Stretch.stretchPartitions(stretch)("__[<<>>]__");

    var matchChains = [
        {
            chain: [null, null],
            lengthToLookAt: 0,
            steps: 0,
            matchNumber: 0,
            match: null,
            matches: [],
            compare: null,
            matchesIndex: -1,
            startStepIndex: -1,
            endStepIndex: -1,
            individualScore: {
                total: 0.0,
            },
            chainScore: {
                total: 0.0,
                individualSum: 0.0,
            },
        }
    ];
    matchChains[0].chain[0] = matchChains[0];

    var matchNumber = 0;
    var lengthToLookAt = 0;
    matchNumber += 1;
    _.each(compareSteps, function (compare, stepI) {
        lengthToLookAt = matchNumber;
        var matches;
        if (compare.match._type === 'step') {
            matches = findStepMatches(stretch, compare.match);
        } else {
            matches = findGroupMatches(stretch, overBack, compare.match);
        }
        _.each(matches, function (match, matchI) {
            var individualMatch = {
                lengthToLookAt: lengthToLookAt,
                steps: stepI + 1,
                matchNumber: matchNumber,
                match: match,
                matches: matches,
                compare: compare,
                matchesIndex: matchI,
            };
            scoreIndividualMatch(stretch, overBack, individualMatch);
            matchChains.push(individualMatch);
            matchNumber += 1;
        });
    });

    for (var i = 1; i < matchChains.length; i++) {
        var match = matchChains[i];
        var bestChain = null;
        var bestChainScore = {total: -0.01};
        for (var j = 0; j < match.lengthToLookAt; j++) {
            var previousMatch = matchChains[j];
            var chain = previousMatch.chain;
            chain[chain.length - 1] = match;
            var chainScore = scoreMatchChain(stretch, overBack, compareSteps, chain);
            if (chainScore.total > bestChainScore.total) {
                bestChain = chain;
                bestChainScore = chainScore;
            }
        }
        match.chain = _.clone(bestChain);
        match.chain.push(null);  // One extra slot for testing next steps.
        match.chainScore = bestChainScore;
    }

    var bestChain = _.max(matchChains, function (match) {
        return match.chainScore.total;
    });

    if (bestChain.chainScore.total < 0.2) { // TODO: figure out the threshold
        return null;
    }

    var active = Stretch.createStretch({group: Global.active});
    var firstMatch = bestChain.chain[1];
    var lastMatch = bestChain.chain[bestChain.chain.length - 2];
    active.steps.push(firstMatch.match.steps[0]);
    active.steps.push(lastMatch.match.steps[lastMatch.match.steps.length - 1]);
    Stretch.fixupStretchSteps(active);
    return active;
};

var findStepMatches = function (stretch, compareStep) {
    return _.filter(stretch.steps, function (step) {
        return step.text === compareStep.text;
    });
};

var findGroupMatches = function (backStretch, overBack, compareStretch) {
    var matches = _.filter(overBack, function (stretch) {
        return stretch.group === compareStretch.group;
    });
    return _.sortBy(matches, function (match) {
        return _.indexOf(backStretch.steps, match.steps[0]);
    });
};

var scoreIndividualMatch = function (backStretch, overBack, match) {
    if (match.match._type === 'step') {
        match.startStepIndex = _.indexOf(backStretch.steps, match.match);
        match.endStepIndex = match.startStepIndex;
    } else {
        match.startStepIndex = _.indexOf(backStretch.steps, match.match.steps[0]);
        match.endStepIndex = _.indexOf(backStretch.steps, match.match.steps[match.match.steps.length - 1]);
    }
    var compare = match.compare;
    var score = {};

    // score stepIndex
    var diff = Math.abs(compare.startStepIndex - match.startStepIndex);
    score.stepIndex = 1.0 - (diff / backStretch.steps.length);

    // score matchesIndex
    diff = Math.abs(compare.matchesIndex - match.matchesIndex);
    score.matchesIndex = 1.0 - (diff / match.matches.length);

    // TODO: check previous and next step / stretch.

    // total score
    score.total = (
        score.stepIndex * 1.0 +
        score.matchesIndex * 2.0
    ) / (1.0 + 2.0);


    match.individualScore = score;
};

var scoreMatchChain = function (backStretch, overBack, compareSteps, chain) {
    var match = chain[chain.length - 1];
    var previous = chain[chain.length - 2];

    // disallow out-of-order matches.
    // TODO: detect re-ordering and allow it with lower score.
    if (match.startStepIndex <= previous.endStepIndex) {
        return {total: -1.0};
    }

    var score = {};

    // individual score sum
    score.individualSum = previous.chainScore.individualSum + match.individualScore.total;

    // individual average
    score.individualAverage = score.individualSum / compareSteps.length;

    // total score
    score.total = (
        score.individualAverage * 1.0
    ) / (1.0);

    return score;
};
