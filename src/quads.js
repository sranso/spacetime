'use strict';
var Quads = {};
(function () {

var numQuadCoordinates = 4 * 2;

Quads.create = function () {
    return {
        matrix: mat2d.create(),
        pin: new Float32Array(2),
        coords: new Float32Array(0),
    };
};

Quads.isQuads = function (quads) {
    return _.isObject(quads) && quads.coords;
};

var cloneQuads = function (originalQuads, length) {
    var quads = _.clone(originalQuads);
    var originalCoords = originalQuads.coords;
    var coords = new Float32Array(length);
    for (var i = 0; i < originalCoords.length; i++) {
        coords[i] = originalCoords[i];
    }
    quads.coords = coords;
    return quads;
};

var inverseMatrix = mat2d.create();

Quads.pixel = function (quads) {
    if (!quads) {
        quads = Quads.create();
    }
    return pixel(quads);
};

var pixel = function (originalQuads) {
    var quads = cloneQuads(originalQuads, originalQuads.coords.length + numQuadCoordinates);
    var targetCoords = quads.coords.subarray(-numQuadCoordinates);
    mat2d.invert(inverseMatrix, quads.matrix)
    var x = quads.pin[0];
    var y = quads.pin[1];
    var quadInitialPoints = new Float32Array([
        x, y,
        x, y + 1,
        x + 1, y + 1,
        x + 1, y,
    ]);
    vec2TransformMat2d_all(targetCoords, quadInitialPoints, inverseMatrix);
    return quads;
};

Quads.scale = function (quads, x, y) {
    if (!quads) {
        quads = Quads.create();
    }
    return scale(quads, [+x, +y]);
};

var scale = function (originalQuads, v) {
    var quads = _.clone(originalQuads);
    var scaled = mat2d.create();
    mat2d.translate(scaled, scaled, quads.pin);

    mat2d.scale(scaled, scaled, v);

    var postTranslation = vec2.negate(vec2.create(), quads.pin);
    mat2d.translate(scaled, scaled, postTranslation);

    mat2d.multiply(quads.matrix = mat2d.create(), scaled, originalQuads.matrix);
    return quads;
};

Quads.rotate = function (quads, degrees) {
    if (!quads) {
        quads = Quads.create();
    }
    return rotate(quads, +degrees / 360 * 2 * Math.PI);
};

var rotate = function (originalQuads, rad) {
    var quads = _.clone(originalQuads);
    var rotated = mat2d.create();
    mat2d.translate(rotated, rotated, quads.pin);

    mat2d.rotate(rotated, rotated, rad);

    var postTranslation = vec2.negate(vec2.create(), quads.pin);
    mat2d.translate(rotated, rotated, postTranslation);

    mat2d.multiply(quads.matrix = mat2d.create(), rotated, originalQuads.matrix);
    return quads;
};

Quads.shear = function (quads, amount) {
    if (!quads) {
        quads = Quads.create();
    }
    return shear(quads, +amount);
};

var shear = function (originalQuads, amount) {
    var quads = _.clone(originalQuads);
    var sheared = mat2d.create();
    mat2d.translate(sheared, sheared, quads.pin);

    var shearMatrix = [
        1, 0,
        amount, 1,
        0, 0,
    ];
    mat2d.multiply(sheared, sheared, shearMatrix);

    var postTranslation = vec2.negate(vec2.create(), quads.pin);
    mat2d.translate(sheared, sheared, postTranslation);

    mat2d.multiply(quads.matrix = mat2d.create(), sheared, originalQuads.matrix);
    return quads;
};

Quads.move = function (quads, x, y) {
    if (!quads) {
        quads = Quads.create();
    }
    return move(quads, [+x, +y]);
};

var move = function (originalQuads, v) {
    var quads = _.clone(originalQuads);
    mat2dPreTranslate(quads.matrix = mat2d.create(), originalQuads.matrix, v);
    quads.pin = new Float32Array(quads.pin);
    quads.pin[0] += v[0];
    quads.pin[1] += v[1];
    return quads;
};

Quads.pin = function (quads, x, y) {
    if (!quads) {
        quads = Quads.create();
    }
    return pin(quads, [+x, +y]);
};

var pin = function (originalQuads, v) {
    var quads = _.clone(originalQuads);
    quads.pin = new Float32Array(v);
    return quads;
};

Quads.combine = function (quads1, quads2) {
    if (!quads1) {
        quads1 = Quads.create();
    }
    if (!quads2) {
        quads2 = Quads.create();
    }
    return combine(quads1, quads2);
};

var combine = function (quads1, quads2) {
    mat2d.invert(inverseMatrix, quads1.matrix);
    var matrix = mat2d.multiply(inverseMatrix, inverseMatrix, quads2.matrix);
    var combinedQuads = cloneQuads(quads1, quads1.coords.length + quads2.coords.length);
    var targetCoords = combinedQuads.coords.subarray(-quads2.coords.length);
    vec2TransformMat2d_all(targetCoords, quads2.coords, matrix);
    return combinedQuads;
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
var vec2TransformMat2d_all = function (out, a, m) {
    for (var i = 0; i < a.length; i += 2) {
        var x = a[i],
            y = a[i + 1];
        out[i] = m[0] * x + m[2] * y + m[4];
        out[i + 1] = m[1] * x + m[3] * y + m[5];
    }
};

// simplified mat2d.multiply(out, mat2d.translate(mat2d.create(), mat2d.create(), v), b);
var mat2dPreTranslate = function (out, a, v) {
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
