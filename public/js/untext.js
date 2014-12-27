var camera, allStatements, mouse, textInput;

var statementsX = 160;
var lineHeight = 30;
var statementW = 370;

mouse = null;


var drawSetup = function () {
    var svg = d3.select('svg#code')
        .attr('width', '100%')
        .attr('height', '2000px') ;

    camera = svg.append('g')
        .classed('camera', true)
        .on('mousemove', mouseMove) ;

    var background = camera.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;

    textInput = d3.select('#text-input')
        .style('width', (statementW - 6) + 'px')
        .style('height', (lineHeight - 3) + 'px')
        .style('left', (statementsX + 29) + 'px') ;
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
        })
        .each(function (d) {
            d.__el__ = this;
        }) ;
    statementsEnter.append('rect')
        .classed('background', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;
    statementsEnter.append('text')
        .attr('y', 20)
        .attr('x', 5) ;

    statements.select('text')
        .text(_.property('text')) ;
};

var mouseMove = function () {
    mouse = d3.mouse(camera.node());
    var under = findUnderMouse();
    d3.select('.under-input')
        .classed('under-input', false) ;

    if (under) {
        d3.select(under.__el__)
            .classed('under-input', true) ;

        textInput
            .style('top', (under.y + 29) + 'px')
            .style('display', 'block')
            .property('value', under.text) ;
    } else {
        textInput
            .style('display', 'none') ;
    }
};

var findUnderMouse = function () {
    return findFromCoordinates(mouse[0], mouse[1]);
};

var findFromCoordinates = function (x, y) {
    return _.find(allStatements, function (statement) {
        if (statement.y < y && y < statement.y + statement.h) {
            return statement.x < x && x < statement.x + statement.w;
        }
        return false;
    });
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
        __el__: null,
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
