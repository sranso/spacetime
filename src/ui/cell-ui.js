'use strict';
global.CellUi = {};
(function () {

CellUi.draw = function (info) {
    var cellEls = d3.select('#cells').selectAll('.cell')
        .data(info.cells, function (d) {
            return d.c + ' ' + d.r;
        }) ;

    var cellEnterEls = cellEls.enter().append('div')
        .attr('class', 'cell')
        .on('mousedown', function (d) {
            if (d3.event.shiftKey) {
                Do.changeCellArgs(d);
            } else {
                Do.selectCell(d);
            }
            d3.event.stopPropagation();
        })
        .on('dblclick', function (d) {
            Do.openCell(d);
            d3.event.preventDefault();
        })
        .style('top', function (d) {
            return (d.r * 140 + 50) + 'px';
        })
        .style('left', function (d) {
            return (d.c * 190 + 50) + 'px';
        }) ;

    cellEnterEls.append('div')
        .attr('class', 'text')
        .attr('contenteditable', true)
        .on('focus', function (d) {
            Global.inputCell = true;
        })
        .on('blur', function (d) {
            Global.inputCell = false;
        })
        .on('input', function (d) {
            Do.inputText(d, this.textContent);
        })
        .on('dblclick', function (d) {
            d3.event.stopPropagation();
        })
        .on('keydown', function (d) {
            Keyboard.textInputEvent(d, Keyboard.keyForEvent());
        })
        .on('keypress', function () {
            d3.event.stopPropagation();
        }) ;

    var resultEnterEls = cellEnterEls.append('div')
        .attr('class', 'result')
        .on('mousemove', function (d) {
            Do.showFrame(d, d3.mouse(this)[0]);
        })
        .on('mouseleave', function (d) {
            if (d.drawTick === Global.drawTick) {
                Do.showFrame(d, 0);
            }
        }) ;

    resultEnterEls.append('div')
        .attr('class', 'result-text') ;

    cellEls.exit().remove();

    var targetCell = Global.targetCellView ? Global.targetCellView.cell : Cell.none;

    Global.cellEls = [];
    cellEls.each(function (d) {
        if (!Global.cellEls[d.c]) {
            Global.cellEls[d.c] = [];
        }
        Global.cellEls[d.c][d.r] = this;
    });

    cellEls
        .attr('class', function (d) {
            var classes = ['cell'];
            if (d.cell === targetCell) {
                classes.push('target');
            }
            var t = Global.targetCellView;
            if (t) {
                var argIndex = Cell.argIndex(t.cell, t.c, t.r, d.c, d.r);
                if (argIndex !== -1) {
                    classes.push('arg');
                }
            }
            return classes.join(' ');
        }) ;

    cellEls.select('.text')
        .text(function (d) { return d.cell.text }) ;

    cellEls.select('.result-text')
        .text(function (d) {
            var result = d.cell.result;
            if (result.error) {
                return result.error;
            } else if (result.type === Result.number) {
                return result.value;
            } else {
                return '';
            }
        })

    cellEls.select('.result')
        .each(function (d) {
            if (d.cell.result.type === Result.quads) {
                var c = d.c - info.leftC;
                var r = info.bottomR - d.r;
                Webgl.drawGridCell(d.cell.result.value, c, r);
            }
        }) ;
};

})();
