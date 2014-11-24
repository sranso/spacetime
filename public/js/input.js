var keyForEvent = function () {
    return keyMap[d3.event.keyCode];
};

var inputEvent = function (key, eventType) {
    if ((key === 'backspace' || key === 'tab') && eventType === 'down') {
        keypressEvent(null, key);
        return;
    } else if (key === '\\') {
        debugger;
        return;
    }

    immediateDoStuffAfterStateChanges(function () {
        if (key === 'shift') {
            if (eventType === 'down') {
                startSelection();
            } else {
                stopSelection();
            }

        } else if (key === 'left mouse' || key === '6') {
            if (eventType === 'down') {
                startMoving();
                d3.event.preventDefault();
                updateState({doHovering: true});
            } else {
                stopMoving();
                if (state.inCamera) {
                    updateState({doHovering: true});
                }
            }
        }
    });
};

var removeEmptyText = function (inserting) {
    if (inserting.tower && !inserting.divider && !inserting.text) {
        allTowers.splice(inserting.towerI, 1);
        computeStructure('tower');
        return true;
    }
};

var numberKeys = ['-','0','1','2','3','4','5','6','7','8','9','.'];

var keypressEvent = doStuffAroundStateChanges(function (keyCode, key) {
    key = key || String.fromCharCode(keyCode);
    d3.event.preventDefault();
    var ins = state.inserting;
    if (!ins) {
        var target = state.target;
        if (!target) {
            return;
        }
        ins = target;
        updateState({
            inserting: ins,
            insertingMode: state.targetMode,
            startMouse: mouse,
            firstInserting: true,
        });
    }
    var siblings = ins.parent && ins.parent.children;

    if (state.insertingNumber) {
        if (!_.contains(numberKeys, key)) {
            updateState({insertingNumber: false});
        }
    }

    // TODO: a lot of these need to handle a selection.
    // TODO: also make them all work for tree mode and branches.

    if (state.insertingNumber) {
        var text = ins.text;
        if (state.firstInserting) {
            text = key;
        } else {
            text += key;
        }
        ins.text = text;
        textWidth(ins, {recompute: true});
        updateState({
            doPositions: true,
            selection: null,
            firstInserting: false,
        });

    } else if (key === '#') {
        if (ins.branch || ins.divider) {
            return;
        }
        var num = (+ins.text + 1) || 0;
        ins.text = '' + num;
        textWidth(ins, {recompute: true});
        updateState({
            doPositions: true,
            insertingNumber: true,
            selection: null,
        });

    } else if (key === '3') { // delete
        if (_.contains(state.targets, state.hovering)) {
            updateState({hovering: null});
        }
        if (_.contains(state.targets, state.moving)) {
            updateState({moving: null});
        }
        if (state.targetMode === 'tower') {
            var nextIns = (
                nextTower(state.targets[state.targets.length - 1]) ||
                previousTower(state.targets[0])
            );
            _.each(state.targets, function (target) {
                while (target.parent.children.length > 1) {
                    moveTowerDown(target);
                }
                target.parent.children = [];
                update(target.parent);
                killView(target.parent);
            });
            updateState({
                inserting: nextIns && nextIns[0],
                doStructure: 'tower',
                selection: null,
            });
        } else if (siblings) {
            siblings.splice(ins.treeI, 1);
            update(ins.parent);
            maybeKillView(ins.parent);
            ins = siblings[ins.treeI];
            updateState({inserting: ins, doStructure: 'tree'});
        }

    } else if (_.contains([' ', '(', ')'], key)) {
        if (state.targetMode === 'tree') {
            if (ins.tower) {
                updateState({insertingMode: 'tower'});
            }
        }
        var depth = ins.depth;
        if (ins.branch || ins.text) {
            var insert = createTower({depth: depth, text: ''});
            if (state.targetMode === 'tower') {
                allTowers.splice(ins.towerI + 1, 0, insert);
            } else {
                siblings.splice(ins.treeI + 1, 0, insert);
            }
            computeStructure(state.targetMode);
            updateState({inserting: insert, insertingMode: 'tower'});
            ins = insert;
        } else if (key === '(') {
            var before = allTowers[ins.towerI - 1];
            if (before.depth > ins.depth) {
                var insert = createTower({depth: depth, divider: true});
                allTowers.splice(ins.towerI, 0, insert);
            }
            updateState({doStructure: 'tower'});
        }
        if (key === '(') {
            depth += 1;
        } else if (key === ')') {
            depth = Math.max(1, depth - 1);
        }
        if (depth !== ins.depth) {
            ins.depth = depth;
            updateState({doStructure: 'tower'});
        }
        updateState({selection: null});

    } else if (key === ',') {
        if (ins.tower) {
            updateState({insertingMode: 'tower'});
        } else {
            return; // TODO
        }
        var depth = ins.depth;
        var towerI = ins.towerI;
        if (!ins.text) {
            allTowers.splice(towerI, 1);
        } else {
            towerI += 1;
        }
        if (depth === 1) {
            depth = 2; // TODO
        }
        var divider = createTower({depth: depth - 1, divider: true});
        allTowers.splice(towerI, 0, divider);
        towerI += 1;
        var insert = createTower({depth: depth, text: ''});
        allTowers.splice(towerI, 0, insert);
        updateState({
            inserting: insert,
            doStructure: 'tower',
            selection: null,
        });

    } else if (key === 'tab') {
        if (!ins.reference && !ins.branch) {
            return;
        }
        if (ins.reference) {
            ins = siblings[ins.treeI] = ins.symbol.view;
        } else if (siblings) {
            var reference = createView(ins.symbol, {
                reference: true,
                text: ins.begin.text,
                tower: true,
            });
            siblings[ins.treeI] = reference;
            ins = reference;
        }
        updateState({
            inserting: ins,
            doStructure: 'tree',
            selection: null,
        });

    } else if (key === '[' || key === ']') {
        if (state.targetMode === 'tree') {
            if (ins.tower) {
                updateState({insertingMode: 'tower'});
            } else {
                return; // TODO
            }
        }
        var depth = ins.depth;
        if (key === '[') {
            depth += 1;
        } else if (key === ']') {
            depth = Math.max(1, depth - 1);
        }
        ins.depth = depth;
        updateState({doStructure: 'tower', selection: null});

    } else if (key === '`' || key === '5') {
        var dir = key === '`' ? -1 : +1;
        var insert;
        if (removeEmptyText(ins)) {
            dir = 0;
        }
        if (state.targetMode === 'tower') {
            insert = allTowers[ins.towerI + dir];
            if (!insert) {
                // TODO
            }
        } else {
            insert = siblings[ins.treeI + dir];
            if (!insert) {
                // TODO
            }
        }
        updateState({
            inserting: insert,
            firstInserting: true,
            selection: null,
        });

    } else if (key === 'backspace') {
        if (state.targetMode === 'tree') {
            if (ins.tower) {
                updateState({insertingMode: 'tower'});
            } else {
                return; // TODO
            }
        }
        var text = ins.text;
        if (text) {
            text = text.slice(0, text.length - 1);
            ins.text = text;
            textWidth(ins, {recompute: true});
            updateState({doPositions: true, selection: null});
        } else {
            allTowers.splice(ins.towerI, 1);
            ins = allTowers[ins.towerI - 1];
            var insertingMode = ins ? 'tower' : null;
            updateState({
                inserting: ins,
                insertingMode: insertingMode,
                startMouse: mouse,
                doStructure: 'tower',
                selection: null,
            });
        }

    } else if (key === '2') {  // clone
        var cloned = cloneTree(ins);
        if (!siblings) {
            return; // TODO
        }
        siblings.splice(ins.treeI + 1, 0, cloned);
        updateState({
            inserting: cloned,
            doStructure: 'tree',
            selection: null,
        });
    } else if (key === '6') {
        // do nothing
    } else {
        if (ins.branch || ins.divider) {
            return;
        }
        var text = state.firstInserting ? '' : ins.text;
        text += key;
        ins.text = text;
        textWidth(ins, {recompute: true});
        updateState({
            doPositions: true,
            firstInserting: false,
            selection: null,
        });
    }
});

var keyMap = {8: 'backspace', 9: 'tab', 13: 'enter', 16: 'shift', 17: 'ctrl', 18: 'alt', 19: 'pause/break', 20: 'caps lock', 27: 'escape', 32: 'space', 33: 'page up', 34: 'page down', 35: 'end', 36: 'home', 37: 'left arrow', 38: 'up arrow', 39: 'right arrow', 40: 'down arrow', 45: 'insert', 46: 'delete', 48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9', 65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z', 91: 'left window key', 92: 'right window key', 93: 'select key', 96: 'numpad 0', 97: 'numpad 1', 98: 'numpad 2', 99: 'numpad 3', 100: 'numpad 4', 101: 'numpad 5', 102: 'numpad 6', 103: 'numpad 7', 104: 'numpad 8', 105: 'numpad 9', 106: 'multiply', 107: 'add', 109: 'subtract', 110: 'decimal point', 111: 'divide', 112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6', 118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12', 144: 'num lock', 145: 'scroll lock', 186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: "'"};

