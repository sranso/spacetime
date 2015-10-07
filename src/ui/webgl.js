'use strict';
var Webgl = {};
(function () {

var createWebgl = function () {
    return {
        gl: null,
        program: null,
        canvas: null,
        positionIndices: null,

        positionLocation: null,
        colorLocation: null,
        matrixLocation: null,

        positionBuffer: null,
        positionIndicesBuffer: null,
    };
};

var coordsLengthToVerticesRatio = 1 / 2;
var verticesToElementsRatio = 6 / 4;
var coordsLengthToElementsRatio = coordsLengthToVerticesRatio * verticesToElementsRatio;  // 3 / 4

var resultPixelHeightRatio = 20 - 1;

var webgl;

Webgl.setup = function () {
    glMatrix.setMatrixArrayType = Float32Array;

    webgl = createWebgl();
    webgl.canvas = d3.select('#canvas').node();
    updateCanvasSize(webgl.canvas);

    try {
        webgl.gl = webgl.canvas.getContext('webgl') || webgl.canvas.getContext('experimental-webgl');
    } catch(e) {}

    var gl = webgl.gl;
    if (!gl) {
        return;
    }

    webgl.program = setupShaderProgram(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(webgl.program);

    webgl.positionIndices = new Uint16Array(600000);
    var j = 0;
    for (var i = 0; i < webgl.positionIndices.length;) {
        webgl.positionIndices[i + 0] = j + 0;
        webgl.positionIndices[i + 1] = j + 1;
        webgl.positionIndices[i + 2] = j + 2;
        webgl.positionIndices[i + 3] = j + 2;
        webgl.positionIndices[i + 4] = j + 3;
        webgl.positionIndices[i + 5] = j + 0;
        i += 6;
        j += 4;
    }

    webgl.positionIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl.positionIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, webgl.positionIndices, gl.STATIC_DRAW);

    webgl.positionLocation = gl.getAttribLocation(webgl.program, 'a_position');
    webgl.colorLocation = gl.getUniformLocation(webgl.program, 'u_color');
    webgl.matrixLocation = gl.getUniformLocation(webgl.program, 'u_matrix');

    webgl.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl.positionBuffer);
    gl.enableVertexAttribArray(webgl.positionLocation);
    gl.vertexAttribPointer(webgl.positionLocation, 2, gl.FLOAT, false, 0, 0);
};

var setupShaderProgram = function (gl, vertexId, fragmentId) {
    var vertexShader = createShader(gl, vertexId);
    var fragmentShader = createShader(gl, fragmentId);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Unable to initialize the shader program.');
    }
    return program;
};

var createShader = function (gl, id) {
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
};

Webgl.clear = function () {
    updateCanvasSize(webgl.canvas);
    webgl.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    webgl.gl.clear(webgl.gl.COLOR_BUFFER_BIT);
};

var updateCanvasSize = function (canvas) {
    var canvasWidth = canvas.clientWidth * devicePixelRatio;
    var canvasHeight = canvas.clientHeight * devicePixelRatio;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
};

Webgl.drawGridCell = function (quads, c, r) {
    setGridCellViewport(c, r);
    draw(quads);
};

Webgl.drawFullScreen = function (quads) {
    webgl.gl.viewport(0, 0, webgl.canvas.width, webgl.canvas.height);
    draw(quads);
};

var setGridCellViewport = function (c, r) {
    var dpr = window.devicePixelRatio;
    var width = 160 * dpr;
    var height = 100 * dpr;
    var x = (c * 190 + 4) * dpr;
    var y = (r * 140 + 10 + 6) * dpr;
    webgl.gl.viewport(x, y, width, height);
};

var draw = function (quads) {
    var projectionMatrix = createBasicProjectionMatrix();
    var matrix = mat2d.multiply(mat2d.create(), projectionMatrix, quads.matrix);
    var gl = webgl.gl;

    var matrix3 = mat3.fromMat2d(mat3.create(), matrix);
    gl.uniformMatrix3fv(webgl.matrixLocation, false, matrix3);

    gl.uniform4f(webgl.colorLocation, 74 / 255, 53 / 255, 121 / 255, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, webgl.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quads.coords, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl.positionIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, quads.coords.length * coordsLengthToElementsRatio, gl.UNSIGNED_SHORT, 0);
};

var createBasicProjectionMatrix = function () {
    var height = window.innerHeight;
    var width = height * 16 / 10;
    var scaleX = 2 / width;
    var scaleY = 2 / height;
    return new Float32Array([
        scaleX, 0,
        0,      scaleY,
        -1,     -1,
    ]);
};

})();
