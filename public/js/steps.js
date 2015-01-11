var idSequence = 0;

var newId = function () {
    idSequence += 1;
    return idSequence;
};

var createStep = function (step) {
    return _.extend({
        id: newId(),
        text: '',
        pseudo: false,
        groups: [],
        position: null,
        __el__: null,
        next: null,
        previous: null,
    }, step);
};

// TODO: only allow groups of single stretches to become
// pseudo steps.
var createPseudoStep = function (stretch) {
    return {
        id: newId(),
        //id: group.id,
        text: stretch.group.text,
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
    var steps = [];
    _.each(pseudoSteps, function (step) {
        if (step.pseudo) {
            steps = steps.concat(step.stretch);
        } else {
            steps.push(step);
        }
    });
    return steps;
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

        if (maxStretch.length) {
            var pseudo = createPseudoStep(maxStretch);
            allPseudoSteps.push(pseudo);
            real = maxStretch[maxStretch.length - 1].next;
        } else {
            allPseudoSteps.push(real);
            real = real.next;
        }
    }
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
            if (_.contains(selection.elements, d)) {
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
