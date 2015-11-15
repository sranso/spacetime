var keyForEvent = function () {
    return keyMap[d3.event.keyCode];
};

var inputEvent = function (key, eventType) {
    if (key === '\\') {
        debugger;
        return;
    }
    if (key === 'tab' && eventType === 'down') {
        d3.event.preventDefault();
        keypressEvent(null, 'tab');
        return;
    }

    if (key === 'shift' || key === 'ctrl') {
        if (eventType === 'down') {
            startSelection();
        } else {
            stopSelection();
        }
    }
};

var keypressEvent = function (keyCode, key) {
    key = key || String.fromCharCode(keyCode);
    if (keyCode === 13) {
        key = 'enter';
    }

    key = keypressMap[key] || key;

    if (key === 'd' || key === 's') {
        browseSelectionHistory(key === 'd');
    } else if (key === 'tab') {
        toggleExpanded();
    } else if (key === 'c') {
        copySelectionSteps();
    }

    update();
};

var keyMap = {8: 'backspace', 9: 'tab', 13: 'enter', 16: 'shift', 17: 'ctrl', 18: 'alt', 19: 'pause/break', 20: 'caps lock', 27: 'escape', 32: 'space', 33: 'page up', 34: 'page down', 35: 'end', 36: 'home', 37: 'left arrow', 38: 'up arrow', 39: 'right arrow', 40: 'down arrow', 45: 'insert', 46: 'delete', 48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9', 65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z', 91: 'left window key', 92: 'right window key', 93: 'select key', 96: 'numpad 0', 97: 'numpad 1', 98: 'numpad 2', 99: 'numpad 3', 100: 'numpad 4', 101: 'numpad 5', 102: 'numpad 6', 103: 'numpad 7', 104: 'numpad 8', 105: 'numpad 9', 106: 'multiply', 107: 'add', 109: 'subtract', 110: 'decimal point', 111: 'divide', 112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6', 118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12', 144: 'num lock', 145: 'scroll lock', 186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: "'"};

var qwertyKeypressMap = { 'q': 'q', 'w': 'w', 'e': 'e', 'r': 'r', 't': 't', 'a': 'a', 's': 's', 'd': 'd', 'f': 'f', 'g': 'g', 'z': 'z', 'x': 'x', 'c': 'c', 'v': 'v', 'b': 'b'};

var dvorakKeypressMap = { "'": 'q', ',': 'w', '.': 'e', 'p': 'r', 'y': 't', 'a': 'a', 'o': 's', 'e': 'd', 'u': 'f', 'i': 'g', ';': 'z', 'q': 'x', 'j': 'c', 'k': 'v', 'x': 'b'};

var keypressMap;

var dvorak = function () {
    keypressMap = dvorakKeypressMap;
};

var qwerty = function () {
    keypressMap = qwertyKeypressMap;
};

var setupInput = function () {
    if (localStorage.getItem('spacetime_keyboard_mode') === 'dvorak') {
        keypressMap = dvorakKeypressMap;
    } else {
        keypressMap = qwertyKeypressMap;
    }
};
