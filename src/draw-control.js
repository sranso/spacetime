'use strict';
var DrawControl = {};
(function () {

var controlContainer;

DrawControl.setup = function () {
    controlContainer = d3.select('#control');
};

DrawControl.draw = function () {
    var playerEls = controlContainer.selectAll('.player')
        .data([Global.player], function (d) { return d.id }) ;

    var playerEnterEls = playerEls.enter().append('div')
        .attr('class', 'player') ;


    var goToBeginningEnterEls = playerEnterEls.append('div')
        .attr('class', 'go-to-beginning player-result')
        .datum(function (d) { return d.atBeginning.stepView }) ;

    goToBeginningEnterEls.append('div')
        .attr('class', 'go-to-beginning-button')
        .on('click', function (d) {
            if (!Global.inputStepView && !Global.connectStepView) {
                d.player.time.result = 0;
                Main.update();
                d3.event.stopPropagation();
            }
        }) ;

    var playPauseEnterEls = playerEnterEls.append('div')
        .attr('class', 'play-pause player-result')
        .datum(function (d) { return d.playing.stepView }) ;

    playPauseEnterEls.append('div')
        .attr('class', 'play-pause-button')
        .on('mousedown', function (d) {
            if (!Global.inputStepView && !Global.connectStepView) {
                d.step.result = !d.step.result;
                Main.update();
                d3.event.stopPropagation();
            }
        }) ;

    var repeatEnterEls = playerEnterEls.append('div')
        .attr('class', 'repeat player-result')
        .datum(function (d) { return d.repeating.stepView }) ;

    repeatEnterEls.append('div')
        .attr('class', 'repeat-button')
        .on('click', function (d) {
            if (!Global.inputStepView && !Global.connectStepView) {
                d.step.result = !d.step.result;
                Main.update();
                d3.event.stopPropagation();
            }
        }) ;


    var currentTimeContainerEnterEls = playerEnterEls.append('div')
        .attr('class', 'time-info-container current-time-container') ;

    var currentTimeEnterEls = currentTimeContainerEnterEls.append('div')
        .attr('class', 'time-info current-time player-result')
        .datum(function (d) { return d.time.stepView }) ;

    currentTimeEnterEls.append('div')
        .attr('class', 'current-time-content time-info-content') ;


    var playerSliderEnterEls = playerEnterEls.append('div')
        .attr('class', 'slider') ;

    playerSliderEnterEls.append('div')
        .attr('class', 'slider-bar') ;

    playerSliderEnterEls.append('div')
        .attr('class', 'slider-bar-completed') ;


    var sliderHandleEnterEls = playerSliderEnterEls.append('div')
        .attr('class', 'slider-handle player-result')
        .datum(function (d) { return d.time.stepView }) ;

    sliderHandleEnterEls.append('div')
        .attr('class', 'slider-handle-knob') ;


    var endTimeContainerEnterEls = playerEnterEls.append('div')
        .attr('class', 'time-info-container end-time-container') ;

    var endTimeEnterEls = endTimeContainerEnterEls.append('div')
        .attr('class', 'time-info end-time player-result')
        .datum(function (d) { return d.endTime.stepView }) ;

    endTimeEnterEls.append('div')
        .attr('class', 'end-time-content time-info-content') ;


    var playerResultEnterEls = playerEnterEls.selectAll('.player-result')
        .on('mousedown', function (d) {
            if (Global.connectStepView) {
                Step.setEnvironmentUpdatedBy(d);
            } else if (Global.inputStepView) {
                Step.insertOrUpdateReference(d);
                d3.event.preventDefault();
            }
            d3.event.stopPropagation();
        })
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverResultStepView = d;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverResultStepView === d) {
                        Global.hoverResultStepView = null;
                    }
                });
            }, 0);
        }) ;

    DrawHelper.drawResultBorder(playerResultEnterEls);


    playerEls.exit().remove();

    playerEls
        .attr('class', function (d) {
            var classes = ['player'];
            if (d.playing.result) {
                classes.push('playing');
            } else {
                classes.push('paused');
            }
            if (d.repeating.result) {
                classes.push('repeating');
            }
            return classes.join(' ');
        }) ;

    playerEls.selectAll('.player-result')
        .attr('class', function (d) {
            var classes = this.classList;
            classes = _.difference(classes, [
                'referenced-by-color',
                'reference-color-1',
                'reference-color-2',
                'reference-color-3',
                'reference-color-4',
                'reference-color-5-or-more',
            ]);
            classes.push(DrawReferences.colorForResult(d));
            return classes.join(' ');
        }) ;

    var sliderLeft = function (d) {
        var fractionComplete = d.player.time.result / d.player.endTime.result;
        return Math.floor(fractionComplete * 140) + 'px';
    };
    playerEls.select('.slider-bar-completed')
        .datum(function (d) { return d.time.stepView })
        .style('width', sliderLeft) ;

    playerEls.select('.slider-handle')
        .datum(function (d) { return d.time.stepView })
        .style('left', sliderLeft) ;

    playerEls.select('.current-time-content')
        .text(function (d) { return Math.floor(d.time.result) }) ;

    playerEls.select('.end-time-content')
        .text(function (d) { return Math.floor(d.endTime.result) }) ;
};

})();
