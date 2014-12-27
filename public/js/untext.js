var camera, allStatements;

var statementsX = 160;
var lineHeight = 30;
var statementW = 370;


var drawSetup = function () {
    var svg = d3.select('svg#code')
        .attr('width', '100%')
        .attr('height', '2000px') ;

    camera = svg.append('g')
        .classed('camera', true) ;
};

var computePositions = function (statements) {
    var prevPos = {x: 0, y: 0, w: 0, h: 0};
    _.each(statements, function (statement) {
        var pos = {
            x: statementsX,
            y: prevPos.y + lineHeight,
            w: statementW,
            h: lineHeight,
        };
        statement.position = pos;
        _.extend(statement, pos);
        prevPos = pos;
    });
};

var draw = function (sel) {
    var statements = camera.selectAll('g.statement')
        .data(sel.statements) ;

    var statementsEnter = statements.enter().append('g')
        .classed('statement', true)
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;
    statementsEnter.append('rect')
        .classed('border', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;
    statementsEnter.append('text')
        .attr('y', 19)
        .attr('x', 5) ;

    statements.select('text')
        .text(_.property('text')) ;
};

var selection = function () {
    return {
        statements: allStatements,
    };
};

var createStatement = function (statement) {
    return _.extend({
        text: '',
        position: null,
    }, statement);
};

allStatements = _.map([
    {text: '4 + 1'},
    {text: '^ * 3'},
    {text: '^ - 12'},
], createStatement);

drawSetup();
computePositions(allStatements);
draw(selection());
