'use strict';
var Series = {};
(function () {

Series.create = function () {
    return {
        id: Main.newId(),
        stretches: [],
        actualLength: 0,
        targetLengthBy: null,
    };
};

Series.setSeriesLength = function (targetLength) {
    d3.event.stopPropagation();
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
    if (!series) {
        series = Series.create();
        series.stretches = [stretch];
    }
    var lastStretch = series.stretches[series.stretches.length - 1];
    var length = series.stretches.length;
    if (length < targetLength) {
        var underBy = targetLength - length;
        for (var i = 0; i < underBy; i++) {
            lastStretch = Manipulation.copyStretch(lastStretch);
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
    Global.inputForegroundIndexStretch = lastStretch;

    Main.update();
};

})();
