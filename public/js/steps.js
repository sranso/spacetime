var idSequence = 0;

var newId = function () {
    idSequence += 1;
    return idSequence;
};

var createStep = function (step) {
    step = _.extend({
        id: newId(),
        text: '',
        pseudo: false,
        groups: [],
        next: null,
        previous: null,
        underPseudo: null,
    }, step);
    step.stretch = [step];
    return step;
};

// TODO: only allow groups of single stretches to become
// pseudo steps.
var createPseudoStep = function (stretch) {
    var text = stretch.group ? stretch.group.text : stretch[0].text;
    return {
        id: newId(),
        //id: group.id,
        text: text,
        pseudo: true,
        stretch: stretch,
        group: stretch.group,
        position: null,
        __el__: null,
        next: null,
        previous: null,
    };
};

var realSteps = function (pseudoSteps) {
    return _.reduce(pseudoSteps, function (steps, step) {
        return steps.concat(step.stretch);
    }, []);
};

var addUnderGroup = function (steps, group) {
    _.each(steps, function (step) {
        step.groups = _.union(step.groups, [group]);
    });
};

var removeUnderGroup = function (steps, group) {
    _.each(steps, function (step) {
        step.groups = _.without(step.groups, group);
    });
};

var computePseudoSteps = function () {
    allPseudoSteps = [];
    var pseudo = null;

    var real = allSteps[0];
    while (real) {
        var maxStretch = {length: 0};
        _.each(real.groups, function (group) {
            if (!group.expanded) {
                var stretches = groupByStretches(orderElements(group.elements));
                var stretch = _.find(stretches, function (stretch) {
                    return _.contains(stretch, real);
                });
                stretch.group = group;
                if (stretch.length > maxStretch.length) {
                    maxStretch = stretch;
                }
            }
        });

        if (!maxStretch.length) {
            maxStretch = [real];
        }
        var pseudo = createPseudoStep(maxStretch);
        allPseudoSteps.push(pseudo);
        var nextReal = maxStretch[maxStretch.length - 1].next;
        while (real && real !== nextReal) {
            real.underPseudo = pseudo;
            real = real.next;
        }
    }

    linkSteps(allPseudoSteps);
};

var linkSteps = function (steps) {
    var previous = null;
    _.each(steps, function (step) {
        if (previous) {
            previous.next = step;
        }
        step.previous = previous;
        previous = step;
    });
};

var computeStepPositions = function (steps) {
    var prevPos = {x: 0, y: 0, w: 0, h: 0};
    _.each(steps, function (step) {
        var pos = {
            x: stepsX,
            y: prevPos.y + lineHeight,
            w: stepW,
            h: lineHeight,
        };
        step.position = pos;
        _.extend(step, pos);
        prevPos = pos;
    });
};

var drawStepsSetup = function () {
    stepTextInput = d3.select('#step-text-input')
        .style('left', (stepsX + stepsTextX + 23) + 'px') ;

    stepTextInput.select('input')
        .style('width', (stepW - stepsTextX - 20) + 'px')
        .style('height', (lineHeight - 12) + 'px') ;

    camera.append('rect')
        .classed('track-rail', true)
        .attr('x', stepsX + 70)
        .attr('y', 10)
        .attr('width', 10)
        .attr('height', 10000) ;

    camera.append('rect')
        .classed('track-rail', true)
        .attr('x', stepsX + stepW - 80)
        .attr('y', 10)
        .attr('width', 10)
        .attr('height', 10000) ;
};

var drawSteps = function (steps) {
    var stepEls = camera.selectAll('g.step')
        .data(steps, _.property('id')) ;

    var stepEnterEls = stepEls.enter().append('g')
        .each(function (d) {
            d.__el__ = this;
        }) ;

    stepEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 0)
        .attr('y', 1)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('width', _.property('w'))
        .attr('height', function (d) { return d.h - 3 }) ;

    stepEnterEls.append('text')
        .attr('y', 21)
        .attr('x', stepsTextX) ;

    stepEls.exit().remove();

    stepEls
        .attr('class', function (d) {
            var classes = [];
            if (_.intersection(d.stretch, selection.elements).length) {
                classes.push('selection');
            }
            classes.push('step');
            return classes.join(' ');
        })
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;

    stepEls.select('text')
        .text(_.property('text')) ;
};
