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

var groupsToDraw = function (groups) {
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
    return orderGroups(groups);
};
