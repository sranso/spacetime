'use strict';
var Canvas = {};
(function () {

var devicePixelRatio = window.devicePixelRatio || 1;

var coordsLengthToVerticesRatio = 1 / 2;
var verticesToElementsRatio = 6 / 4;
var coordsLengthToElementsRatio = coordsLengthToVerticesRatio * verticesToElementsRatio;  // 3 / 4

var webgl;

var createWebgl = function () {
    return {
        gl: null,
        program: null,
        canvas: null,
        positionIndices: null,
        projectionMatrix: null,

        positionLocation: null,
        colorLocation: null,
        matrixLocation: null,

        positionBuffer: null,
        positionIndicesBuffer: null,
    };
};

var setupAll = function () {
    glMatrix.setMatrixArrayType = Float32Array;

    webgl = createWebgl();
    webgl.canvas = document.getElementById('canvas');
    try {
        webgl.gl = webgl.canvas.getContext('webgl') || webgl.canvas.getContext('experimental-webgl');
    } catch(e) {}

    var gl = webgl.gl;
    if (!gl) {
        return;
    }

    webgl.program = setupShaderProgram(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(webgl.program);

    resize(webgl);

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

var resize = function (webgl) {
    var canvas = webgl.canvas;
    var width = canvas.clientWidth * devicePixelRatio;
    var height = canvas.clientHeight * devicePixelRatio;
    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
        webgl.gl.viewport(0, 0, width, height);
        webgl.projectionMatrix = createProjectionMatrix(canvas);
    }
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

Canvas.draw = function () {
    var gl = webgl.gl;
    resize(webgl);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var quads = Global.lastQuads;
    if (!quads) {
        return;
    }

    var matrix = mat2d.multiply(mat2d.create(), webgl.projectionMatrix, quads.matrix);
    var matrix3 = mat3.fromMat2d(mat3.create(), matrix);
    gl.uniformMatrix3fv(webgl.matrixLocation, false, matrix3);

    gl.uniform4f(webgl.colorLocation, 74 / 255, 53 / 255, 121 / 255, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, webgl.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quads.coords, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl.positionIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, quads.coords.length * coordsLengthToElementsRatio, gl.UNSIGNED_SHORT, 0);
};

Canvas.drawResult = function (canvasParent, quads) {
};

var createProjectionMatrix = function (canvas) {
    var width = canvas.width / devicePixelRatio;
    var height = canvas.height / devicePixelRatio;
    return [
        2 / width,  0,
        0,          2 / height,
        -1,         -1
    ];
};

setupAll();

})();
