'use strict';
var DrawForegroundIndices = {};
(function () {

var foregroundIndexInputEl;

DrawForegroundIndices.setup = function () {
    foregroundIndexInputEl = Draw.trackForegroundIndices.append('div')
        .attr('class', 'foreground-index foreground-index-input') ;

    foregroundIndexInputEl.append('div')
        .attr('class', 'foreground-index-content')
        .attr('contenteditable', true)
        .on('blur', function () {
            Main.maybeUpdate(function () { Global.inputForegroundIndexStretch = null });
        })
        .on('mousedown', function () {
            d3.event.stopPropagation();
        })
        .on('input', function () {
            d3.event.stopPropagation();
            Series.setActiveSeriesLength(this.textContent);
        })
        .on('keypress', function () {
            d3.event.stopPropagation();
        })
        .on('keydown', function () {
            d3.event.stopPropagation();
        })
        .on('keyup', function () {
            d3.event.stopPropagation();
        }) ;
};

DrawForegroundIndices.draw = function () {
    var foregroundStretchViews = _.filter(Global.__stretchViews, function (stretchView) {
        return stretchView.kind === 'foreground';
    });
    var foregroundIndexViews = _.map(foregroundStretchViews, function (stretchView) {
        var stretch = stretchView.stretch;
        var series = stretch.series;
        if (series) {
            var text = _.indexOf(series.stretches, stretch) + 1;
        } else {
            var text = '1';
        }
        return {
            top: stretchView.y + stretchView.h / 2,
            stretch: stretch,
            text: '' + text,
        };
    });

    var foregroundIndexEls = Draw.trackForegroundIndices.selectAll('div.foreground-index.static')
        .data(foregroundIndexViews, function (d) { return d.stretch.id }) ;

    var foregroundIndexEnterEls = foregroundIndexEls.enter().append('div')
        .on('click', function (d) {
            var series = d.stretch.series;
            var lastStretch = series.stretches[series.stretches.length - 1];
            Global.selection.foreground.focus = lastStretch;
            Main.maybeUpdate(function () { Global.inputForegroundIndexStretch = lastStretch });
            d3.event.stopPropagation();
        })
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverIndexStretch = d.stretch;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverIndexStretch === d.stretch) {
                        Global.hoverIndexStretch = null;
                    }
                });
            }, 0);
        })
        .on('mousedown', function () {
            d3.event.stopPropagation();
        }) ;

    foregroundIndexEnterEls.append('div')
        .attr('class', 'foreground-index-content') ;

    foregroundIndexEls.exit().remove();

    foregroundIndexEls.each(function (d) { d.__el__ = this });

    var targetIndexStretch = Main.targetIndexStretch();
    var targetIndexView = _.find(foregroundIndexViews, function (indexView) {
        return indexView.stretch === targetIndexStretch;
    });

    foregroundIndexEls
        .attr('class', function (d) {
            var classes = ['foreground-index', 'static'];
            var series = d.stretch.series;
            if (series) {
                classes.push('series');
            }
            if (
                d === targetIndexView &&
                Global.inputForegroundIndexStretch
            ) {
                classes.push('under-input');
            }
            classes.push(DrawReferences.colorForIndex(d));
            return classes.join(' ');
        })
        .style('top', function (d) {
            return d.top + 'px';
        }) ;

    foregroundIndexEls.select('.foreground-index-content')
        .text(function (d) { return d.text }) ;

    if (Global.inputForegroundIndexStretch) {
        var wasInputting = foregroundIndexInputEl.classed('inputting');
        foregroundIndexInputEl
            .classed('inputting', true)
            .style('top', function () {
                return targetIndexView.top + 'px';
            }) ;
        if (!wasInputting) {
            var contentEl = foregroundIndexInputEl.select('.foreground-index-content')
                .text(targetIndexView.text) ;
            contentEl.node().focus();
            DomRange.setCurrentCursorOffset(contentEl.node(), targetIndexView.text.length);
        }
    }
    foregroundIndexInputEl
        .attr('class', function () {
            var classes = ['foreground-index', 'foreground-index-input'];
            if (Global.inputForegroundIndexStretch) {
                classes.push('inputting');
            }
            if (targetIndexView) {
                classes.push(DrawReferences.colorForIndex(targetIndexView));
            }
            return classes.join(' ');
        }) ;
};

})();
