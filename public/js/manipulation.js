var minMoveX = 15;

var targetingInit = function () {
    targeting = {
        target: null,
        moving: null,
        hovering: null,
        mode: null,
        movingMode: null,
        hoveringMode: null,
        lastTarget: null,
        lastMoving: null,
        lastHovering: null,
    };
};

var updateTarget = function (kind, symbol, mode) {
    if (kind === 'hovering') {
        targeting.lastHovering = targeting.hovering;
        targeting.hovering = symbol;
        targeting.hoveringMode = mode;
    }
    if (kind === 'moving') {
        targeting.lastMoving = targeting.moving;
        targeting.moving = symbol
        targeting.movingMode = mode;
    }
    var target = targeting.moving || targeting.hovering;
    var targetMode = targeting.movingMode || targeting.hoveringMode;
    var updated = (target !== targeting.target || targetMode !== targeting.mode);
    targeting.lastTarget = targeting.target;
    targeting.target = target;
    targeting.mode = targetMode;
    return updated;
};

var deleteTarget = function () {
    var target = targeting.target;
    if (!target) {
        return;
    }
    if (target.token) {
        allTokens.splice(target.tokenI, 1);
        computeStructure('tower');
    } else if (target.parent) {
        target.parent.children.splice(target.treeI, 1);
        computeStructure('symbol');
    }
    if (target === targeting.hovering) {
        updateTarget('hovering', null, null);
    }
    if (target === targeting.moving) {
        updateTarget('moving', null, null);
    }
    draw(false);
};

var movingInfo = function () {
    var startMouse = targeting.moving.startMouse;
    var diff = [mouse[0] - startMouse[0], mouse[1] - startMouse[1]];
    return {
        diff: diff,
        direction: [diff[0] >= 0 ? 1 : -1, diff[1] >= 0 ? 1 : -1],
        absDiff: [Math.abs(diff[0]), Math.abs(diff[1])],
        mode: targeting.movingMode,
    };
};

var startMoving = function () {
    if (targeting.moving) {
        return;
    }
    var moving = targeting.hovering;
    moving.startMouse = mouse;
    moving.startTime = Date.now();
    var updated = updateTarget('moving', moving, targeting.hoveringMode);
    if (updated) {
        draw();
    }
};

var stopMoving = function (s) {
    var updated = updateTarget('moving', null, null);
    if (updated) {
        draw();
    }
};

var dragMoving = function () {
    var moving = targeting.moving;
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

    if (!moved) {
        draw(movingSelection());
    } else {
        draw();
    }
};

var positionAfterMove = function (moving, mode) {
    var currentPos = {x: moving.x, y: moving.y};
    computeStructure(mode);
    var sel = fullSelection(false);
    computePositions(sel);
    moving.startMouse = [
        moving.startMouse[0] + moving.x - currentPos.x,
        moving.startMouse[1] + moving.y - currentPos.y,
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
