var qwertyKeyMap = {
      8: 'backspace',
      9: 'tab',
     13: 'enter',
     16: 'shift',
     17: 'ctrl',
     18: 'alt',
     19: 'pause/break',
     20: 'caps lock',
     27: 'escape',
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

var dvorakKeyMap = _.extend({}, qwertyKeyMap, {
     65: 'A',
     88: 'B',
     74: 'C',
     69: 'D',
    190: 'E',
     85: 'F',
     73: 'G',
     68: 'H',
     67: 'I',
     72: 'J',
     84: 'K',
     78: 'L',
     77: 'M',
     66: 'N',
     82: 'O',
     76: 'P',
    222: 'Q',
     80: 'R',
     79: 'S',
     89: 'T',
     71: 'U',
     75: 'V',
    188: 'W',
     81: 'X',
     70: 'Y',
    186: 'Z',
     83: ';',
    221: '=',
     87: ',',
    219: '-',
     86: '.',
     90: '/',
    192: '`',
    191: '[',
    220: '\\',
    187: ']',
    189: "'",
});

var keyRemaps = {
    'default': {
        'B': 'left mouse',
    },
};

var keyMap = {
    qwerty: qwertyKeyMap,
    dvorak: dvorakKeyMap,
};

var keyAssignments = {
    startMoving: ['$down', '$:left mouse'],
    stopMoving: ['$up', '$:left mouse'],
    moving: ['left mouse'],
    oppositeMoving: ['shift', 'left mouse'],
    oppositeMovingToggle: ['$:shift', 'shift', 'left mouse'],
    debug: ['$down', 'D'],
};

var keyboardLayout, keysDown, lastKeysDown;

var keyInit = function () {
    keyboardLayout = 'dvorak';
    keyRemap = 'default';
    keysDown = {'$firing': false, '$key': 'left mouse', '$down': false, '$up': false, '$:left mouse': true};
    lastKeysDown = keysDown;
};

var keyForEvent = function () {
    var key = keyMap[keyboardLayout][d3.event.keyCode];
    var remapped = keyRemaps[keyRemap][key];
    return remapped == null ? key : remapped;
};

var inputEvent = function (key, eventType) {
    lastKeysDown = keysDown;
    var pressed = _.filter(_.pairs(lastKeysDown), function (p) {
        return p[1] && p[0][0] !== '$';
    })
    keysDown = _.object(pressed);
    keysDown['$' + eventType] = true;
    if (key) {
        keysDown['$:' + key] = true;
        keysDown[key] = eventType === 'down';
    }
    keysDown['$firing'] = true;

    if (active('startMoving')) {
        if (hovering) { startMoving(hovering) }
    } else if (active('stopMoving')) {
        stopMoving();
    } else if (active('debug')) {
        debugger;
    } else if (toggled('oppositeMovingToggle')) {
        changeMode();
        dragMoving(true);
    }

    keysDown['$firing'] = false;
};

var active = function (action, keys) {
    keys = keys || keysDown;
    var combo = keyAssignments[action];
    return _.every(combo, function (key) { return keys[key]; });
};

var triggered = function (action) {
    return active(action, keysDown) && !active(action, lastKeysDown);
};

var toggled = function (action) {
    return active(action, keysDown) != active(action, lastKeysDown);
};
