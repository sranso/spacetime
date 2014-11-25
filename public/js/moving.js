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
    mouse = d3.mouse(camera.node());
    inputEvent('left mouse', 'down');
};

var mouseUp = function () {
    mouse = d3.mouse(camera.node());
    inputEvent('left mouse', 'up');
};

var mouseMove = doStuffAroundStateChanges(function () {
    mouse = d3.mouse(camera.node());
    dragMoving();
    changeSelection();
    maybeResetAfterMoving();
    updateState({doHovering: true});
});

var mouseEnter = doStuffAroundStateChanges(function () {
    mouse = d3.mouse(camera.node());
    updateState({inCamera: true, doHovering: true});
});

var mouseLeave = doStuffAroundStateChanges(function () {
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

// TODO: fix allTower
var changeSelection = function () {
    var begin = state.selectionBegin;
    if (!begin) {
        return;
    }
    var end = findFromTowers(mouse[0]);
    var indices = _.sortBy([begin.towerI, end.towerI]);
    var selection = allTowers.slice(indices[0], indices[1] + 1);
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
        moved = dragTree(info);
    }

    if (moved) {
        updateState({doStructure: true});
    } else {
        _.each(state.targets, computePositions);
        draw(movingSelection());
    }
};

var positionAfterMove = function () {
    var currentPos = {x: state.moving.x, y: state.moving.y};
    computeStructure();
    computePositions(allViewTree);
    state.startMouse = [
        state.startMouse[0] + state.moving.x - currentPos.x,
        state.startMouse[1] + state.moving.y - currentPos.y,
    ];
};

var dragTower = function (info) {
    var depthChange = calculateDepthChange(info);
    var moved = false;
    if (depthChange > 0) {
        _(depthChange).times(function () {
            for (var i = 0; i < state.targets.length; i++) {
                moveTowerDown(state.targets[i]);
            }
        });
        moved = true;
    } else if (depthChange < 0) {
        _(-depthChange).times(function () {
            for (var i = state.targets.length - 1; i >= 0; i--) {
                moveTowerUp(state.targets[i]);
            }
        });
        moved = true;
    }

    var swapped = maybeSwapTower(info);
    var moved = depthChange || swapped;
    if (moved) {
        positionAfterMove();
    }
    return moved;
};

var moveTowerDown = function (tower) {
    var leftTower = previousTower(tower);
    var rightTower = nextTower(tower);
    var leftDepth = leftTower ? leftTower[1] : -1000;
    var rightDepth = rightTower ? rightTower[1] : -1000;
    var oldParent = tower.parent;
    var siblings = tower.parent.children;
    if (leftDepth <= 0 && rightDepth <= 0) {
        var newParent = createView(createSymbol(), {children: [tower]});
        siblings[treeI(tower)] = newParent;
        update(oldParent);
        update(newParent);
    } else if (leftDepth <= 0 && rightDepth > 0) {
        var newParent = siblings[treeI(tower) + 1];
        siblings.splice(treeI(tower), 1);
        newParent.children.unshift(tower);
        update(oldParent);
        update(newParent);
    } else if (leftDepth > 0 && rightDepth <= 0) {
        var newParent = siblings[treeI(tower) - 1];
        siblings.splice(treeI(tower), 1);
        newParent.children.push(tower);
        update(oldParent);
        update(newParent);
    } else {  // leftDepth > 0 && rightDepth > 0
        var newParent = siblings[treeI(tower) - 1];
        var merge = siblings[treeI(tower) + 1];
        newParent.children.push(tower);
        newParent.children = newParent.children.concat(merge.children);
        merge.children = [];
        siblings.splice(treeI(tower), 2);
        update(oldParent);
        update(newParent);
        update(merge);
        killView(merge);
    }
};

var moveTowerUp = function (tower) {
    if (!tower.parent.parent) {
        return;
    }
    var leftTower = previousTower(tower);
    var rightTower = nextTower(tower);
    var leftDepth = leftTower ? leftTower[1] : -1000;
    var rightDepth = rightTower ? rightTower[1] : -1000;
    var oldParent = tower.parent;
    if (leftDepth < 0 && rightDepth < 0) {
        var newParent = tower.parent.parent;
        newParent.children[treeI(oldParent)] = tower;
        oldParent.children = [];
        update(newParent);
        update(oldParent);
        killSymbol(oldParent);
    } else if (leftDepth < 0 && rightDepth >= 0) {
        var newParent = tower.parent.parent;
        newParent.children.splice(treeI(oldParent), 0, tower);
        oldParent.children.shift();
        update(oldParent);
        update(newParent);
    } else if (leftDepth >= 0 && rightDepth < 0) {
        var newParent = tower.parent.parent;
        newParent.children.splice(treeI(oldParent) + 1, 0, tower);
        oldParent.children.pop();
        update(oldParent);
        update(newParent);
    } else {  // leftDepth >= 0 && rightDepth >= 0
        var newParent = tower.parent.parent;
        var splitChildren = oldParent.children.slice(treeI(tower) + 1);
        var split = createView(createSymbol(), {children: splitChildren});
        oldParent.children = oldParent.children.slice(0, treeI(tower));
        newParent.children.splice(treeI(oldParent) + 1, 0, split);
        newParent.children.splice(treeI(oldParent) + 1, 0, tower);
        update(oldParent);
        update(newParent);
        update(split);
    }
};

var maybeSwapTower = function (info) {
    var swapped = false;
    var diffX = info.absDiff[0];
    var dir = info.direction[0];
    var neighbor;
    while (true) {
        if (dir < 0) {
            neighbor = previousTower(state.targets[0]);
        } else {
            neighbor = nextTower(state.targets[state.targets.length - 1]);
        }
        neighbor = neighbor && neighbor[0];
        if (neighbor && diffX >= neighbor.w / 2 && diffX > minMoveX) {
            swapped = true;
            swapTargetTowers(neighbor, info);
            diffX -= neighbor.w;
        } else {
            break;
        }
    }
    return swapped;
};

var swapTargetTowers = function (neighbor, info) {
    if (info.direction[0] < 0) {
        _(state.targets.length).times(function () {
            swapTower(neighbor);
        });
    } else {
        for (var i = state.targets.length - 1; i >= 0; i--) {
            swapTower(state.targets[i]);
        }
    }
};

var swapTower = function (tower) {
    var rightTower = nextTower(tower);
    var rightDepth = rightTower[1];
    rightTower = rightTower[0];
    var towerI = treeI(tower);
    var rightI = treeI(rightTower);
    var oldParent = tower.parent;
    rightTower.parent.children[rightI] = tower;
    tower.parent.children[towerI] = rightTower;
    update(rightTower.parent);
    update(oldParent);

    var absDepthDiff = Math.abs(rightDepth);
    var up = rightDepth > 0 ? tower : rightTower;
    var down = rightDepth > 0 ? rightTower : tower;
    _(absDepthDiff).times(function () { moveTowerDown(down) });
    _(absDepthDiff).times(function () { moveTowerUp(up) });
};

// TODO: make it work with multiple targets.
var dragTree = function (info) {
    var node = state.moving;
    var depthChange = calculateDepthChange(info);

    if (depthChange <= -1) {
        _(-depthChange).times(function () {
            moveTreeUp(node);
        });
    } else if (depthChange >= 1) {
        var i = treeI(node);
        var oldParent = node.parent;
        var siblings = node.parent.children;
        var first = siblingSymbol(node, info.direction[0]);
        var second = siblingSymbol(node, -info.direction[0]);
        var descend = _.find([first, second], function (node) {
            return node && node.branch;
        });
        if (descend) {
            if (treeI(descend) < i) {
                descend.children.push(node);
            } else {
                descend.children.unshift(node);
            }
            siblings.splice(i, 1);
            updateTree(descend);
            updateTree(oldParent);
            maybeKillView(oldParent);
            positionAfterMove();
        } else {
            depthChange = 0;
        }
    }

    var swapped = maybeSwapTree(node.parent, movingInfo());
    if (swapped) {
        positionAfterMove();
    }
    return depthChange !== 0 || swapped;
};

var moveTreeUp = function (node) {
    if (!node.parent.parent) {
        return;
    }
    var oldParent = node.parent;
    var newParent = node.parent.parent;
    oldParent.children.splice(treeI(node), 1);
    newParent.children.splice(treeI(oldParent), 0, node);
    updateTree(newParent);
    updateTree(oldParent);
    maybeKillView(oldParent);
    positionAfterMove();
};

var maybeSwapTree = function (parent, info) {
    var siblings = _.filter(parent.children, _.property('symbol'));
    var swapped = false;
    var diffX = info.absDiff[0];
    var dir = info.direction[0];
    var len = state.targets.length;
    var movingI = _.indexOf(siblings, state.targets[dir < 0 ? 0 : len - 1]);
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
    if (swapped) {
        parent.children = siblings;
        updateTree(parent);
    }
    return swapped;
};

var calculateDepthChange = function (info) {
    return Math.round(info.diff[1] / depthHeight);
};
