'use strict';
global.AreaUi = {};
(function () {

AreaUi.draw = function (info) {
    var areaEls = d3.select('#areas').selectAll('.area')
        .data(info.areas) ;

    var areaEnterEls = areaEls.enter().append('div')
        .attr('class', 'area') ;

    areaEnterEls.append('div')
        .attr('class', 'corner vertical')
        .style('top', '1px')
        .style('left', '1px')

    areaEnterEls.append('div')
        .attr('class', 'corner horizontal')
        .style('top', '1px')
        .style('left', '1px')

    areaEnterEls.append('div')
        .attr('class', 'corner vertical')
        .style('top', '1px')
        .style('right', '1px')

    areaEnterEls.append('div')
        .attr('class', 'corner horizontal')
        .style('top', '1px')
        .style('right', '1px')

    areaEnterEls.append('div')
        .attr('class', 'corner vertical')
        .style('bottom', '1px')
        .style('left', '1px')

    areaEnterEls.append('div')
        .attr('class', 'corner horizontal')
        .style('bottom', '1px')
        .style('left', '1px')

    areaEnterEls.append('div')
        .attr('class', 'corner vertical')
        .style('bottom', '1px')
        .style('right', '1px')

    areaEnterEls.append('div')
        .attr('class', 'corner horizontal')
        .style('bottom', '1px')
        .style('right', '1px')

    areaEls.exit().remove();

    areaEls
        .style('top', function (d) {
            return (d.area.coords[1] * 140) + 'px';
        })
        .style('left', function (d) {
            return (d.area.coords[0] * 190 - 11) + 'px';
        })
        .style('width', function (d) {
            var span = d.area.coords[2] - d.area.coords[0] + 1;
            return (span * 190) + 'px';
        })
        .style('height', function (d) {
            var span = d.area.coords[3] - d.area.coords[1] + 1;
            return (span * 140) + 'px';
        }) ;

    areaEls.selectAll('.corner')
        .style('background-color', function (d) {
            var group = d.area.group;
            var co = group.color;
            return 'hsl(' + co[0] + ',' + co[1] + '%,' + co[2] + '%)';
        }) ;
};

})();
