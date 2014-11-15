var minMoveX = 15;

var stateInit = function () {
    state = {
        target: null,
        inserting: null,
        moving: null,
        hovering: null,

        targetMode: null,
        movingMode: null,
        hoveringMode: null,
        insertingMode: null,

        doStructure: false,
        doPositions: false,
        doHovering: false,
        doDraw: false,
        doDataDraw: false,

        targetKind: null,
        startMouse: null,
        inCamera: false,
    };
    lastState = state;
};

var updateState = function (update) {
    _.extend(state, update);
    state.target = state.inserting || state.moving || state.hovering;
    state.targetMode = state.insertingMode || state.movingMode || state.hoveringMode;
    state.targetKind = (
        state.inserting && 'inserting' ||
        state.moving && 'moving' ||
        state.hovering && 'hovering'
    );
};

var doStuffAfterStateChanges = function () {
    if (state.doStructure) {
        computeStructure(state.doStructure);
    }
    if (state.doPositions) {
        computePositions(allSymbolTree);
    }
    if (state.doHovering) {
        computeHovering();
    }
    var updatedTarget = (
        state.target !== lastState.target ||
        state.targetMode !== lastState.targetMode ||
        state.targetKind !== lastState.targetKind
    );
    if (updatedTarget) {
        if (state.target) {
            computePositions(state.target);
        }
        if (lastState.target && !state.doDataDraw) {
            computePositions(lastState.target);
        }
    };
    if (state.doDraw || state.doDataDraw) {
        var sel = fullSelection(state.doDataDraw);
        draw(sel);
    }
};

var immediateDoStuffAfterStateChanges = function (callback) {
    lastState = state;
    state = _.clone(state);
    callback();
    doStuffAfterStateChanges();
};

var doStuffAroundStateChanges = function (callback) {
    return function () {
        var args = arguments;
        immediateDoStuffAfterStateChanges(function () {
            callback.apply(this, args);
        });
    };
};

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
    maybeStopInserting();
    updateState({doHovering: true});
});

var mouseEnter = doStuffAroundStateChanges(function () {
    mouse = d3.mouse(camera.node());
    updateState({inCamera: true, doHovering: true});
});

var mouseLeave = doStuffAroundStateChanges(function () {
    updateState({
        hovering: null,
        hoveringMode: null,
        inCamera: false,
    });
});

var mouseScroll = function () {
    var scrollX = document.body.scrollTop;
    cameraX = cameraStartX - scrollX;
    computeNonTreePositions();
    draw(nullSelection());
};


var movingInfo = function () {
    var startMouse = state.startMouse;
    var diff = [mouse[0] - startMouse[0], mouse[1] - startMouse[1]];
    return {
        diff: diff,
        direction: [diff[0] >= 0 ? 1 : -1, diff[1] >= 0 ? 1 : -1],
        absDiff: [Math.abs(diff[0]), Math.abs(diff[1])],
        mode: state.movingMode,
    };
};

var startMoving = function () {
    if (state.moving) {
        return;
    }
    var moving = state.hovering;
    updateState({
        moving: moving,
        movingMode: state.hoveringMode,
        startMouse: mouse,
    });
};

var stopMoving = function (s) {
    if (!state.moving) {
        return;
    }
    updateState({moving: null, movingMode: null});
    computePositions(lastState.moving);
};

var dragMoving = function () {
    var moving = state.moving;
    if (!moving) {
        return;
    }

    var info = movingInfo();
    var moved;

    if (info.mode === 'tower') {
        moved = dragTower(moving, info);
    } else {
        moved = dragSymbol(moving, info);
    }

    if (moved) {
        updateState({doStructure: info.mode});
    } else {
        computePositions(moving);
        draw(movingSelection());
    }
};

var positionAfterMove = function (moving, mode) {
    var currentPos = {x: moving.x, y: moving.y};
    computeStructure(mode);
    computePositions(allSymbolTree);
    state.startMouse = [
        state.startMouse[0] + moving.x - currentPos.x,
        state.startMouse[1] + moving.y - currentPos.y,
    ];
};

var dragTower = function (moving, info) {
    var levels = dragLevel(moving, info);
    moving.level = levels[0];

    var swapped = maybeSwap(moving, allTokens, 'tokenI', info);
    var moved = (levels[0] !== levels[1]) || swapped;
    if (moved) {
        positionAfterMove(moving, info.mode);
    }
    return moved;
};

var maybeSwap = function (moving, siblings, index, info) {
    var swapped = false;
    var movingI = moving[index];
    var diffX = info.absDiff[0];
    while (true) {
        var neighborI = movingI + info.direction[0];
        var neighborSymbol = siblings[neighborI];
        if (neighborSymbol && diffX >= neighborSymbol.w / 2 && diffX > minMoveX) {
            swapped = true;
            siblings[movingI] = neighborSymbol;
            siblings[neighborSymbol[index]] = moving;
            movingI = neighborI;
            diffX -= neighborSymbol.w;
        } else {
            break;
        }
    }
    return swapped;
}

var dragSymbol = function (moving, info) {
    var levels = dragLevel(moving, info);

    var levelChange = levels[0] - levels[1];
    if (levelChange <= -1) {
        moving.parent.children.splice(moving.treeI, 1);
        var n = new Array(-levelChange);
        var insertBefore = _.reduce(n, _.property('parent'), moving);
        var newSiblings = insertBefore.parent.children;
        var before = newSiblings.slice(0, insertBefore.treeI);
        var after = newSiblings.slice(insertBefore.treeI);
        newSiblings = before.concat([moving]).concat(after);
        insertBefore.parent.children = newSiblings;
        positionAfterMove(moving, info.mode);
    } else if (levelChange >= 1) {
        var siblings = moving.parent.children;
        var neighborI = moving.treeI + info.direction[0];
        var firstNeighbor = siblings[neighborI];
        neighborI = moving.treeI - info.direction[0];
        var secondNeighbor = siblings[neighborI];
        var descendNeighbor = _.find([firstNeighbor, secondNeighbor], function (n) {
            return n && n.bar;
        });
        if (descendNeighbor) {
            siblings.splice(moving.treeI, 1);
            if (descendNeighbor.treeI > moving.treeI) {
                descendNeighbor.children.unshift(moving);
            } else {
                descendNeighbor.children.push(moving);
            }
            positionAfterMove(moving, info.mode);
        } else {
            levelChange = 0;
        }
    }

    var swapped = maybeSwap(moving, moving.parent.children, 'treeI', movingInfo());
    if (swapped) {
        positionAfterMove(moving, info.mode);
    }
    return levelChange !== 0 || swapped;
};

var dragLevel = function (moving, info) {
    var previousLevel = moving.level;
    var levelChange = Math.round(info.diff[1] / levelHeight);
    var newLevel = previousLevel + levelChange;
    if (newLevel <= 0) {
        newLevel = 1;
    }
    return [newLevel, previousLevel];
};
