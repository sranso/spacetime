'use strict';
var Quads = {};
(function () {

Quads.create = function () {
    return {
        matrix: mat2d.create(),
        pin: new Float32Array(2),
        coords: new Float32Array(0),
    };
};

Quads.numQuadCoordinates = 4 * 2;

Quads.clone = function (original) {
    var quads = Quads.create();
    quads.matrix = original.matrix;
    quads.pin = original.pin;
    quads.coords = original.coords;

    return quads;
};

Quads.cloneWithLength = function (original, length) {
    var quads = Quads.create();
    quads.matrix = original.matrix;
    quads.pin = original.pin;

    var coords = new Float32Array(length);
    for (var i = 0; i < original.coords.length; i++) {
        coords[i] = original.coords[i];
    }
    quads.coords = coords;

    return quads;
};


// TODO: better implementation that doesn't require going through every point
Quads.boundaryCoords = function (quads) {
    if (quads.coords.length > 8) {
        var XXX = 4 + 1;
    }
    var coords = new Float32Array(quads.coords.length);
    vec2TransformMat2d_all(coords, quads.coords, quads.matrix);
    if (!coords.length) {
        return [0, 0, 1, 1];
    }
    var left = coords[0];
    var right = coords[0];
    var top = coords[1];
    var bottom = coords[1];
    for (var i = 0; i < coords.length; i += 2) {
        var x = coords[i];
        var y = coords[i + 1];
        if (x < left) { left = x; }
        if (x > right) { right = x; }
        if (y < bottom) { bottom = y; }
        if (y > top) { top = y; }
    }
    return [left, bottom, right, top];
};

// similar to vec2.transformMat2d
Quads.vec2TransformMat2d_all = function (out, a, m) {
    for (var i = 0; i < a.length; i += 2) {
        var x = a[i],
            y = a[i + 1];
        out[i] = m[0] * x + m[2] * y + m[4];
        out[i + 1] = m[1] * x + m[3] * y + m[5];
    }
};

// simplified mat2d.multiply(out, mat2d.translate(mat2d.create(), mat2d.create(), v), b);
Quads.mat2dPreTranslate = function (out, a, v) {
    var v0 = v[0], v1 = v[1],
        a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = a4 + v0;
    out[5] = a5 + v1;
    return out;
};

})();
