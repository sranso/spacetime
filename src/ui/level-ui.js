'use strict';
var LevelUi = {};
(function () {

LevelUi.draw = function () {
    var levels = $Project.cellLevels.map(function (level, i) {
        return {
            level: level,
            i: i,
        };
    });
    levels.unshift({level: null, i: -1});

    var levelEls = d3.select('#levels').selectAll('.level')
        .data(levels, function (d) { return d.i }) ;

    var levelEnterEls = levelEls.enter().append('div')
        .attr('class', 'level')
        .on('mousedown', function (d) {
            Do.toLevel(d);
        })
        .style('top', function (d, i) {
            return (i * 30) + 'px';
        }) ;

    levelEls.exit().remove();

    levelEls
        .attr('class', function (d) {
            var classes = ['level'];
            if (d.i === $Project.currentLevel) {
                classes.push('current');
            }
            if (d.i === -1) {
                classes.push('expand-top');
            }

            return classes.join(' ');
        }) ;
};

})();
