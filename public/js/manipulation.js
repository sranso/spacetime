var minMoveX = 15;

var targetingInit = function () {
    targeting = {
        target: null,
        inserting: null,
        moving: null,
        hovering: null,
        startMouse: null,
        mode: null,
        kind: null,
        movingMode: null,
        hoveringMode: null,
        insertingMode: null,
        lastTarget: null,
        lastHovering: null,
        inCamera: false,
    };
};

var updateTarget = function (update) {
    if (_.has(update, 'inCamera')) {
        targeting.inCamera = update.inCamera;
    }
    if (_.has(update, 'startMouse')) {
        targeting.startMouse = update.startMouse;
    }
    if (_.has(update, 'hovering')) {
        targeting.lastHovering = targeting.hovering;
        targeting.hovering = update.hovering;
        targeting.hoveringMode = update.hoveringMode;
    }
    if (_.has(update, 'moving')) {
        targeting.moving = update.moving;
        targeting.movingMode = update.movingMode;
    }
    if (_.has(update, 'inserting')) {
        targeting.inserting = update.inserting;
        targeting.insertingMode = update.insertingMode;
    }
    var target = targeting.inserting || targeting.moving || targeting.hovering;
    var targetMode = targeting.insertingMode || targeting.movingMode || targeting.hoveringMode;
    var targetKind = (
        targeting.inserting && 'inserting' ||
        targeting.moving && 'moving' ||
        targeting.hovering && 'hovering'
    );
    var updated = (target !== targeting.target || targetMode !== targeting.mode || targetKind !== targeting.kind);
    targeting.lastTarget = targeting.target;
    targeting.target = target;
    targeting.mode = targetMode;
    targeting.kind = targetKind;
    return updated;
};

var mouseDown = function () {
    mouse = d3.mouse(camera.node());
    updateHovering();
    inputEvent('left mouse', 'down');
};

var mouseMove = function () {
    mouse = d3.mouse(camera.node());
    dragMoving();
    maybeStopInserting();
    updateHovering();
};

var mouseUp = function () {
    mouse = d3.mouse(camera.node());
    inputEvent('left mouse', 'up');
    if (targeting.inCamera) {
        updateHovering();
    }
};

var mouseLeave = function () {
    var updated = updateTarget({
        hovering: null,
        hoveringMode: null,
        inCamera: false,
    });
    if (updated) {
        draw();
    }
};

var mouseEnter = function () {
    updateTarget({inCamera: true});
};

var updateHovering = function () {
    var under = findUnderMouse() || [null, null];
    var updated = updateTarget({hovering: under[0], hoveringMode: under[1]});
    if (updated) {
        draw();
    }
};

var deleteTarget = function () {
    var target = targeting.target;
    if (!target) {
        return;
    }
    if (targeting.mode === 'tower') {
        allTokens.splice(target.tokenI, 1);
        computeStructure('tower');
    } else if (target.parent) {
        target.parent.children.splice(target.treeI, 1);
        computeStructure('symbol');
    }
    if (target === targeting.hovering) {
        updateTarget({hovering: null, hoveringMode: null});
    }
    if (target === targeting.moving) {
        updateTarget({moving: null, movingMode: null});
    }
    draw();
    updateHovering();
};

var startInserting = function () {
    var target = targeting.target;
    if (!target) {
        return;
    }
    var end = target.bar ? target.end : target;
    newInsertingAt(target.level, end.tokenI + 1);
    computeStructure('tower');
    draw();
};

var maybeStopInserting = function () {
    var inserting = targeting.inserting;
    if (!inserting) {
        return;
    }
    var info = movingInfo();
    var diff = info.absDiff[0] + info.absDiff[1];
    if (diff > 5) {
        if (!inserting.text) {
            allTokens.splice(inserting.tokenI, 1);
            computeStructure('tower');
        }
        updateTarget({inserting: null, insertingMode: null});
    }
};

var insertionEvent = function (keyCode) {
    var inserting = targeting.inserting;
    if (inserting) {
        var character = String.fromCharCode(keyCode);
        if (_.contains([' ', '(', ')'], character)) {
            var level = inserting.level;
            if (character === '(') {
                level += 1;
            } else if (character === ')') {
                level -= 1;
            }
            if (inserting.text) {
                newInsertingAt(level, inserting.tokenI + 1);
            } else {
                inserting.level = level
            }
            computeStructure('tower');
        } else if (character === ',') {
            var level = inserting.level;
            var tokenI = inserting.tokenI;
            if (!inserting.text) {
                allTokens.splice(tokenI, 1);
            } else {
                tokenI += 1;
            }
            var sep = createToken({level: level - 1, separator: true});
            allTokens.splice(tokenI, 0, sep);
            newInsertingAt(level, tokenI + 1);
            computeStructure('tower');
        } else {
            var text = inserting.text + character;
            inserting.text = text;
            textWidth(inserting, {recompute: true});
        }
        draw();
        d3.event.preventDefault();
    }
};

var newInsertingAt = function (level, tokenI) {
    var insert = createToken({level: level, text: ''});
    allTokens.splice(tokenI, 0, insert);
    updateTarget({
        inserting: insert,
        insertingMode: 'tower',
        startMouse: mouse,
    });
};

var backspaceInserting = function () {
    var inserting = targeting.inserting;
    if (!inserting) {
        return;
    }

    var text = inserting.text;
    if (text) {
        text = text.slice(0, text.length - 1);
        inserting.text = text;
        textWidth(inserting, {recompute: true});
    } else {
        allTokens.splice(inserting.tokenI, 1);
        inserting = allTokens[inserting.tokenI - 1];
        var insertingMode = inserting ? 'tower' : null;
        updateTarget({
            inserting: inserting,
            insertingMode: insertingMode,
            startMouse: mouse,
        });
        computeStructure('tower');
    }
    draw();
};
var movingInfo = function () {
    var startMouse = targeting.startMouse;
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
    var updated = updateTarget({
        moving: moving,
        movingMode: targeting.hoveringMode,
        startMouse: mouse,
    });
    if (updated) {
        draw();
    }
};

var stopMoving = function (s) {
    var updated = updateTarget({moving: null, movingMode: null});
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
        computeStructure(info.mode);
        draw();
    }
};

var positionAfterMove = function (moving, mode) {
    var currentPos = {x: moving.x, y: moving.y};
    computeStructure(mode);
    var sel = fullSelection(false);
    computePositions(sel);
    targeting.startMouse = [
        targeting.startMouse[0] + moving.x - currentPos.x,
        targeting.startMouse[1] + moving.y - currentPos.y,
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
