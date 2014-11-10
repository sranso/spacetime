var minMoveX = 15;

var movingInfo = function () {
    var startMouse = moving.startMouse;
    var diff = [mouse[0] - startMouse[0], mouse[1] - startMouse[1]];
    return {
        diff: diff,
        direction: [diff[0] >= 0 ? 1 : -1, diff[1] >= 0 ? 1 : -1],
        absDiff: [Math.abs(diff[0]), Math.abs(diff[1])],
        mode: movingMode(),
    };
};

var movingMode = function () {
    if (!moving || !active('moving')) {
        return 'none';
    }
    return moving.token  ? 'token' : 'symbol';
};

var startMoving = function (s) {
    if (!moving) {
        moving = s;
        moving.startMouse = mouse;
        moving.startTime = Date.now();
        draw();
    }
};

var stopMoving = function (s) {
    if (moving) {
        moving = null;
        draw();
    }
};

var dragMoving = function () {
    if (!moving) {
        return;
    }

    var info = movingInfo();
    var moved;

    if (info.mode === 'token') {
        moved = dragToken(info);
    } else {
        moved = dragSymbol(info);
    }

    if (!moved) {
        draw(movingSelection());
    } else {
        draw();
    }
};

var positionAfterMove = function (mode) {
    var currentPos = {x: moving.x, y: moving.y};
    computeStructure(mode);
    var sel = fullSelection(false);
    computePositions(sel);
    moving.startMouse = [
        moving.startMouse[0] + moving.x - currentPos.x,
        moving.startMouse[1] + moving.y - currentPos.y,
    ];
};

var dragToken = function (info) {
    var levels = dragLevel(info);
    moving.level = levels[0];

    var swapped = maybeSwap(allTokens, 'tokenI', info);
    var moved = (levels[0] !== levels[1]) || swapped;
    if (moved) {
        positionAfterMove(info.mode);
    }
    return moved;
};

var maybeSwap = function (siblings, index, info) {
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

var dragSymbol = function (info) {
    var levels = dragLevel(info);

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
        positionAfterMove(info.mode);
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
            positionAfterMove(info.mode);
        } else {
            levelChange = 0;
        }
    }

    var swapped = maybeSwap(moving.parent.children, 'treeI', movingInfo());
    if (swapped) {
        positionAfterMove(info.mode);
    }
    return levelChange !== 0 || swapped;
};

var dragLevel = function (info) {
    var previousLevel = moving.level;
    var levelChange = Math.round(info.diff[1] / levelHeight);
    var newLevel = previousLevel + levelChange;
    if (newLevel <= 0) {
        newLevel = 1;
    }
    return [newLevel, previousLevel];
};
