var createGroup = function (group) {
    group = group || {};
    group = _.extend({
        elements: [],
        color: [_.random(360), _.random(70, 95), _.random(89, 92)],
        text: '',
        expanded: true,
    }, group);
    group.id = newId();
    return group;
};

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

var partitionInternalExternalGroups = function (compareToElements, internalElements) {
    var groups = _.reduce(internalElements, function (groups, element) {
        return _.union(groups, element.groups);
    }, []);
    return _.partition(groups, function (group) {
        return isGroupInternal(compareToElements, group.elements);
    });
};

var isGroupInternal = function (compareToElements, groupElements) {
    var externalElements = _.difference(groupElements, compareToElements);
    return !externalElements.length;
};

var groupByPseudoStretches = function (elements) {
    if (!elements.length) {
        return [];
    }
    var i = 0;
    var real = elements[i];
    var pseudo = real.underPseudo;
    var stretchStep = {step: pseudo};
    var stretch = [stretchStep];
    var stretches = [stretch];

    while (real) {
        var missingSteps = _.difference(pseudo.stretch, elements);
        stretchStep.partial = missingSteps.length;
        while (real && real.underPseudo === pseudo) {
            i += 1;
            real = elements[i];
        }
        if (real) {
            var nextPseudo = real.underPseudo;
            var stretchStep = {step: nextPseudo};
            if (nextPseudo == pseudo.next) {
                stretch.push(stretchStep);
            } else {
                stretch = [stretchStep];
                stretches.push(stretch);
            }
            pseudo = nextPseudo;
        }
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
        group.stretches = groupByPseudoStretches(group.elements);
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
                y: stretch[0].step.y,
                w: 9,
                h: lastEl.step.y + lastEl.step.h - stretch[0].step.y,
            };
            stretch.position = pos;
            _.extend(stretch, pos);
            stretch.group = group;

            __stretches.push(stretch);
        });
        x -= 9;
    });
};

var drawGroupsSetup = function () {
};

var drawGroups = function (stretches) {
    var stretchEls = camera.selectAll('g.group-stretch')
        .data(stretches) ;

    var stretchEnterEls = stretchEls.enter().append('g');

    stretchEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 1)
        .attr('y', 1)
        .attr('rx', 2)
        .attr('ry', 2) ;

    stretchEnterEls.append('rect')
        .classed('mouse', true)
        .attr('x', 0)
        .attr('y', 0)
        .on('click', function (d) {
            selection = d.group;
            selectionHistoryI = saveHistoryI + 1;
            selectionHistory[selectionHistoryI] = {selection: selection};
            computePositions();
            draw();
        }) ;

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
        .attr('height', function (d) { return d.h - 2 })
        .style('fill', function (d, i) {
            if (d.group === selection) {
                return '#afa';
            }
            var c = d.group.color;
            return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
        }) ;

    stretchEls.select('rect.mouse')
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;
};
