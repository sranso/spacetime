'use strict';
var Active = {};
(function () {

Active.computeMainActive = function () {
    var focus = Global.selection.foreground.focus;
    var active = Active.computeActiveWithSelection(focus);
    if (Global.inputStepView) {
        var background = _.pluck(active, '0');  // use active from foreground as background
        var target = [Global.inputStepView];
        active = Active.computeActive([], background, target);
    }

    Global.active = _.pluck(active, '0');
    Global.active.focus = active.focus;
    Global.__activeSteps = _.flatten(_.pluck(Global.active, 'steps'));
};

Active.computeActiveForGroup = function (group, background, target) {
    var active = Active.computeActive([], background, target);
    var focus;
    active = _.map(active, function (a) {
        var activeStretch = a[0];
        var stretch = Stretch.createGroupStretch();
        Stretch.setSteps(stretch, activeStretch.steps);
        stretch.group = group;
        group.stretches.push(stretch);
        if (activeStretch === active.focus) {
            focus = stretch;
        }
        return [stretch, a[1]];
    });
    active.focus = focus;
    return active;
};

Active.computeActiveWithSelection = function (focusOrTarget, backStretchOfFocus, originsInBackground) {
    var foreground = Selection.foregroundStretches();
    var background = Selection.backgroundStretches();
    return Active.computeActive(foreground, background, focusOrTarget, backStretchOfFocus, originsInBackground);
};

Active.computeActive = function (foreground, background, focusOrTarget, backStretchOfFocus, originsInBackground) {
    if (!focusOrTarget) {
        var active = [];
        active.focus = null;
        return active;
    }
    if (foreground.length) {
        var focusOrTargetStretch = focusOrTarget;
    } else {
        var targetSteps = _.flatten(_.pluck(focusOrTarget, 'steps'));
        var focusOrTargetStretch = Stretch.createBasicStretch();
        focusOrTargetStretch.steps = targetSteps;
    }
    if (!background.length) {
        var active = [
            [focusOrTargetStretch, null]
        ];
        active.focus = focusOrTargetStretch;
        return active;
    }

    background = _.sortBy(background, function (backStretch) {
        return backStretch.steps[0].__index;
    });

    if (!backStretchOfFocus) {
        backStretchOfFocus = Active.findBackStretchOfFocus(background, focusOrTargetStretch);
    }
    if (!backStretchOfFocus) {
        var active = [
            [focusOrTargetStretch, null]
        ];
        active.focus = focusOrTargetStretch;
        return active;
    }

    if (foreground.length) {
        return activeWithFocus(foreground, background, focusOrTarget, backStretchOfFocus);
    } else {
        return activeWithTarget(background, focusOrTarget, backStretchOfFocus, originsInBackground);
    }
};

var activeWithFocus = function (foreground, background, focus, backStretchOfFocus) {
    var allStretches = _.map(foreground, function (stretch) {
        return {stretch: stretch, foreground: true};
    });
    allStretches = allStretches.concat(_.map(background, function (stretch) {
        return {stretch: stretch, foreground: false};
    }));
    var allStretches = _.sortBy(allStretches, function (s) {
        return s.stretch.steps[0].__index;
    });

    var foreStretch = null;
    var backStretch = null;
    var overlapping = null;
    var allOverlapping = [];
    _.each(allStretches, function (s) {
        if (s.foreground) {
            foreStretch = s.stretch;
        } else {
            backStretch = s.stretch;
            overlapping = [];
            allOverlapping.push(overlapping);
            overlapping.backStretch = backStretch;
        }
        if (foreStretch && backStretch) {
            if (_.intersection(foreStretch.steps, backStretch.steps).length) {
                overlapping.push(foreStretch);
            }
        }
    });

    var overlappingForFocus = _.find(allOverlapping, function (overlapping) {
        return overlapping.backStretch === backStretchOfFocus;
    });
    var nthInBackStretchOfFocus = _.indexOf(overlappingForFocus, focus);

    var active = [];
    _.each(allOverlapping, function (overlapping) {
        var foreStretch = overlapping[nthInBackStretchOfFocus];
        if (foreStretch) {
            active.push([foreStretch, overlapping.backStretch]);
        }
    });
    active.focus = focus;
    return active;
};

Active.findBackStretchOfFocus = function (background, focus) {
    var maxOverlapSteps = 0;
    var maxOverlapBackStretch = null;
    _.each(background, function (backStretch) {
        var overlap = _.intersection(backStretch.steps, focus.steps);
        if (overlap.length > maxOverlapSteps) {
            maxOverlapSteps = overlap.length;
            maxOverlapBackStretch = backStretch;
        }
    });
    return maxOverlapBackStretch;
};

var activeWithTarget = function (background, target, backStretchOfTarget, originsInBackground) {
    if (!originsInBackground) {
        originsInBackground = _.map(background, function (stretch) {
            return stretch.steps[0].__index;
        });
    }

    var originForBackStretchOfTarget = originsInBackground[_.indexOf(background, backStretchOfTarget)];

    var targetSteps = _.pluck(target, 'step');
    var stepInfo = markNthStepsInBackStretch(backStretchOfTarget, originForBackStretchOfTarget);
    var targetInfo = _.filter(stepInfo, function (s) {
        return _.contains(targetSteps, s.step);
    });

    var active = [];
    _.each(background, function (backStretch, i) {
        var origin = originsInBackground[i];
        var activeStretch = activeStretchWithTarget(targetInfo, backStretch, origin);
        if (activeStretch) {
            active.push([activeStretch, backStretch]);
        }
    });
    var focus = _.find(active, function (a) { return a[1] === backStretchOfTarget });
    active.focus = focus && focus[0];
    return active;
};

var markNthStepsInBackStretch = function (backStretch, origin) {
    var steps = backStretch.steps;
    var stepInfo = _.map(steps, function (step) {
        return {
            step: step,
            matchesId: step.matchesId,
            start: step.__index,
            end: step.__index,
            nth: null,
        };
    });

    var stepSuperSteps = _.map(steps, function (step) {
        return _.filter(step.stretches, SuperStep.isSuperStep);
    });
    var superSteps = _.union.apply(_, stepSuperSteps);
    var superStepInfo = _.map(superSteps, function (step) {
        return {
            step: step,
            matchesId: step.matchesId,
            start: step.steps[0].__index,
            end: step.steps[step.steps.length - 1].__index,
            nth: null,
        };
    });

    stepInfo = _.sortBy(stepInfo.concat(superStepInfo), 'end');

    var matchesIdToNth = {};
    var matchesIdToNthAtOrigin = null;
    _.each(stepInfo, function (s) {
        if (!matchesIdToNthAtOrigin && s.end >= origin) {
            matchesIdToNthAtOrigin = _.clone(matchesIdToNth);
        }
        if (!matchesIdToNth[s.matchesId]) {
            s.nth = matchesIdToNth[s.matchesId] = 1;
        } else {
            s.nth = (matchesIdToNth[s.matchesId] += 1);
        }
    });
    _.each(stepInfo, function (s) {
        var nthAtOrigin = matchesIdToNthAtOrigin[s.matchesId] || 0;
        if (s.nth > nthAtOrigin) {
            s.nth = s.nth - nthAtOrigin;
        } else {
            s.nth = nthAtOrigin - s.nth - 1;
        }
    });

    return stepInfo;
};

var activeStretchWithTarget = function (targetInfo, backStretch, origin) {
    var stepInfo = markNthStepsInBackStretch(backStretch, origin);
    var stepInfoByMatchesId = _.groupBy(stepInfo, 'matchesId');
    var matches = _.map(targetInfo, function (target) {
        var matchesId = stepInfoByMatchesId[target.matchesId] || [];
        var match = _.find(matchesId, function (s) {
            return s.nth === target.nth;
        });
        if (match) {
            match.target = target;
        }
        return match;
    });
    matches = _.filter(matches);
    matches = _.sortBy(matches, function (s) {
        return s.target.end;
    });

    var matchChains = [[]];
    var bestChain = [];
    for (var m = matches.length - 1; m >= 0; m--) {
        var match = matches[m];
        bestChain = [];
        for (var c = 0; c < matchChains.length; c++) {
            var oldChain = matchChains[c];
            if (oldChain.length) {
                var oldStart = oldChain[0].start
            } else {
                var oldStart = 1e10;
            }
            if (match.end < oldStart) {
                var chain = [match].concat(oldChain);
                chain.spread = chain[chain.length - 1].end - chain[0].start;
                if (
                    chain.length > bestChain.length ||
                    (chain.length === bestChain.length &&
                     chain.spread < bestChain.spread)
                ) {
                    bestChain = chain;
                }
            }
        }
        matchChains.push(bestChain);
    }
    if (bestChain.length) {
        var stretch = Stretch.createBasicStretch();
        var start = bestChain[0].start;
        var end = bestChain[bestChain.length - 1].end;
        stretch.steps = Global.steps.slice(start, end + 1);
        return stretch;
    } else {
        return null;
    }
};

})();
