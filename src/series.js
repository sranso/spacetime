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

Series.isSeries = function (series) {
    return series.targetLengthBy;
};

Series.setActiveSeriesLength = function (targetLength) {
    var stretch = Global.inputForegroundIndexStretch;
    if (!stretch) {
        return;
    }

    _.each(Global.active, function (stretch) {
        var series = stretch.series;
        series.targetLengthBy.source = series.targetLengthBy;
        series.targetLengthBy.result = targetLength;
    });

    Main.update();
};

Series.setActiveSeriesTargetLengthBy = function (resultStepView) {
    var stretch = Global.inputForegroundIndexStretch;
    if (!stretch) {
        return;
    }

    var series = stretch.series;
    if (!series) {
        series = Series.create();
        var reference = Reference.create();
        reference.sink = series;
        series.targetLengthBy = reference;

        Global.newSeries.push(series);
        series.stretches = [stretch];
        stretch.series = series;
    }

    var resultStep = resultStepView.steps[resultStepView.steps.length - 1];
    var seriesStart = series.stretches[0].steps[0].__index;
    var referenceAway = seriesStart - resultStep.__index;
    if (referenceAway <= 0) {
        return;
    }

    series.targetLengthBy.source = resultStep;
    Global.inputForegroundIndexStretch = null;

    Main.update();
};

Series.clearStartSeries = function () {
    _.each(Global.steps, function (step) {
        step.__startSeries = [];
    });
};

Series.tagStartSeries = function (series) {
    _.each(series, function (series) {
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

Series.adjustSeriesLengthFor = function (step) {
    Global.newSeries = [];
    _.each(step.__startSeries, adjustSeriesLength);
    Series.tagStartSeries(Global.newSeries);
    Global.series = Global.series.concat(Global.newSeries);
    Global.newSeries = Global.series;
};

var adjustSeriesLength = function (series) {
    var targetLength = +series.targetLengthBy.source.result;
    var length = series.stretches.length;
    if (length === targetLength) {
        return;
    }
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
    var setInputForegroundIndexStretch = _.contains(series.stretches, Global.inputForegroundIndexStretch);
    var lastStretch = series.stretches[series.stretches.length - 1];
    if (length < targetLength) {
        var underBy = targetLength - length;
        for (var i = 0; i < underBy; i++) {
            lastStretch = Manipulation.copyStretch(lastStretch, null);
        }
        if (_.contains(series.stretches, Global.selection.foreground.focus)) {
            Global.selection.foreground.focus = lastStretch;
        }
    } else {
        var overBy = length - targetLength;
        for (var i = 0; i < overBy; i++) {
            Manipulation.deleteStretch(lastStretch, false);
            lastStretch = series.stretches[series.stretches.length - 1];
        }
        Manipulation.fixupSelectionAfterDelete(series.stretches[0].group);
        if (targetLength === 0) {
            lastStretch = null;
        }
    }
    if (setInputForegroundIndexStretch) {
        Global.inputForegroundIndexStretch = lastStretch;
    }
};

})();
