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

var changeSelection = function () {
    var begin = state.selectionBegin;
    if (!begin) {
        return;
    }
    var end = findFromSiblings(allTowers, mouse[0]);
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
        updateState({doStructure: state.targetMode});
    } else {
        _.each(state.targets, computePositions);
        draw(movingSelection());
    }
};

var positionAfterMove = function () {
    var currentPos = {x: state.moving.x, y: state.moving.y};
    computeStructure(state.targetMode);
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
    // _.each(state.targets, function (target) {
    //     target.depth = target.depth + depthChange;
    //     if (target.depth <= 0) {
    //         target.depth = 1;
    //     }
    // });

    // var swapped = maybeSwap(allTowers, 'towerI', info);
    // var moved = depthChange || swapped;
    if (moved) {
        positionAfterMove();
    }
    return moved;
};

var moveTowerDown = function (tower) {
    var leftTower = allTowers[tower.towerI - 1];
    var rightTower = allTowers[tower.towerI + 1];
    var leftDepth = leftTower ? leftTower.depth : 0;
    var rightDepth = rightTower ? rightTower.depth : 0;
    var siblings = tower.parent.children;
    if (tower.depth >= leftDepth && tower.depth >= rightDepth) {
        var newParent = createView(createSymbol(), {children: [tower]});
        siblings[tower.treeI] = newParent;
        updateSymbol(tower.parent);
        updateSymbol(newParent);
    } else if (tower.depth >= leftDepth && tower.depth < rightDepth) {
        var newParent = siblings[tower.treeI + 1];
        siblings.splice(tower.treeI, 1);
        newParent.children.unshift(tower);
        updateSymbol(tower.parent);
        updateSymbol(newParent);
    } else if (tower.depth < leftDepth && tower.depth >= rightDepth) {
        var newParent = siblings[tower.treeI - 1];
        siblings.splice(tower.treeI, 1);
        newParent.children.push(tower);
        updateSymbol(tower.parent);
        updateSymbol(newParent);
    } else {  // tower.depth < leftDepth && tower.depth < rightDepth
        var newParent = siblings[tower.treeI - 1];
        var merge = siblings[tower.treeI + 1];
        newParent.children.push(tower);
        newParent.children = newParent.children.concat(merge.children);
        merge.children = [];
        siblings.splice(tower.treeI, 2);
        updateSymbol(tower.parent);
        updateSymbol(newParent);
        updateSymbol(merge);
        killView(merge);
    }
};

var moveTowerUp = function (tower) {
    if (tower.depth <= 1) {
        return;
    }
    var leftTower = allTowers[tower.towerI - 1];
    var rightTower = allTowers[tower.towerI + 1];
    var leftDepth = leftTower ? leftTower.depth : 0;
    var rightDepth = rightTower ? rightTower.depth : 0;
    if (tower.depth > leftDepth && tower.depth > rightDepth) {
        var newParent = tower.parent.parent;
        newParent.children[tower.parent.treeI] = tower;
        tower.parent.children = [];
        updateSymbol(newParent);
        updateSymbol(tower.parent);
        killSymbol(tower.parent);
    } else if (tower.depth > leftDepth && tower.depth <= rightDepth) {
        var newParent = tower.parent.parent;
        newParent.children.splice(tower.parent.treeI, 0, tower);
        tower.parent.children.shift();
        updateSymbol(tower.parent);
        updateSymbol(newParent);
    } else if (tower.depth <= leftDepth && tower.depth > rightDepth) {
        var newParent = tower.parent.parent;
        newParent.children.splice(tower.parent.treeI + 1, 0, tower);
        tower.parent.children.pop();
        updateSymbol(tower.parent);
        updateSymbol(newParent);
    } else {  // tower.depth <= leftDepth && tower.depth <= rightDepth
        var newParent = tower.parent.parent;
        var splitChildren = tower.parent.children.slice(tower.treeI + 1);
        var split = createView(createSymbol(), {children: splitChildren});
        tower.parent.children = tower.parent.children.slice(0, tower.treeI);
        newParent.children.splice(tower.parent.treeI + 1, 0, split);
        newParent.children.splice(tower.parent.treeI + 1, 0, tower);
        updateSymbol(tower.parent);
        updateSymbol(newParent);
        updateSymbol(split);
    }
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

var dragTree = function (info) {
    var moving = state.moving;
    var depthChange = calculateDepthChange(info);
    if (moving.depth + depthChange <= 0) {
        depthChange = 1 - moving.depth;
    }

    if (depthChange <= -1) {
        moving.parent.children.splice(moving.treeI, 1);
        updateSymbol(moving.parent);
        var n = new Array(-depthChange);
        var insertBefore = ancestor(moving, -depthChange);
        var newSiblings = insertBefore.parent.children;
        var before = newSiblings.slice(0, insertBefore.treeI);
        var after = newSiblings.slice(insertBefore.treeI);
        newSiblings = before.concat([moving]).concat(after);
        insertBefore.parent.children = newSiblings;
        updateSymbol(insertBefore.parent);
        maybeKillView(moving.parent);
        positionAfterMove();
    } else if (depthChange >= 1) {
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
            updateSymbol(moving.parent);
            if (descendNeighbor.treeI > moving.treeI) {
                descendNeighbor.children.unshift(moving);
            } else {
                descendNeighbor.children.push(moving);
            }
            updateSymbol(descendNeighbor);
            maybeKillView(moving.parent);
            positionAfterMove();
        } else {
            depthChange = 0;
        }
    }

    var swapped = maybeSwap(moving.parent.children, 'treeI', movingInfo());
    if (swapped) {
        updateSymbol(moving.parent);
        positionAfterMove();
    }
    return depthChange !== 0 || swapped;
};

var calculateDepthChange = function (info) {
    return Math.round(info.diff[1] / depthHeight);
};
