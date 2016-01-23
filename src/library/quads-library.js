'use strict';
global.QuadsLibrary = {};
(function () {

var inverseMatrix = mat2d.create();

///////////// pixel

var pixel = Operation.create('pixel', function (cell) {
    var original = Quads.create();
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

///////////// scale

var performScale = function (original, x, y) {
    var quads = Quads.clone(original);
    var scaled = mat2d.create();
    mat2d.translate(scaled, scaled, quads.pin);

    mat2d.scale(scaled, scaled, [x, y]);

    var postTranslation = vec2.negate(vec2.create(), quads.pin);
    mat2d.translate(scaled, scaled, postTranslation);

    mat2d.multiply(quads.matrix = mat2d.create(), scaled, original.matrix);

    return Result.create(Result.quads, quads);
};

var scaleX = Operation.create('scaleX', function (cell, a, xCell) {
    var original = a.result.type === Result.quads ? a.result.value : Quads.create();
    var x = xCell.result.type === Result.number ? xCell.result.value : 1;
    return performScale(original, x, 1);
});

var scaleY = Operation.create('scaleY', function (cell, a, yCell) {
    var original = a.result.type === Result.quads ? a.result.value : Quads.create();
    var y = yCell.result.type === Result.number ? yCell.result.value : 1;
    return performScale(original, 1, y);
});

var scale = Operation.create('scale', function (cell, a, amountCell) {
    var original = a.result.type === Result.quads ? a.result.value : Quads.create();
    var amount = amountCell.result.type === Result.number ? amountCell.result.value : 1;
    return performScale(original, amount, amount);
});

///////////// rotate

var rotate = Operation.create('rotate', function (cell, a, degreesCell) {
    var original = a.result.type === Result.quads ? a.result.value : Quads.create();
    var degrees = degreesCell.result.type === Result.number ? degreesCell.result.value : 1;
    var radians = degrees / 360 * 2 * Math.PI;

    var quads = Quads.clone(original);
    var rotated = mat2d.create();
    mat2d.translate(rotated, rotated, quads.pin);

    mat2d.rotate(rotated, rotated, radians);

    var postTranslation = vec2.negate(vec2.create(), quads.pin);
    mat2d.translate(rotated, rotated, postTranslation);

    mat2d.multiply(quads.matrix = mat2d.create(), rotated, original.matrix);
    return Result.create(Result.quads, quads);
});

///////////// move

var performMove = function (original, x, y) {
    var quads = Quads.clone(original);
    Quads.mat2dPreTranslate(quads.matrix = mat2d.create(), original.matrix, [x, y]);
    quads.pin = new Float32Array(quads.pin);
    quads.pin[0] += x;
    quads.pin[1] += y;
    return Result.create(Result.quads, quads);
};

var moveX = Operation.create('move x', function (cell, a, xCell) {
    var original = a.result.type === Result.quads ? a.result.value : Quads.create();
    var x = xCell.result.type === Result.number ? xCell.result.value : 1;
    return performMove(original, x, 0);
});

var moveY = Operation.create('move y', function (cell, a, yCell) {
    var original = a.result.type === Result.quads ? a.result.value : Quads.create();
    var y = yCell.result.type === Result.number ? yCell.result.value : 1;
    return performMove(original, 0, y);
});

///////////// pin

var pin = Operation.create('pin', function (cell, a, xCell, yCell) {
    var original = a.result.type === Result.quads ? a.result.value : Quads.create();
    var x = xCell.result.type === Result.number ? xCell.result.value : 1;
    var y = yCell.result.type === Result.number ? yCell.result.value : 1;
    var quads = Quads.clone(original);
    quads.pin = new Float32Array([x, y]);
    return Result.create(Result.quads, quads);
});

///////////// combine

var combine = Operation.create('combine', function (cell, a, b) {
    var quads1 = a.result.type === Result.quads ? a.result.value : Quads.create();
    var quads2 = b.result.type === Result.quads ? b.result.value : Quads.create();
    mat2d.invert(inverseMatrix, quads1.matrix);
    var matrix = mat2d.multiply(inverseMatrix, inverseMatrix, quads2.matrix);
    var combinedQuads = Quads.cloneWithLength(quads1, quads1.coords.length + quads2.coords.length);
    var targetCoords = combinedQuads.coords.subarray(-quads2.coords.length);
    Quads.vec2TransformMat2d_all(targetCoords, quads2.coords, matrix);
    return Result.create(Result.quads, combinedQuads);
});

///////////// library

QuadsLibrary.pixel = (function () {
    var cell = Cell.create();
    cell.text = 'pixel';
    cell.args = Cell.autoArgs[0];
    cell.transformation = Transformation.immediate(pixel);

    return cell;
})();

QuadsLibrary.scaleX = (function () {
    var cell = Cell.create();
    cell.text = 'scale x';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(scaleX);

    return cell;
})();

QuadsLibrary.scaleY = (function () {
    var cell = Cell.create();
    cell.text = 'scale y';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(scaleY);

    return cell;
})();

QuadsLibrary.scale = (function () {
    var cell = Cell.create();
    cell.text = 'scale';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(scale);

    return cell;
})();

QuadsLibrary.moveX = (function () {
    var cell = Cell.create();
    cell.text = 'move x';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(moveX);

    return cell;
})();

QuadsLibrary.moveY = (function () {
    var cell = Cell.create();
    cell.text = 'move y';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(moveY);

    return cell;
})();

QuadsLibrary.pin = (function () {
    var cell = Cell.create();
    cell.text = 'pin';
    cell.args = Cell.autoArgs[6];
    cell.transformation = Transformation.linear(pin);

    return cell;
})();

QuadsLibrary.combine = (function () {
    var cell = Cell.create();
    cell.text = 'combine';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(combine);

    return cell;
})();

QuadsLibrary.rotate = (function () {
    var cell = Cell.create();
    cell.text = 'rotate';
    cell.args = Cell.autoArgs[4];
    cell.transformation = Transformation.linear(rotate);

    return cell;
})();

QuadsLibrary.all = [
    QuadsLibrary.pixel,
    QuadsLibrary.scaleX,
    QuadsLibrary.scaleY,
    QuadsLibrary.scale,
    QuadsLibrary.rotate,
    QuadsLibrary.moveX,
    QuadsLibrary.moveY,
    QuadsLibrary.pin,
    QuadsLibrary.combine,
];

})();
