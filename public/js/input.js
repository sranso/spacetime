var keyForEvent = function () {
    return keyMap[d3.event.keyCode];
};

var inputEvent = function (key, eventType) {
    if ((key === 'backspace' || key === 'tab') && eventType === 'down') {
        keypressEvent(null, key);
    }

    if (targeting.inserting) {
        return;
    }
    if (key === 'left mouse' || key === '6') {
        if (eventType === 'down') {
            startMoving();
            d3.event.preventDefault();
        } else {
            stopMoving();
        }
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
    var inserting = targeting.inserting;
    if (!inserting) {
        return;
    }
    var info = movingInfo();
    var diff = info.absDiff[0] + info.absDiff[1];
    if (diff >= 3) {
        removeEmptyText(inserting);
        updateTarget({inserting: null, insertingMode: null});
        return true;
    }
};

var keypressEvent = function (keyCode, key) {
    key = key || String.fromCharCode(keyCode);
    d3.event.preventDefault();
    var inserting = targeting.inserting;
    var firstInserting = false;
    if (!inserting) {
        firstInserting = true;
        var target = targeting.target;
        if (!target) {
            return;
        }
        inserting = target;
        updateTarget({
            inserting: inserting,
            insertingMode: targeting.mode,
            startMouse: mouse,
        });
    }
    var siblings = inserting.parent && inserting.parent.children;

    if (key === '3') { // delete
        if (inserting === targeting.hovering) {
            updateTarget({hovering: null, hoveringMode: null});
        }
        if (inserting === targeting.moving) {
            updateTarget({moving: null, movingMode: null});
        }
        if (targeting.mode === 'tower') {
            allTokens.splice(inserting.tokenI, 1);
            inserting = allTokens[inserting.tokenI];
            updateTarget({inserting: inserting});
            computeStructure('tower');
        } else if (siblings) {
            siblings.splice(inserting.treeI, 1);
            inserting = siblings[inserting.treeI];
            updateTarget({inserting: inserting});
            computeStructure('symbol');
        }

    } else if (_.contains([' ', '(', ')'], key)) {
        if (targeting.mode === 'symbol') {
            if (inserting.token) {
                updateTarget({insertingMode: 'tower'});
            }
        }
        var level = inserting.level;
        if (inserting.bar || inserting.text) {
            var insert = createToken({level: level, text: ''});
            if (targeting.mode === 'tower') {
                allTokens.splice(inserting.tokenI + 1, 0, insert);
            } else {
                siblings.splice(inserting.treeI + 1, 0, insert);
            }
            computeStructure(targeting.mode);
            updateTarget({inserting: insert, insertingMode: 'tower'});
            inserting = insert;
        } else if (key === '(') {
            var before = allTokens[inserting.tokenI - 1];
            if (before.level > inserting.level) {
                var insert = createToken({level: level, separator: true});
                allTokens.splice(inserting.tokenI, 0, insert);
            }
        }
        if (key === '(') {
            level += 1;
        } else if (key === ')') {
            level = Math.max(1, level - 1);
        }
        inserting.level = level;
        computeStructure('tower');

    } else if (key === 'tab') {
        if (inserting.token) {
            updateTarget({insertingMode: 'tower'});
        } else {
            return; // TODO
        }
        var level = inserting.level;
        var tokenI = inserting.tokenI;
        if (!inserting.text) {
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
        updateTarget({inserting: insert});
        computeStructure('tower');

    } else if (_.contains(['<', '>', '1', '4'], key)) {
        if (targeting.mode === 'symbol') {
            if (inserting.token) {
                updateTarget({insertingMode: 'tower'});
            } else {
                return; // TODO
            }
        }
        var level = inserting.level;
        if (key === '<' || key === '1') {
            level += 1;
        } else if (key === '>' || key === '4') {
            level = Math.max(1, level - 1);
        }
        inserting.level = level;
        computeStructure('tower');

    } else if (key === '`' || key === '5') {
        var dir = key === '`' ? -1 : +1;
        var insert;
        if (removeEmptyText(inserting)) {
            dir = 0;
        }
        if (targeting.mode === 'tower') {
            insert = allTokens[inserting.tokenI + dir];
            if (!insert) {
                // TODO
            }
        } else {
            insert = siblings[inserting.treeI + dir];
            if (!insert) {
                // TODO
            }
        }
        updateTarget({inserting: insert});

    } else if (key === 'backspace') {
        if (targeting.mode === 'symbol') {
            if (inserting.token) {
                updateTarget({insertingMode: 'tower'});
            } else {
                return; // TODO
            }
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

    } else if (key === '2') {
        var cloned = cloneTree(inserting);
        if (!siblings) {
            return; // TODO
        }
        siblings.splice(inserting.treeI + 1, 0, cloned);
        updateTarget({inserting: cloned});
        computeStructure(targeting.mode);
    } else if (key === '6') {
        // do nothing
    } else {
        var text = firstInserting ? '' : inserting.text;
        text += key;
        inserting.text = text;
        textWidth(inserting, {recompute: true});
    }
    draw();
};

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
