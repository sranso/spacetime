var createGroup = function (group) {
    group = _.extend({
        _type: 'group',
        stretches: [],
        color: [_.random(360), _.random(70, 95), _.random(84, 89)],
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
    stretch.pseudo = createPseudoStep(stretch);
    stretch.pseudoStretch = createPseudoStretch(stretch);
    return stretch;
};

var cloneStretch = function (original) {
    var stretch = createStretch(original);
    stretch.steps = [];
    return stretch;
};

var createPseudoStretch = function (stretch) {
    return {
        _type: 'pseudoStretch',
        kind: 'unselected',
        selectedArea: false,
        steps: [],
        stretch: stretch,
        position: null,
    };
};

var computePseudoStretchSteps = function (pseudoStretch) {
    pseudoStretch.steps = [];
    var i = 0;
    var steps = pseudoStretch.stretch.steps;
    var real = steps[i];
    while (real) {
        var pseudo = real.underPseudo;
        var pseudoStep = {step: pseudo};
        pseudoStretch.steps.push(pseudoStep);
        var missingSteps = _.difference(pseudo.stretch.steps, steps);
        pseudoStep.partial = missingSteps.length > 0;
        while (real && real.underPseudo === pseudo) {
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

var classifyStretches = function (targetStretch) {
    var firstStep = targetStretch.steps[0];
    var lastStep = targetStretch.steps[targetStretch.steps.length - 1];
    var all = _.uniq(_.reduce(targetStretch.steps, function (all, step) {
        return all.concat(step.stretches);
    }, []));

    return _.map(all, function (stretch) {
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
    });
};

var stretchPartitions = function (stretch) {
    var classified = classifyStretches(stretch);
    return function (matcher) {
        return selectPartitions(classified, matcher);
    };
};

// Matcher examples:
//      "<=[====]=>"
//      "__[<==>]__"
//      "__[_<>_]__"
//      "<<[<==>]>>"
//      "__[<<>>]__"
//      "<<[<<<<]=>"
var selectPartitions = function (classified, matcher) {
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

    var matching = _.filter(classified, function (s) {
        return _.contains(start, s.start) && _.contains(end, s.end);
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
        group.pseudoStretches = _.map(group.stretches, function (stretch) {
            computePseudoStretchSteps(stretch.pseudoStretch);
            return stretch.pseudoStretch;
        });
        group.pseudoStretches = _.filter(group.pseudoStretches, function (stretch) {
            return stretch.steps.length;
        });
        return group.pseudoStretches.length > 0;
    });
    return orderGroups(groups);
};
