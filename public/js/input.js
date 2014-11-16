var keyForEvent = function () {
    return keyMap[d3.event.keyCode];
};

var inputEvent = function (key, eventType) {
    if ((key === 'backspace' || key === 'tab') && eventType === 'down') {
        keypressEvent(null, key);
    }

    if (key === '\\') {
        debugger;
    }
    if (state.inserting) {
        return;
    }
    if (key === 'left mouse' || key === '6') {
        immediateDoStuffAfterStateChanges(function () {
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
        });
    }
};

var removeEmptyText = function (inserting) {
    if (inserting.token && !inserting.separator && !inserting.text) {
        allTokens.splice(inserting.tokenI, 1);
        computeStructure('tower');
        return true;
    }
};

var maybeStopInserting = function () {
    var inserting = state.inserting;
    if (!inserting) {
        return;
    }
    var info = movingInfo();
    var diff = info.absDiff[0] + info.absDiff[1];
    if (diff >= 3) {
        removeEmptyText(inserting);
        updateState({inserting: null});
    }
};

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
        });
    }
    var siblings = ins.parent && ins.parent.children;

    if (key === '3') { // delete
        if (ins === state.hovering) {
            updateState({hovering: null, hoveringMode: null});
        }
        if (ins === state.moving) {
            updateState({moving: null, movingMode: null});
        }
        if (state.targetMode === 'tower') {
            allTokens.splice(ins.tokenI, 1);
            ins = allTokens[ins.tokenI];
            updateState({inserting: ins, doStructure: 'tower'});
        } else if (siblings) {
            siblings.splice(ins.treeI, 1);
            ins = siblings[ins.treeI];
            updateState({inserting: ins, doStructure: 'symbol'});
        }

    } else if (_.contains([' ', '(', ')'], key)) {
        if (state.targetMode === 'symbol') {
            if (ins.token) {
                updateState({insertingMode: 'tower'});
            }
        }
        var level = ins.level;
        if (ins.bar || ins.text) {
            var insert = createToken({level: level, text: ''});
            if (state.targetMode === 'tower') {
                allTokens.splice(ins.tokenI + 1, 0, insert);
            } else {
                siblings.splice(ins.treeI + 1, 0, insert);
            }
            computeStructure(state.targetMode);
            updateState({inserting: insert, insertingMode: 'tower'});
            ins = insert;
        } else if (key === '(') {
            var before = allTokens[ins.tokenI - 1];
            if (before.level > ins.level) {
                var insert = createToken({level: level, separator: true});
                allTokens.splice(ins.tokenI, 0, insert);
            }
            updateState({doStructure: 'tower'});
        }
        if (key === '(') {
            level += 1;
        } else if (key === ')') {
            level = Math.max(1, level - 1);
        }
        if (level !== ins.level) {
            ins.level = level;
            updateState({doStructure: 'tower'});
        }

    } else if (key === 'tab') {
        if (ins.token) {
            updateState({insertingMode: 'tower'});
        } else {
            return; // TODO
        }
        var level = ins.level;
        var tokenI = ins.tokenI;
        if (!ins.text) {
            allTokens.splice(tokenI, 1);
        } else {
            tokenI += 1;
        }
        if (level === 1) {
            level = 2; // TODO
        }
        var sep = createToken({level: level - 1, separator: true});
        allTokens.splice(tokenI, 0, sep);
        tokenI += 1;
        var insert = createToken({level: level, text: ''});
        allTokens.splice(tokenI, 0, insert);
        updateState({inserting: insert, doStructure: 'tower'});

    } else if (_.contains(['<', '>', '1', '4'], key)) {
        if (state.targetMode === 'symbol') {
            if (ins.token) {
                updateState({insertingMode: 'tower'});
            } else {
                return; // TODO
            }
        }
        var level = ins.level;
        if (key === '<' || key === '1') {
            level += 1;
        } else if (key === '>' || key === '4') {
            level = Math.max(1, level - 1);
        }
        ins.level = level;
        updateState({doStructure: 'tower'});

    } else if (key === '`' || key === '5') {
        var dir = key === '`' ? -1 : +1;
        var insert;
        if (removeEmptyText(ins)) {
            dir = 0;
        }
        if (state.targetMode === 'tower') {
            insert = allTokens[ins.tokenI + dir];
            if (!insert) {
                // TODO
            }
        } else {
            insert = siblings[ins.treeI + dir];
            if (!insert) {
                // TODO
            }
        }
        updateState({inserting: insert});

    } else if (key === 'backspace') {
        if (state.targetMode === 'symbol') {
            if (ins.token) {
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
            updateState({doPositions: true});
        } else {
            allTokens.splice(ins.tokenI, 1);
            ins = allTokens[ins.tokenI - 1];
            var insertingMode = ins ? 'tower' : null;
            updateState({
                inserting: ins,
                insertingMode: insertingMode,
                startMouse: mouse,
                doStructure: 'tower',
            });
        }

    } else if (key === '2') {
        var cloned = cloneTree(ins);
        if (!siblings) {
            return; // TODO
        }
        siblings.splice(ins.treeI + 1, 0, cloned);
        updateState({inserting: cloned, doStructure: state.targetMode});
    } else if (key === '6') {
        // do nothing
    } else {
        var text = lastState.inserting ? ins.text : '';
        text += key;
        ins.text = text;
        textWidth(ins, {recompute: true});
        updateState({doPositions: true});
    }
});

var keyMap = {
      8: 'backspace',
      9: 'tab',
     13: 'enter',
     16: 'shift',
     17: 'ctrl',
     18: 'alt',
     19: 'pause/break',
     20: 'caps lock',
     27: 'escape',
     32: 'space',
     33: 'page up',
     34: 'page down',
     35: 'end',
     36: 'home',
     37: 'left arrow',
     38: 'up arrow',
     39: 'right arrow',
     40: 'down arrow',
     45: 'insert',
     46: 'delete',
     48: '0',
     49: '1',
     50: '2',
     51: '3',
     52: '4',
     53: '5',
     54: '6',
     55: '7',
     56: '8',
     57: '9',
     65: 'A',
     66: 'B',
     67: 'C',
     68: 'D',
     69: 'E',
     70: 'F',
     71: 'G',
     72: 'H',
     73: 'I',
     74: 'J',
     75: 'K',
     76: 'L',
     77: 'M',
     78: 'N',
     79: 'O',
     80: 'P',
     81: 'Q',
     82: 'R',
     83: 'S',
     84: 'T',
     85: 'U',
     86: 'V',
     87: 'W',
     88: 'X',
     89: 'Y',
     90: 'Z',
     91: 'left window key',
     92: 'right window key',
     93: 'select key',
     96: 'numpad 0',
     97: 'numpad 1',
     98: 'numpad 2',
     99: 'numpad 3',
    100: 'numpad 4',
    101: 'numpad 5',
    102: 'numpad 6',
    103: 'numpad 7',
    104: 'numpad 8',
    105: 'numpad 9',
    106: 'multiply',
    107: 'add',
    109: 'subtract',
    110: 'decimal point',
    111: 'divide',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    144: 'num lock',
    145: 'scroll lock',
    186: ';',
    187: '=',
    188: ',',
    189: '-',
    190: '.',
    191: '/',
    192: '`',
    219: '[',
    220: '\\',
    221: ']',
    222: "'",
};
