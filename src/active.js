var setActiveStretches = function (stretches) {
    _.each(__active.stretches, function (stretch) {
        setStretchSteps(stretch, []);
    });
    __active.stretches = _.map(stretches, function (original) {
        if (original.group === __active) {
            return original;
        }
        stretch = cloneStretch(original);
        stretch.group = __active;
        setStretchSteps(stretch, original.steps);
        return stretch;
    });
};

var computeActive = function () {
    var focus = selection.focus;
    if (! focus) {
        setActiveStretches([]);
        return;
    }

    if (! selection.right.group) {
        setActiveStretches([focus]);
        return;
    }

    var foreground = focus.group.stretches;
    var background = selection.right.group.stretches;

    var overlaps = _.reduce(background, function (overlaps, backStretch) {
        var overBack = allOverlappingStretches(backStretch);
        var foreStretches = _.intersection(foreground, overBack);
        var laps = _.map(foreStretches, function (foreStretch) {
            var shared = _.intersection(foreStretch.steps, backStretch.steps);
            return {
                foreground: foreStretch,
                background: backStretch,
                stepIndex: _.indexOf(backStretch.steps, shared[0]),
            };
        });
        laps = _.sortBy(laps, 'stepIndex');
        _.each(laps, function (lap, i) {
            lap.nthInBackground = i;
        });

        return overlaps.concat(laps);
    }, []);


    if (foreground.length > 1) {
        var focusOverlaps = _.filter(overlaps, function (overlap) {
            return overlap.foreground === focus;
        });
        var focusNths = _.uniq(_.pluck(focusOverlaps, 'nthInBackground'));

        var activeOverlaps = _.filter(overlaps, function (overlap) {
            return _.contains(focusNths, overlap.nthInBackground);
        });

        var activeStretches = _.map(activeOverlaps, function (overlap) {
            var stretch = cloneStretch(overlap.foreground);
            stretch.group = __active;
            var steps = _.intersection(overlap.foreground.steps, overlap.background.steps);
            setStretchSteps(stretch, steps);
            return stretch;
        });

        setActiveStretches(activeStretches);

    } else {

        setActiveStretches([focus]); // TODO
    }
};
