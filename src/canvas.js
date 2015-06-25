'use strict';
var Canvas = {};
(function () {

Canvas.isQuads = function (quads) {
    return _.isObject(quads) && quads.coords;
};

var gl;
var program;
var canvas;
var devicePixelRatio = window.devicePixelRatio || 1;
var positionIndices;
var positionIndicesBuffer;
var projectionMatrix;

var positionLocation;
var colorLocation;
var matrixLocation;
var positionBuffer;

var numQuadCoordinates = 4 * 2;
var quadBytes = numQuadCoordinates * 4;
var startingCapacity = 8 * quadBytes;

var coordsLengthToVerticesRatio = 1 / 2;
var verticesToElementsRatio = 6 / 4;
var coordsLengthToElementsRatio = coordsLengthToVerticesRatio * verticesToElementsRatio;  // 3 / 4

var createQuads = function () {
    var buffer = new ArrayBuffer(startingCapacity);
    return {
        matrix: mat2d.create(),
        pin: new Float32Array(2),
        buffer: buffer,
        coords: new Float32Array(buffer, 0, 0),
    };
};

var setup = function () {
    glMatrix.setMatrixArrayType = Float32Array;

    canvas = document.getElementById('canvas');
    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch(e) {}

    if (!gl) {
        return;
    }

    program = setupShaderProgram('vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    resize();

    positionIndices = new Uint16Array(600000);
    var j = 0;
    for (var i = 0; i < positionIndices.length;) {
        positionIndices[i + 0] = j + 0;
        positionIndices[i + 1] = j + 1;
        positionIndices[i + 2] = j + 2;
        positionIndices[i + 3] = j + 2;
        positionIndices[i + 4] = j + 3;
        positionIndices[i + 5] = j + 0;
        i += 6;
        j += 4;
    }

    positionIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, positionIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, positionIndices, gl.STATIC_DRAW);

    positionLocation = gl.getAttribLocation(program, 'a_position');
    colorLocation = gl.getUniformLocation(program, 'u_color');
    matrixLocation = gl.getUniformLocation(program, 'u_matrix');

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
};

var resize = function () {
    var width = canvas.clientWidth * devicePixelRatio;
    var height = canvas.clientHeight * devicePixelRatio;
    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        projectionMatrix = createProjectionMatrix();
    }
};

var setupShaderProgram = function (vertexId, fragmentId) {
    var vertexShader = createShader(vertexId);
    var fragmentShader = createShader(fragmentId);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Unable to initialize the shader program.');
    }
    return program;
};

var createShader = function (id) {
    var shaderEl = document.getElementById(id);
    if (!shaderEl) {
        throw new Error('Could not find shader: "' + id + '"');
    }

    var sourceText = '';
    var node = shaderEl.firstChild;
    while (node) {
        if (node.nodeType == node.TEXT_NODE) {
            sourceText += node.textContent;
        }
        node = node.nextSibling;
    }

    if (shaderEl.type == 'x-shader/x-fragment') {
        var shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderEl.type == 'x-shader/x-vertex') {
        var shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        throw new Error('Unknown shader type: ' + shaderEl.type);
    }
    gl.shaderSource(shader, sourceText);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    }

    return shader;
}

var setupQuads = function () {
    // quads1

    var quads1 = createQuads();

    addRectangle(quads1);

    translate(quads1, [1, 1]);
    scale(quads1, [10, 10]);

    translate(quads1, [20, 30]);
    translate(quads1, [20, 30]);

    setOrigin(quads1, [35, 55]);
    addRectangle(quads1);
    setOrigin(quads1, [45, 65]);

    scale(quads1, [10, 10]);

    translate(quads1, [300, 200]);

    rotate(quads1, Math.PI / 4);

    // quads2

    var quads2 = createQuads();

    setOrigin(quads2, [150, 100]);
    addRectangle(quads2);
    scale(quads2, [15, 2]);
    rotate(quads2, Math.PI / 3);
    setOrigin(quads2, [120, 100]);
    addRectangle(quads2);
    scale(quads2, [5, 1]);
    setOrigin(quads2, [220, 90]);
    addRectangle(quads2);
    scale(quads2, [2, 3]);

    // quads

    merge(quads1, quads2);
    Global.lastQuads = quads1;
};

Canvas.draw = function () {
    resize();
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var quads = Global.lastQuads;
    if (!quads) {
        return;
    }

    var matrix = mat2d.multiply(mat2d.create(), createProjectionMatrix(), quads.matrix);
    var matrix3 = mat3.fromMat2d(mat3.create(), matrix);
    gl.uniformMatrix3fv(matrixLocation, false, matrix3);

    gl.uniform4f(colorLocation, 74 / 255, 53 / 255, 121 / 255, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quads.coords, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, positionIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, quads.coords.length * coordsLengthToElementsRatio, gl.UNSIGNED_SHORT, 0);
};

var createProjectionMatrix = function () {
    var width = canvas.width / devicePixelRatio;
    var height = canvas.height / devicePixelRatio;
    return [
        2 / width,  0,
        0,          2 / height,
        -1,         -1
    ];
};

var expandQuads = function (quads, length) {
    var requiredCapacity = length * 4;
    var capacity = quads.buffer.byteLength;

    if (capacity < requiredCapacity) {
        while (capacity < requiredCapacity) {
            capacity *= 2;
        }
        quads.buffer = new ArrayBuffer(capacity);
        var oldCoords = quads.coords;
        var coords = new Float32Array(buffer, 0, length);
        for (var i = 0; i < oldCoords.length; i++) {
            coords[i] = oldCoords[i];
        }
        quads.coords = coords;
    } else {
        quads.coords = new Float32Array(quads.buffer, 0, length);
    }
};

var inverseMatrix = mat2d.create();

Canvas.pixel = function (quads) {
    if (!quads) {
        quads = createQuads();
    }
    return pixel(quads);
};

var pixel = function (quads) {
    expandQuads(quads, quads.coords.length + numQuadCoordinates);
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

Canvas.scale = function (quads, x, y) {
    return scale(quads, [+x, +y]);
};

var scale = function (quads, v) {
    var scaled = mat2d.create();
    mat2d.translate(scaled, scaled, quads.pin);

    mat2d.scale(scaled, scaled, v);

    var postTranslation = vec2.negate(vec2.create(), quads.pin);
    mat2d.translate(scaled, scaled, postTranslation);

    mat2d.multiply(quads.matrix, scaled, quads.matrix);
    return quads;
};

Canvas.rotate = function (quads, degrees) {
    return rotate(quads, +degrees / 360 * 2 * Math.PI);
};

var rotate = function (quads, rad) {
    var rotated = mat2d.create();
    mat2d.translate(rotated, rotated, quads.pin);

    mat2d.rotate(rotated, rotated, rad);

    var postTranslation = vec2.negate(vec2.create(), quads.pin);
    mat2d.translate(rotated, rotated, postTranslation);

    mat2d.multiply(quads.matrix, rotated, quads.matrix);
    return quads;
};

Canvas.shear = function (quads, amount) {
    return shear(quads, +amount);
};

var shear = function (quads, amount) {
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

    mat2d.multiply(quads.matrix, sheared, quads.matrix);
    return quads;
};

Canvas.move = function (quads, x, y) {
    return move(quads, [+x, +y]);
};

var move = function (quads, v) {
    mat2dPreTranslate(quads.matrix, quads.matrix, v);
    quads.pin[0] += v[0];
    quads.pin[1] += v[1];
    return quads;
};

Canvas.pin = function (quads, x, y) {
    if (!y) {
        y = x;
        x = quads;
        quads = createQuads();
    }
    return pin(quads, [+x, +y]);
};

var pin = function (quads, v) {
    quads.pin[0] = v[0];
    quads.pin[1] = v[1];
    return quads;
};

Canvas.combine = function (quads1, quads2) {
    return combine(quads1, quads2);
};

var combine = function (quads1, quads2) {
    mat2d.invert(inverseMatrix, quads1.matrix);
    var matrix = mat2d.multiply(inverseMatrix, inverseMatrix, quads2.matrix);
    expandQuads(quads1, quads1.coords.length + quads2.coords.length);
    var targetCoords = quads1.coords.subarray(-quads2.coords.length);
    vec2TransformMat2d_all(targetCoords, quads2.coords, matrix);
    return quads;
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

setup();

})();
