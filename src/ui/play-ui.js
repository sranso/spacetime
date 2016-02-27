'use strict';
global.PlayUi = {};
(function () {

PlayUi.initialize = function () {
    d3.select('#play-bar')
        .on('mousedown', function () {
            Global.mouseDownOnPlayBar = true;
            var x = d3.mouse(this)[0];
            Do.changeCurrentFrame(x);
        })
        .on('mousemove', function () {
            if (Global.mouseDownOnPlayBar) {
                var x = d3.mouse(this)[0];
                Do.changeCurrentFrame(x);
            }
        })

    d3.select('#play-marker')
        .style('height', '20px') ;
};

PlayUi.draw = function (info) {
    var cff = Grid.columnForFrame(info.grid, $Project.currentFrame);
    var left = cff.c * 190 + cff.frameFraction * 160 + 2;

    var playMarker = d3.select('#play-marker')
        .style('left', left + 'px') ;

    if (Global.wasPlaying) {
        playMarker
            .style('height', window.innerHeight + 'px')
            .transition();
    }

    if (Global.wasPlaying && !Global.play) {
        playMarker.transition()
            .delay(Global.timePerFrame)
            .duration(Global.play ? 0 : 250)
            .style('height', '20px') ;
    }
};


})();
