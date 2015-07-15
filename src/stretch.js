'use strict';
var Stretch = {};
(function () {

Stretch.createBasicStretch = function () {
    return {
        id: Main.newId(),
        steps: [],
    };
};

Stretch.createGroupStretch = function () {
    var stretch = Stretch.createBasicStretch();
    stretch.group = null;
    stretch.series = null;
    return stretch;
};

Stretch.isGroupStretch = function (stretch) {
    return stretch.group;
};

Stretch.isInSeries = function (stretch) {
    return stretch.series;
};

// debug only
Stretch.allGroupStretches = function () {
    return _.flatten(_.pluck(Global.groups, 'stretches'));
};

Stretch.setSteps = function (stretch, steps) {
    _.each(stretch.steps, function (oldStep) {
        oldStep.stretches = _.without(oldStep.stretches, stretch);
    });
    _.each(steps, function (newStep) {
        newStep.stretches.push(stretch);
    });
    stretch.steps = steps;
};

var classifyAllStretches = function (targetStretch) {
    var all = Stretch.allOverlapping(targetStretch);

    return _.map(all, function (stretch) {
        return classifyStretch(targetStretch, stretch);
    });
};

Stretch.allOverlapping = function (targetStretch) {
    return _.uniq(_.reduce(targetStretch.steps, function (all, step) {
        return all.concat(step.stretches);
    }, []));
};

var classifyStretch = function (targetStretch, stretch) {
    var firstStep = targetStretch.steps[0];
    var lastStep = targetStretch.steps[targetStretch.steps.length - 1];

    var start;
    if (!_.contains(firstStep.stretches, stretch)) {
        start = 'middle';
    } else if (stretch.steps[0] === firstStep) {
        start = 'start';
    } else {
        start = 'before';
    }

    var end;
    if (!_.contains(lastStep.stretches, stretch)) {
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

Stretch.overlappingPartitions = function (stretch) {
    var classified = classifyAllStretches(stretch);
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
    if (!/^_*<+=*>+_*$/.test(matcher.replace(/[\[\]]/g, ''))) {
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

Stretch.fixupSteps = function (stretch) {
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
    Stretch.setSteps(stretch, steps);
};

})();
