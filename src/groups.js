var createGroup = function (group) {
    group = _.extend({
        _type: 'group',
        hidden: false,
        stretches: [],
        color: [_.random(360), _.random(70, 95), _.random(78, 83)],
        text: '',
    }, group || {});
    group.id = newId();
    return group;
};

var createStretch = function (stretch) {
    stretch = _.extend({
        _type: 'stretch',
        text: '',
        steps: [],
        expanded: true,
        group: null,
    }, stretch || {});
    stretch.id = newId();
    stretch.stepView = createStepView(stretch);
    stretch.stretchView = createStretchView(stretch);
    return stretch;
};

var cloneStretch = function (original) {
    var stretch = createStretch(original);
    stretch.steps = [];
    return stretch;
};

var createStretchView = function (stretch) {
    return {
        _type: 'stretchView',
        kind: 'unselected',
        selectedArea: false,
        steps: [],
        stretch: stretch,
        position: null,
    };
};

var computeStretchViewSteps = function (stretchView) {
    stretchView.steps = [];
    var i = 0;
    var steps = stretchView.stretch.steps;
    var real = steps[i];
    while (real) {
        var stepView = real.underStepView;
        var stepViewBoxed = {step: stepView};
        stretchView.steps.push(stepViewBoxed);
        var missingSteps = _.difference(stepView.stretch.steps, steps);
        stepViewBoxed.partial = missingSteps.length > 0;
        while (real && real.underStepView === stepView) {
            i += 1;
            real = steps[i];
        }
    }
};

var setStretchSteps = function (stretch, steps) {
    _.each(stretch.steps, function (oldStep) {
        oldStep.stretches = _.without(oldStep.stretches, stretch);
    });
    _.each(steps, function (newStep) {
        newStep.stretches.push(stretch);
    });
    stretch.steps = steps;
};

var classifyAllStretches = function (targetStretch) {
    var all = allOverlappingStretches(targetStretch);

    return _.map(all, function (stretch) {
        return classifyStretch(targetStretch, stretch);
    });
};

var allOverlappingStretches = function (targetStretch) {
    return _.uniq(_.reduce(targetStretch.steps, function (all, step) {
        return all.concat(step.stretches);
    }, []));
};

var classifyStretch = function (targetStretch, stretch) {
    var firstStep = targetStretch.steps[0];
    var lastStep = targetStretch.steps[targetStretch.steps.length - 1];

    var start;
    if (! _.contains(firstStep.stretches, stretch)) {
        start = 'middle';
    } else if (stretch.steps[0] === firstStep) {
        start = 'start';
    } else {
        start = 'before';
    }

    var end;
    if (! _.contains(lastStep.stretches, stretch)) {
        end = 'middle';
    } else if (stretch.steps[stretch.steps.length - 1] === lastStep) {
        end = 'end';
    } else {
        end = 'after';
    }

    return {
        stretch: stretch,
        start: start,
        end: end,
    };
};

var stretchPartitions = function (stretch) {
    var classified = classifyAllStretches(stretch);
    return function (matcher) {
        return selectPartitions(classified, matcher);
    };
};

var compareStretch = function (targetStretch, stretch) {
    var classified = classifyStretch(targetStretch, stretch);
    return function (matcher) {
        var m = compileMatcher(matcher);
        return matchStretch(m, stretch);
    };
};

// Matcher examples:
//      "<=[====]=>"
//      "__[<==>]__"
//      "__[_<>_]__"
//      "<<[<==>]>>"
//      "__[<<>>]__"
//      "<<[<<<<]=>"
var compileMatcher = function (matcher) {
    if (matcher.length !== 10) {
        throw new Error('Matcher must be ten characters long "__[____]__"');
    }
    if (matcher[2] !== '[' || matcher[7] !== ']') {
        throw new Error('Matcher must have brackets at the right spot "__[____]__"');
    }
    if (/[^<\[\]>=_]/.test(matcher)) {
        throw new Error('Matcher must only contain "_=[]<>"');
    }
    if (! /^_*<+=*>+_*$/.test(matcher.replace(/[\[\]]/g, ''))) {
        throw new Error('Matcher arrow portion must match /^_*<+=*>+_*$/');
    }

    var start = [];
    var end = [];

    // "01[3456]89"
    if (matcher[0] === '<' || matcher[1] === '<') {
        start.push('before');
    }
    if (matcher[3] === '<') {
        start.push('start');
    }
    if (matcher[4] === '<' || matcher[5] === '<') {
        start.push('middle');
    }
    if (matcher.indexOf('<') >= 6) {
        throw new Error('Matcher cannot detect if it starts at end or after');
    }

    // "01[3456]89"
    if (matcher[9] === '>' || matcher[8] === '>') {
        end.push('after');
    }
    if (matcher[6] === '>') {
        end.push('end');
    }
    if (matcher[5] === '>' || matcher[4] === '>') {
        end.push('middle');
    }
    if (matcher.lastIndexOf('>') <= 3) {
        throw new Error('Matcher cannot detect if it ends at start or before');
    }

    return {
        start: start,
        end: end,
    };
};

var matchStretch = function (matcher, stretch) {
    return (
        _.contains(matcher.start, stretch.start) &&
        _.contains(matcher.end, stretch.end)
    );
};

var selectPartitions = function (classified, matcher) {
    var m = compileMatcher(matcher);
    var matching = _.filter(classified, function (s) {
        return matchStretch(m, s);
    });
    return _.pluck(matching, 'stretch');
};

var fixupStretchSteps = function (stretch) {
    var end = stretch.steps[stretch.steps.length - 1];
    var steps = [];
    var step = stretch.steps[0];
    while (step) {
        steps.push(step);
        if (step === end) {
            break;
        }
        step = step.next;
    }
    setStretchSteps(stretch, steps);
};

var orderGroups = function (groups) {
    return groups.sort(function (a, b) {
        if (a.stretches[0].steps.length !== b.stretches[0].steps.length) {
            return a.stretches[0].steps.length < b.stretches[0].steps.length ? -1 : +1;
        }
        return 0;
    });
};

var groupsToDraw = function (groups) {
    groups = _.filter(groups, function (group) {
        if (group.hidden) {
            return false;
        }
        group.stretchViews = _.map(group.stretches, function (stretch) {
            computeStretchViewSteps(stretch.stretchView);
            return stretch.stretchView;
        });
        group.stretchViews = _.filter(group.stretchViews, function (stretch) {
            return stretch.steps.length;
        });
        return group.stretchViews.length > 0;
    });
    return orderGroups(groups);
};
