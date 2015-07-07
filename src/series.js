'use strict';
var Series = {};
(function () {

Series.create = function () {
    return {
        id: Main.newId(),
        stretches: [],
        targetLengthBy: null,
    };
};

Series.setActiveSeriesLength = function (targetLength) {
    if (targetLength === '' || _.isNaN(+targetLength)) {
        return;
    }
    if (targetLength > 999) {  // TODO: better performance (don't show all views)
        return;
    }
    var stretch = Global.inputForegroundIndexStretch;
    if (!stretch) {
        return;
    }

    targetLength = Math.floor(+targetLength);
    var series = stretch.series;
    if (series) {
        var lastStretch = series.stretches[series.stretches.length - 1];
    } else {
        var lastStretch = stretch;
    }

    var active = Active.computeActiveWithSelection(lastStretch);
    _.each(_.pluck(active, '0'), function (lastStretch) {
        setStretchSeriesLength(lastStretch, targetLength);
    });

    Main.update();
};

var setStretchSeriesLength = function (stretch, targetLength) {
    var series = stretch.series;

    if (series) {
        if (series.targetLengthBy) {
            series.targetLengthBy = null;
            series.stretches = series.stretches.slice(0, series.stretches.length);
        }
    } else {
        series = {stretches: [stretch]};
    }

    adjustSeriesLength(series, targetLength);
};

var adjustSeriesLength = function (series, targetLength) {
    var length = series.stretches.length;
    if (length === targetLength) {
        return;
    }
    var setInputForegroundIndexStretch = _.contains(series.stretches, Global.inputForegroundIndexStretch);
    var lastStretch = series.stretches[series.stretches.length - 1];
    if (length < targetLength) {
        var underBy = targetLength - length;
        for (var i = 0; i < underBy; i++) {
            lastStretch = Manipulation.copyStretch(lastStretch);
        }
        if (_.contains(series.stretches, Global.selection.foreground.focus)) {
            Global.selection.foreground.focus = lastStretch;
        }
    } else {
        var overBy = length - targetLength;
        for (var i = 0; i < overBy; i++) {
            Manipulation.deleteStretch(lastStretch);
            lastStretch = series.stretches[series.stretches.length - 1];
        }
        Manipulation.fixupSelectionAfterDelete();
        if (targetLength === 0) {
            lastStretch = null;
        }
    }
    if (setInputForegroundIndexStretch) {
        Global.inputForegroundIndexStretch = lastStretch;
    }
};

Series.setActiveSeriesTargetLengthBy = function (resultStepView) {
    var stretch = Global.inputForegroundIndexStretch;
    if (!stretch) {
        return;
    }

    var series = stretch.series;
    if (!series) {
        series = Series.create();
        Global.__series.push(series);
        series.stretches = [stretch];
        stretch.series = series;
    }

    var resultStep = resultStepView.steps[resultStepView.steps.length - 1];
    var seriesStart = series.stretches[0].steps[0].__index;
    var referenceAway = seriesStart - resultStep.__index;
    if (referenceAway <= 0) {
        return;
    }

    series.targetLengthBy = resultStep;
    Global.inputForegroundIndexStretch = null;

    Main.update();
};

Series.clearStartSeries = function () {
    _.each(Global.steps, function (step) {
        step.__startSeries = [];
    });
};

Series.tagStartSeries = function () {
    var dynamicSeries = _.filter(Global.__series, 'targetLengthBy');
    _.each(dynamicSeries, function (series) {
        var step = series.stretches[0].steps[0];

        var seriesEnd = series.stretches[series.stretches.length - 1];
        seriesEnd = seriesEnd.steps[seriesEnd.steps.length - 1];
        var insertBefore = _.findIndex(step.__startSeries, function (series) {
            var end = series.stretches[series.stretches.length - 1];
            end = end.steps[end.steps.length - 1];
            return end < seriesEnd;
        });
        if (insertBefore === -1) {
            insertBefore = 0;
        }

        step.__startSeries.splice(insertBefore, 0, series);
    });
};

Series.adjustDynamicSeriesFor = function (step) {
    var oldSeries = Global.__series;
    Global.__series = [];
    _.each(step.__startSeries, adjustDynamicSeries);
    Series.tagStartSeries();  // tag start series for new series/steps
    Global.__series = oldSeries.concat(Global.__series);
};

var adjustDynamicSeries = function (series) {
    var targetLength = +series.targetLengthBy.result;
    if (_.isNaN(targetLength)) {
        targetLength = 1;
    }
    targetLength = Math.floor(targetLength);
    if (targetLength <= 0) {
        targetLength = 1;
    }
    if (targetLength > 999) {
        targetLength = 999;
    }
    adjustSeriesLength(series, targetLength);
};

})();
