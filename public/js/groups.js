var orderElements = function (elements) {
    return _.sortBy(elements, function (element) {
        return _.indexOf(allSteps, element);
    });
};

var groupByStretches = function (elements) {
    if (!elements.length) {
        return [];
    }
    var previous = elements[0];
    var stretch = [previous];
    var stretches = [stretch];

    for (var i = 1; i < elements.length; i++) {
        var element = elements[i];
        if (previous.next === element) {
            stretch.push(element);
        } else {
            stretch = [element];
            stretches.push(stretch);
        }
        previous = element;
    }
    return stretches;
};

var orderGroups = function (groups) {
    return groups.sort(function (a, b) {
        if (a.__maxStretches !== b.__maxStretches) {
            return a.__maxStretches < b.__maxStretches ? -1 : +1;
        }
        if (a.elements.length !== b.elements.length) {
            return a.elements.length < b.elements.length ? -1 : +1;
        }
        if (a.__firstElementI !== b.__firstElementI) {
            return a.__firstElementI < b.__firstElementI ? -1 : +1;
        }
        return 0;
    });
};

var computeGroupPositions = function (groups) {
    groups = _.filter(groups, function (group) {
        group.elements = orderElements(group.elements);
        group.stretches = groupByStretches(group.elements);
        if (!group.stretches.length) {
            return false;
        }
        group.__maxStretches = _.max(_.pluck(group.stretches, 'length'));
        group.__firstElementI = _.indexOf(allSteps, group.elements[0]);
        return true;
    });
    var ordered = orderGroups(groups);

    __stretches = [];
    var x = 230;
    _.each(ordered, function (group) {
        _.each(group.stretches, function (stretch) {
            var lastEl = stretch[stretch.length - 1];
            var pos = {
                x: x,
                y: stretch[0].y,
                w: 7,
                h: lastEl.y + lastEl.h - stretch[0].y,
            };
            stretch.position = pos;
            _.extend(stretch, pos);
            stretch.group = group;

            __stretches.push(stretch);
        });
        x -= 7;
    });
};

var drawGroups = function (stretches) {
    var stretchEls = camera.selectAll('g.group-stretch')
        .data(stretches) ;

    var stretchEnterEls = stretchEls.enter().append('g');

    stretchEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx', 2)
        .attr('ry', 2) ;

    stretchEls
        .attr('class', function (d) {
            if (d.group === selection) {
                return 'group-stretch showing';
            }
            return 'group-stretch';
        })
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;

    stretchEls.select('rect.background')
        .attr('width', function (d) { return d.w - 2 })
        .attr('height', _.property('h')) ;
};
