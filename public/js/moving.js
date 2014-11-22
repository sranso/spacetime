var minMoveX = 15;


var computeHovering = function () {
    var under = findUnderMouse() || [null, null];
    updateState({
        doHovering: false,
        hovering: under[0],
        hoveringMode: under[1],
    });
};

var mouseDown = function () {
    return; // TODO
    mouse = d3.mouse(camera.node());
    inputEvent('left mouse', 'down');
};

var mouseUp = function () {
    return; // TODO
    mouse = d3.mouse(camera.node());
    inputEvent('left mouse', 'up');
};

var mouseMove = doStuffAroundStateChanges(function () {
    return; // TODO
    mouse = d3.mouse(camera.node());
    dragMoving();
    changeSelection();
    maybeResetAfterMoving();
    updateState({doHovering: true});
});

var mouseEnter = doStuffAroundStateChanges(function () {
    return; // TODO
    mouse = d3.mouse(camera.node());
    updateState({inCamera: true, doHovering: true});
});

var mouseLeave = doStuffAroundStateChanges(function () {
    return; // TODO
    updateState({hovering: null, inCamera: false});
});

var mouseScroll = function () {
    return; // TODO
    var scrollX = document.body.scrollTop;
    cameraX = cameraStartX - scrollX;
    computeNonTreePositions();
    draw(nullSelection());
};

var startSelection = function () {
    var target = state.target;
    if (!target) {
        return;
    }
    if (target.branch) {
        return;  // TODO
    }
    updateState({
        selection: [target],
        selectionBegin: target,
        selectionEnd: target,
        selectionMode: 'tower',
    });
};

var changeSelection = function () {
    var begin = state.selectionBegin;
    if (!begin) {
        return;
    }
    var end = findFromSiblings(allTokens, mouse[0]);
    var indices = _.sortBy([begin.tokenI, end.tokenI]);
    var selection = allTokens.slice(indices[0], indices[1] + 1);
    updateState({
        selection: selection,
        selectionEnd: end,
    });
};

var stopSelection = function () {
    updateState({
        selectionBegin: null,
        startMouse: mouse,
    });
};


var maybeResetAfterMoving = function () {
    var info = movingInfo();
    var diff = info.absDiff[0] + info.absDiff[1];
    if (diff >= 3) {
        if (state.inserting) {
            removeEmptyText(state.inserting);
            updateState({inserting: null});
        }
        if (state.selection) {
            if (!state.selectionBegin && !state.moving) {
                updateState({selection: null});
            }
        }
    }
};

var movingInfo = function () {
    var startMouse = state.startMouse;
    var diff = [mouse[0] - startMouse[0], mouse[1] - startMouse[1]];
    return {
        diff: diff,
        direction: [diff[0] >= 0 ? 1 : -1, diff[1] >= 0 ? 1 : -1],
        absDiff: [Math.abs(diff[0]), Math.abs(diff[1])],
    };
};

var startMoving = function () {
    if (state.moving) {
        return;
    }
    var moving = state.target;
    updateState({
        moving: moving,
        movingMode: state.targetMode,
        startMouse: mouse,
    });
};

var stopMoving = function (s) {
    updateState({moving: null});
};

var dragMoving = function () {
    if (!state.moving) {
        return;
    }

    var info = movingInfo();
    var moved;

    if (state.targetMode === 'tower') {
        moved = dragTower(info);
    } else {
        moved = dragSymbol(info);
    }

    if (moved) {
        updateState({doStructure: state.targetMode});
    } else {
        _.each(state.targets, computePositions);
        draw(movingSelection());
    }
};

var positionAfterMove = function () {
    var currentPos = {x: state.moving.x, y: state.moving.y};
    computeStructure(state.targetMode);
    computePositions(allDisplayTree);
    state.startMouse = [
        state.startMouse[0] + state.moving.x - currentPos.x,
        state.startMouse[1] + state.moving.y - currentPos.y,
    ];
};

var dragTower = function (info) {
    var levelChange = calculateLevelChange(info);
    _.each(state.targets, function (target) {
        target.level = target.level + levelChange;
        if (target.level <= 0) {
            target.level = 1;
        }
    });

    var swapped = maybeSwap(allTokens, 'tokenI', info);
    var moved = levelChange || swapped;
    if (moved) {
        positionAfterMove();
    }
    return moved;
};

var maybeSwap = function (siblings, index, info) {
    var swapped = false;
    var diffX = info.absDiff[0];
    var dir = info.direction[0];
    var len = state.targets.length;
    var movingI = state.targets[dir < 0 ? 0 : len - 1][index];
    while (true) {
        var neighborI = movingI + dir;
        var neighbor = siblings[neighborI];
        if (neighbor && diffX >= neighbor.w / 2 && diffX > minMoveX) {
            swapped = true;
            var args;
            if (dir < 0) {
                args = [neighborI, len + 1].concat(state.targets, neighbor);
            } else {
                args = [neighborI - len, len + 1].concat(neighbor, state.targets);
            }
            siblings.splice.apply(siblings, args);
            movingI = neighborI;
            diffX -= neighbor.w;
        } else {
            break;
        }
    }
    return swapped;
}

var dragSymbol = function (info) {
    var moving = state.moving;
    var levelChange = calculateLevelChange(info);
    if (moving.level + levelChange <= 0) {
        levelChange = 1 - moving.level;
    }

    if (levelChange <= -1) {
        moving.parent.children.splice(moving.treeI, 1);
        var n = new Array(-levelChange);
        var insertBefore = _.reduce(n, _.property('parent'), moving);
        var newSiblings = insertBefore.parent.children;
        var before = newSiblings.slice(0, insertBefore.treeI);
        var after = newSiblings.slice(insertBefore.treeI);
        newSiblings = before.concat([moving]).concat(after);
        insertBefore.parent.children = newSiblings;
        positionAfterMove();
    } else if (levelChange >= 1) {
        var siblings = moving.parent.children;
        var neighborI = moving.treeI + info.direction[0];
        var firstNeighbor = siblings[neighborI];
        neighborI = moving.treeI - info.direction[0];
        var secondNeighbor = siblings[neighborI];
        var descendNeighbor = _.find([firstNeighbor, secondNeighbor], function (n) {
            return n && n.branch;
        });
        if (descendNeighbor) {
            siblings.splice(moving.treeI, 1);
            if (descendNeighbor.treeI > moving.treeI) {
                descendNeighbor.children.unshift(moving);
            } else {
                descendNeighbor.children.push(moving);
            }
            positionAfterMove();
        } else {
            levelChange = 0;
        }
    }

    var swapped = maybeSwap(moving.parent.children, 'treeI', movingInfo());
    if (swapped) {
        positionAfterMove();
    }
    return levelChange !== 0 || swapped;
};

var calculateLevelChange = function (info) {
    return Math.round(info.diff[1] / levelHeight);
};
