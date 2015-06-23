var gl;
var program;
var canvas;
var devicePixelRatio = window.devicePixelRatio || 1;
var positionIndices;
var positionIndicesBuffer;
var quads;
var projectionMatrix;

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
        origin: new Float32Array(2),
        buffer: buffer,
        coords: new Float32Array(buffer, 0, 0),
    };
};

var setup = function () {
    glMatrix.setMatrixArrayType = Float32Array;
    quads = createQuads();

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

var draw = function () {
    resize();
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    var colorLocation = gl.getUniformLocation(program, 'u_color');
    var matrixLocation = gl.getUniformLocation(program, 'u_matrix');

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    addRectangle();

    //translate([1, 1]);
    scale([10, 10]);

    translate([20, 30]);
    translate([20, 30]);

    setOrigin([45, 65]);

    scale([10, 10]);

    translate([300, 200]);

    rotate(Math.PI / 4);

    //scale([0.2, 1]);
    //addRectangle();

    //scale([10, 10]);
    //translate([100, 100]);

    var matrix = mat2d.multiply(mat2d.create(), createProjectionMatrix(), quads.matrix);
    var matrix3 = mat3.fromMat2d(mat3.create(), matrix);
    gl.uniformMatrix3fv(matrixLocation, false, matrix3);

    gl.bufferData(gl.ARRAY_BUFFER, quads.coords, gl.STATIC_DRAW);
    gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);

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

var expandQuads = function (length) {
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

var quadInitialPoints = new Float32Array([
    0, 0,
    0, 1,
    1, 1,
    1, 0,
]);
var inverseMatrix = mat2d.create();

var addRectangle = function () {
    var newBytes = quads.coords.byteLength + quadBytes;
    expandQuads(quads.coords.length + numQuadCoordinates);
    var targetCoords = quads.coords.subarray(-numQuadCoordinates);
    mat2d.invert(inverseMatrix, quads.matrix)
    vec2TransformMat2d_all(targetCoords, quadInitialPoints, inverseMatrix);
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

var scale = function (v) {
    mat2d.invert(inverseMatrix, quads.matrix);
    var preTranslation = vec2.transformMat2d(vec2.create(), quads.origin, inverseMatrix);
    mat2d.translate(quads.matrix, quads.matrix, preTranslation);

    mat2d.scale(quads.matrix, quads.matrix, v);

    var postTranslation = vec2.negate(preTranslation, preTranslation);
    mat2d.translate(quads.matrix, quads.matrix, postTranslation);
};

var rotate = function (rad) {
    mat2d.invert(inverseMatrix, quads.matrix);
    var preTranslation = vec2.transformMat2d(vec2.create(), quads.origin, inverseMatrix);
    mat2d.translate(quads.matrix, quads.matrix, preTranslation);

    mat2d.rotate(quads.matrix, quads.matrix, rad);

    var postTranslation = vec2.negate(preTranslation, preTranslation);
    mat2d.translate(quads.matrix, quads.matrix, postTranslation);
};

var translate = function (v) {
    mat2dPreTranslate(quads.matrix, quads.matrix, v);
    quads.origin[0] += v[0];
    quads.origin[1] += v[1];
    //var translate = mat2d.create();
    //mat2d.multiply(quads.matrix, mat2d.translate(translate, translate, v), quads.matrix);
};

var setOrigin = function (v) {
    quads.origin[0] = v[0];
    quads.origin[1] = v[1];
};

mat2d.create = function() {
    var out = new glMatrix.ARRAY_TYPE(6);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
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

draw();
