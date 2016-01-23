'use strict';
global.Input = {};
(function () {

Input.create = function () {
    return {
        mouseX: 0,
        mouseY: 0,
        mouseDown: false,
    };
};

Input.types = ['mouseX', 'mouseY', 'mouseDown'];
Input.none = Input.create();

Input.clone = function (original) {
    var input = Input.create();
    input.mouseX = original.mouseX;
    input.mouseY = original.mouseY;
    input.mouseDown = original.mouseDown;

    return input;
};

})();
