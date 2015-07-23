'use strict';
var Manipulation = {};
(function () {

Manipulation.copyActiveStretches = function () {
    Global.active[0].group.remember = true;
    _.each(Global.active, Manipulation.copyStretch);

    Main.update();
};

Manipulation.copyStretch = function (original) {
    var p = Stretch.overlappingPartitions(original);
    var notCovering = _.union(
        p("<=[==>_]__"),
        p("__[_<==]=>"),
        p("__[<<>>]__")
    );

    var originalStart = original.steps[0].__index;
    var originalEnd = original.steps[original.steps.length - 1].__index;

    ///// clone series
    var originalSeries = _.uniq(_.filter(_.pluck(notCovering, 'series')));
    var notCoveringSeries = _.filter(originalSeries, function (series) {
        var start = series.stretches[0].steps[0].__index;
        var end = series.stretches[series.stretches.length - 1];
        end = end.steps[end.steps.length - 1].__index;
        return (
            start > originalStart ||
            end < originalEnd ||
            (start === originalStart && end === originalEnd)
        );
    });
    notCoveringSeries = _.without(notCoveringSeries, original.series);
    var seriesCloneMap = {};
    _.each(notCoveringSeries, function (originalSeries) {
        var series = Series.create();
        var originalReference = originalSeries.targetLengthBy;
        var originalStep = originalSeries.stretches[0].steps[0];
        series.targetLengthBy = {
            reference: originalReference,
            referenceAway: originalStep.__index - originalReference.source.__index,
        };
        Global.newSeries.push(series);
        seriesCloneMap[originalSeries.id] = series;
    });

    ///// clone stretches
    var cloneMap = {};
    _.each(notCovering, function (originalStretch) {
        if (Stretch.isGroupStretch(originalStretch)) {
            var stretch = Stretch.createGroupStretch();
            stretch.group = originalStretch.group;
            stretch.group.stretches.push(stretch);

            var originalSeries = originalStretch.series;
            if (originalSeries) {
                var series = seriesCloneMap[originalSeries.id] || originalSeries;
                series.stretches.push(stretch);
                stretch.series = series;
            }

            cloneMap[originalStretch.id] = stretch;
        } else {
            var stretch = SuperStep.create();
            Autocomplete.registerStep(stretch);
            stretch.matchesId = originalStretch.matchesId;
            stretch.text = originalStretch.text;
            stretch.collapsed = originalStretch.collapsed;

            // fixed below
            stretch.groupStretch = originalStretch.groupStretch;

            // fixed below
            var stretchIndex = originalStretch.steps[0].__index;
            stretch.references = _.map(originalStretch.references, function (originalReference) {
                var sink = originalReference.sink;
                return {
                    reference: originalReference,
                    referenceI: _.indexOf(sink.references, originalReference),
                    referenceAway: sink.__index - stretchIndex,
                };
            });

            cloneMap[originalStretch.id] = stretch;
        }
    });
    var copy = cloneMap[original.id];

    ///// repeat steps
    _.each(original.steps, function (originalStep) {
        var step = Step.create();
        step.matchesId = originalStep.matchesId;
        step.text = originalStep.text;
        step.stretches = _.filter(originalStep.stretches, function (originalStretch) {
            return _.contains(notCovering, originalStretch);
        });
        step.stretches = _.map(step.stretches, function (originalStretch) {
            var stretch = cloneMap[originalStretch.id];
            stretch.steps.push(step);
            return stretch;
        });

        // fixed below
        step.references = _.map(originalStep.references, function (originalReference) {
            return {
                reference: originalReference,
                referenceAway: originalStep.__index - originalReference.source.__index,
            };
        });
        _.each(originalStep.referencedBy, function (originalReference) {
            if (
                !_.contains(original.steps, originalReference.sink) &&
                !originalReference.absolute
            ) {
                Reference.setSource(originalReference, step);
            }
        });
    });

    ///// link steps
    var previous = original.steps[original.steps.length - 1];
    var next = previous.next;
    var lastCopyStep = copy.steps[copy.steps.length - 1];
    Step.linkSteps([previous, copy.steps[0]]);
    Step.linkSteps(copy.steps);
    Step.linkSteps([lastCopyStep, next]);

    /////
    Step.computeSteps();

    ///// fixup refereneces
    _.each(copy.steps, function (step) {
        var references = _.map(step.references, function (r) {
            var reference = Reference.create();
            reference.sink = step;
            if (Reference.isLiteral(r.reference)) {
                reference.source = reference;
                reference.result = r.reference.result;
            } else if (r.reference.absolute && !_.contains(original.steps, r.reference.source)) {
                reference.source = r.reference.source;
            } else {
                reference.source = Global.steps[step.__index - r.referenceAway];
            }
            reference.absolute = r.reference.absolute;
            return reference;
        });
        step.references = [];
        Step.setReferences(step, references);
    });

    ///// fixup stretch steps
    _.each(p("<=[===>]__"), function (stretch) {
        stretch.steps.push(lastCopyStep);
    });
    _.each(p("<<[<==>]>>"), Stretch.fixupSteps);
    _.each(p("__[_<<<]=>"), function (originalAfter) {
        var stretch = cloneMap[originalAfter.id];
        stretch.steps.push(originalAfter.steps[originalAfter.steps.length - 1]);
        Stretch.fixupSteps(stretch);
        originalAfter.steps.push(original.steps[original.steps.length - 1]);
        Stretch.fixupSteps(originalAfter);
    });

    ///// fixup series
    _.each(originalSeries, function (series) {
        series.stretches = _.sortBy(series.stretches, function (stretch) {
            return stretch.steps[0].__index;
        });
        series.targetLengthBy.result = series.stretches.length;
    });
    var series = original.series;
    if (!original.series) {
        series = copy.series = original.series = Series.create();
        Global.newSeries.push(series);
        series.stretches = [original, copy];
        series.targetLengthBy = {reference: {}};
        series.targetLengthBy.reference.source = series.targetLengthBy.reference;
        seriesCloneMap[series.id] = series;
    }
    _.each(seriesCloneMap, function (series) {
        var originalReference = series.targetLengthBy.reference;
        var referenceAway = series.targetLengthBy.referenceAway;

        var reference = Reference.create();
        reference.sink = series;
        if (Reference.isLiteral(originalReference)) {
            reference.source = reference;
            reference.result = series.stretches.length;
        } else {
            var step = series.stretches[0].steps[0];
            reference.source = Global.steps[step.__index - referenceAway];
        }
        series.targetLengthBy = reference;
    });

    ///// fixup superSteps
    _.each(cloneMap, function (stretch) {
        if (SuperStep.isSuperStep(stretch)) {
            var groupStretch = stretch.groupStretch;
            stretch.groupStretch = cloneMap[groupStretch.id] || groupStretch;
            var stretchIndex = stretch.steps[0].__index;
            stretch.references = _.map(stretch.references, function (r) {
                if (Series.isSeries(r.reference)) {
                    var series = seriesCloneMap[r.reference.id];
                    return series.targetLengthBy;
                } else {
                    var step = Global.steps[stretchIndex + r.referenceAway];
                    return step.references[r.referenceI];
                }
            });
            // TODO: handle null reference
        }
    });

    ///// fixup focus
    var focus = Global.selection.foreground.focus;
    if (cloneMap[focus.id]) {
        Global.selection.foreground.focus = cloneMap[focus.id];
    }

    return copy;
};

Manipulation.insertNewStep = function () {
    var matchesId = Main.newId();
    _.each(Global.active, function (stretch) {
        _insertNewStep(stretch, matchesId);
    });

    Main.update();
    window.getSelection().removeAllRanges();
    d3.select(Global.inputStepView.__el__).select('.expression').node().focus();
};

var _insertNewStep = function (stretch, matchesId) {
    var previous = stretch.steps[stretch.steps.length - 1];
    var next = previous.next;
    var newStep = Step.create();
    newStep.matchesId = matchesId;

    Step.linkSteps([previous, newStep, next]);

    var p = Stretch.overlappingPartitions(stretch);
    var focusOverlapping = _.intersection(p("__[<==>]__"), Selection.foregroundStretches());
    _.each(p("<=[===>]__").concat(focusOverlapping), function (stretch) {
        stretch.steps.push(newStep);
    });
    _.each(p("<<[<==>]>>"), Stretch.fixupSteps);
    _.each(p("__[_<<<]=>"), Stretch.fixupSteps);

    if (_.intersection(Global.inputStepView.steps, stretch.steps).length) {
        Global.inputStepView = newStep.stepView;
    }
};

Manipulation.deleteActiveStretches = function () {
    _.each(Global.active, function (stretch) {
        Manipulation.deleteStretch(stretch, true);
    });
    if (Global.active[0].group) {
        Manipulation.fixupSelectionAfterDelete(Global.active[0].group);
    }
    Main.update();
};

Manipulation.fixupSelectionAfterDelete = function (group) {
    if (Global.selection.foreground.group !== group) {
        return;
    }
    var focus = Global.selection.foreground.focus;

    if (!group.stretches.length) {
        Group.remove(group);

        Global.selection.foreground.group = null;
        Global.selection.foreground.focus = null;
        if (Global.selection.background.group === group) {
            Global.selection.background.group = null;
            Global.selection.background.focus = null;
        }
    } else if (!_.contains(group.stretches, focus)) {
        var focusStart = focus.steps[0].__index;
        var closestAbove;
        var closestAboveStart = -1;
        var closestBelow;
        var closestBelowStart = 1e10;
        _.each(group.stretches, function (stretch) {
            var start = stretch.steps[0].__index;
            if (start < focusStart) {
                if (start > closestAboveStart) {
                    closestAbove = stretch;
                    closestAboveStart = start;
                }
            } else {
                if (start < closestBelowStart) {
                    closestBelow = stretch;
                    closestBelowStart = start;
                }
            }
        });
        var closest = closestAbove || closestBelow;

        Global.selection.foreground.focus = closest;
        if (Global.selection.background.group === group) {
            Global.selection.background.focus = closest;
        }
    }
};

Manipulation.deleteStretch = function (stretch, manual) {
    var start = stretch.steps[0];
    var end = stretch.steps[stretch.steps.length - 1];
    var previous = start.previous;
    var next = end.next;
    Step.linkSteps([previous, next]);

    _.each(stretch.steps, function (step) {
        _.each(step.referencedBy, function (reference) {
            if (!_.contains(stretch.steps, reference.sink)) {
                var source = Global.steps[step.__index - stretch.steps.length];
                Reference.setSource(reference, source);
            }
        });
    });

    var p = Stretch.overlappingPartitions(stretch);

    ///// remove stretches and series
    var removeStretches = p("__[<<>>]__");
    _.each(removeStretches, function (stretch) {
        if (Stretch.isGroupStretch(stretch)) {
            stretch.group.stretches = _.without(stretch.group.stretches, stretch);
        }
        if (stretch.series) {
            stretch.series.stretches = _.without(stretch.series.stretches, stretch);
        }
    });
    var fixupSeries = _.uniq(_.filter(_.pluck(removeStretches, 'series')));
    _.each(fixupSeries, function (series) {
        if (series.stretches.length === 0) {
            Global.series = _.without(Global.series, series);
            Global.newSeries = _.without(Global.newSeries, series);
        } else if (manual && series.stretches.length === 1 && Reference.isLiteral(series.targetLengthBy)) {
            series.stretches[0].series = null;
        } else {
            series.targetLengthBy.result = series.stretches.length;
        }
    });

    ///// fixup stretches
    _.each(p("<=[>>>>]__"), function (stretch) {
        stretch.steps.push(previous);
        Stretch.fixupSteps(stretch);
    });
    _.each(p("__[<<<<]=>"), function (stretch) {
        stretch.steps.unshift(next);
        Stretch.fixupSteps(stretch);
    });
    _.each(p("<=[====]=>"), function (stretch) {
        Stretch.fixupSteps(stretch);
    });

    /////
    Step.computeSteps();
};

Manipulation.selectActiveStretches = function () {
    var group = Group.create();
    var focus = null;
    group.stretches = _.map(Global.active, function (originalStretch) {
        var stretch = Stretch.createGroupStretch();
        stretch.group = group;
        if (originalStretch === Global.active.focus) {
            focus = stretch;
        }
        return stretch;
    });
    Global.groups.push(group);

    Global.selection.foreground.focus = focus;
    Global.selection.foreground.group = group;
};

Manipulation.computeGroupIntersection = function () {
    if (!Global.selection.foreground.group || !Global.selection.background.group) {
        return;
    }
    var intersection = Group.create();
    Global.groups.push(intersection);
    var stepsById = {};
    _.each(Global.selection.foreground.group.stretches, function (stretch) {
        _.each(stretch.steps, function (step) {
            var stepInfo = {
                step: step,
                foreStretch: stretch.id,
            };
            stepsById[step.id] = stepInfo;
        });
    });
    _.each(Global.selection.background.group.stretches, function (stretch) {
        _.each(stretch.steps, function (step) {
            if (stepsById[step.id]) {
                stepsById[step.id].backStretch = stretch.id;
            }
        });
    });
    var steps = _.sortBy(stepsById, function (step) {
        return _.indexOf(Global.steps, step.step);
    });
    var stretches = [];
    var stretch = null;
    var lastStep = null;
    _.each(steps, function (step) {
        if (!step.backStretch) {
            lastStep = step;
            return;
        }
        if (
            stretch &&
            lastStep.step.next === step.step &&
            lastStep.foreStretch === step.foreStretch &&
            lastStep.backStretch === step.backStretch
        ) {
            stretch.push(step.step);
        } else {
            if (stretch) {
                stretches.push(stretch);
            }
            stretch = [step.step];
        }
        lastStep = step;
    });
    if (stretch) {
        stretches.push(stretch);
    }
    intersection.stretches = _.map(stretches, function (steps) {
        var stretch = Stretch.createGroupStretch();
        stretch.group = intersection;
        Stretch.setSteps(stretch, steps);
        return stretch;
    });
    Global.selection.foreground.group = intersection;
    Global.selection.background.group = intersection;
    var foreFocus = Global.selection.foreground.focus;
    var backFocus = Global.selection.background.focus;
    _.each(intersection.stretches, function (stretch) {
        if (_.intersection(stretch.steps, foreFocus.steps)) {
            foreFocus = stretch;
        }
        if (_.intersection(stretch.steps, backFocus.steps)) {
            backFocus = stretch;
        }
    });
    Global.selection.foreground.focus = foreFocus;
    Global.selection.background.focus = backFocus;
};

})();
