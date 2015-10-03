'use strict';
var QuadsLibrary = {};
(function () {

var inverseMatrix = mat2d.create();

var pixel = Operation.create('pixel', function (cell, a) {
    var original = a.result.type === Result.quads ? a.result.value : Quads.create();
    var quads = Quads.cloneWithLength(original, original.coords.length + Quads.numQuadCoordinates);
    var targetCoords = quads.coords.subarray(-Quads.numQuadCoordinates);
    mat2d.invert(inverseMatrix, quads.matrix)
    var x = quads.pin[0];
    var y = quads.pin[1];
    var quadInitialPoints = new Float32Array([
        x, y,
        x, y + 1,
        x + 1, y + 1,
        x + 1, y,
    ]);
    Quads.vec2TransformMat2d_all(targetCoords, quadInitialPoints, inverseMatrix);

    return Result.create(Result.quads, quads);
});

var scale = Operation.create('scale', function (cell, a, xCell, yCell) {
    var original = a.result.type === Result.quads ? a.result.value : Quads.create();
    var x = xCell.result.type === Result.number ? xCell.result.value : 1;
    var y = yCell.result.type === Result.number ? yCell.result.value : 1;
    var quads = Quads.clone(original);
    var scaled = mat2d.create();
    mat2d.translate(scaled, scaled, quads.pin);

    mat2d.scale(scaled, scaled, [x, y]);

    var postTranslation = vec2.negate(vec2.create(), quads.pin);
    mat2d.translate(scaled, scaled, postTranslation);

    mat2d.multiply(quads.matrix = mat2d.create(), scaled, original.matrix);

    return Result.create(Result.quads, quads);
});

Quads.rotate = function (quads, degrees) {
    if (!Quads.isQuads(quads)) {
        quads = Quads.create();
    }
    return rotate(quads, +degrees / 360 * 2 * Math.PI);
};

var rotate = function (original, rad) {
    var quads = _.clone(original);
    var rotated = mat2d.create();
    mat2d.translate(rotated, rotated, quads.pin);

    mat2d.rotate(rotated, rotated, rad);

    var postTranslation = vec2.negate(vec2.create(), quads.pin);
    mat2d.translate(rotated, rotated, postTranslation);

    mat2d.multiply(quads.matrix = mat2d.create(), rotated, original.matrix);
    return quads;
};

Quads.shear = function (quads, amount) {
    if (!Quads.isQuads(quads)) {
        quads = Quads.create();
    }
    return shear(quads, +amount);
};

var shear = function (original, amount) {
    var quads = _.clone(original);
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

    mat2d.multiply(quads.matrix = mat2d.create(), sheared, original.matrix);
    return quads;
};

Quads.move = function (quads, x, y) {
    if (!Quads.isQuads(quads)) {
        quads = Quads.create();
    }
    return move(quads, [+x, +y]);
};

var move = function (original, v) {
    var quads = _.clone(original);
    Quads.mat2dPreTranslate(quads.matrix = mat2d.create(), original.matrix, v);
    quads.pin = new Float32Array(quads.pin);
    quads.pin[0] += v[0];
    quads.pin[1] += v[1];
    return quads;
};

Quads.pin = function (quads, x, y) {
    if (!Quads.isQuads(quads)) {
        quads = Quads.create();
    }
    return pin(quads, [+x, +y]);
};

var pin = function (original, v) {
    var quads = _.clone(original);
    quads.pin = new Float32Array(v);
    return quads;
};

Quads.combine = function (quads1, quads2) {
    if (!Quads.isQuads(quads1)) {
        quads1 = Quads.create();
    }
    if (!Quads.isQuads(quads2)) {
        quads2 = Quads.create();
    }
    return combine(quads1, quads2);
};

var combine = function (quads1, quads2) {
    mat2d.invert(inverseMatrix, quads1.matrix);
    var matrix = mat2d.multiply(inverseMatrix, inverseMatrix, quads2.matrix);
    var combinedQuads = cloneQuads(quads1, quads1.coords.length + quads2.coords.length);
    var targetCoords = combinedQuads.coords.subarray(-quads2.coords.length);
    Quads.vec2TransformMat2d_all(targetCoords, quads2.coords, matrix);
    return combinedQuads;
};


QuadsLibrary.pixel = (function () {
    var cell = Cell.create();
    cell.text = 'pixel';
    cell.args = Cell.autoArgs[2];
    cell.transformation = Transformation.linear(pixel);

    return cell;
})();

QuadsLibrary.scale = (function () {
    var cell = Cell.create();
    cell.text = 'scale';
    cell.args = Cell.autoArgs[6];
    cell.transformation = Transformation.linear(scale);

    return cell;
})();

QuadsLibrary.all = [
    QuadsLibrary.pixel,
    QuadsLibrary.scale,
];

})();
