var Group = {};
(function () {

Group.create = function () {
    return {
        id: Main.newId(),
        hidden: false,
        stretches: [],
        color: [_.random(360), _.random(70, 95), _.random(78, 83)],
        text: '',
    };
};

Group.groupsToDraw = function (groups) {
    groups = _.filter(groups, function (group) {
        if (group.hidden) {
            return false;
        }
        group.stretchViews = _.map(group.stretches, function (stretch) {
            StretchView.computeSteps(stretch.stretchView);
            return stretch.stretchView;
        });
        group.stretchViews = _.filter(group.stretchViews, function (stretch) {
            return stretch.steps.length;
        });
        return group.stretchViews.length > 0;
    });
    return orderGroups(groups);
};

var orderGroups = function (groups) {
    return groups.sort(function (a, b) {
        if (a.stretches[0].steps.length !== b.stretches[0].steps.length) {
            return a.stretches[0].steps.length < b.stretches[0].steps.length ? -1 : +1;
        }
        return 0;
    });
};

})();
