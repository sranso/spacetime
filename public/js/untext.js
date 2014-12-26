var camera, allStatements;

var statementsX = 160;


var drawSetup = function () {
    var svg = d3.select('svg#code')
        .attr('width', '100%')
        .attr('height', '2000px') ;

    camera = svg.append('g')
        .classed('camera', true) ;
};

var draw = function (sel) {
    var statements = camera.selectAll('g.statement')
        .data(sel.statements) ;

    var statementsEnter = statements.enter().append('g')
        .classed('statement', true)
        .attr('transform', function (d, i) {
            return 'translate(' + statementsX  + ',' + (28 * i) + ')';
        }) ;
    statementsEnter.append('rect')
        .classed('border', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 370)
        .attr('height', 28) ;
    statementsEnter.append('text')
        .attr('y', 19)
        .attr('x', 5) ;

    statements.select('text')
        .text(_.identity) ;
};

var selection = function () {
    return {
        statements: allStatements,
    };
};

allStatements = [
    '4 + 1',
    '^ * 3',
    '^ - 12',
];

drawSetup();
draw(selection());
