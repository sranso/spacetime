'use strict';
var Group = {};
(function () {

Group.create = function () {
    return {
        id: Main.newId(),
        stretches: [],
        color: [_.random(360), _.random(70, 95), _.random(58, 63)],
        text: '',
        remember: false,
        stretchViews: [],
    };
};

Group.computeStretchViews = function (group) {
    var stretchViews = _.map(group.stretches, function (stretch) {
        var stretchView = StretchView.create(stretch);
        StretchView.computeSteps(stretchView);
        return stretchView;
    });
    var stretchViews = _.filter(stretchViews, function (stretchView) {
        return stretchView.steps.length;
    });
    return stretchViews;
};

Group.groupsToDraw = function (groups) {
    groups = _.filter(groups, function (group) {
        if (!group.remember) {
            return false;
        }
        group.stretchViews = Group.computeStretchViews(group);
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

Group.toggleRemember = function () {
    var group = Global.selection.foreground.group;
    if (!group) {
        return;
    }

    group.remember = !group.remember;
};

Group.remove = function (group) {
    _.each(group.stretches, function (stretch) {
        Stretch.setSteps(stretch, []);
    });
    Global.groups = _.without(Global.groups, group);
};

})();
