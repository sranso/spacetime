if (typeof global === 'undefined') {
    window.global = window;
} else {
    var glMatrix = require('../vendor/gl-matrix.js');
	global.glMatrix = glMatrix;
	global.mat2d = glMatrix.mat2d;
	global.vec2 = glMatrix.vec2;
}
