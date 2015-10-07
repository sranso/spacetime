'use strict';
var FullScreen = {};
(function () {

FullScreen.draw = function () {
    d3.select('#grid')
        .style('display', 'none') ;

    var cell = Project.currentCell($Project);
    var result = cell.result;

    d3.select('#canvas')
        .style('left', '0px')
        .style('width', window.innerWidth + 'px')
        .style('top', '0px')
        .style('height', window.innerHeight + 'px') ;

    Webgl.clear();

    d3.select('#full-screen-text')
        .text(function () {
            if (result.error) {
                return result.error;
            } else if (result.type === Result.number) {
                return result.value;
            } else {
                return '';
            }
        }) ;

    if (result.type === Result.quads) {
        Webgl.drawFullScreen(cell.result.value);
    }
};

})();
