var Node = function () {
    this._numLoops = 1;
    this._inMap = null;
    this._loopMap = null;
    this._outMap = null;
    this._outRange = null;
    this._children = [];
};

Node.prototype.execute = function (parentR) {
    var oldR = [];
    var r = [];
    var rs = {
        parentR: parentR,
        r: r,
    };

    for (var i = 0; i < this._inMap.length; i++) {
        var m = this._inMap[i];
        r[i] = rs[m[0]][m[1]];
    }

    for (var loop = 0; loop < this._numLoops - 1; loop++) {
        for (var c = 0; c < this._children.length; c++) {
            this._children[c].execute(r);
        }
        console.log(r);

        var newR = oldR;
        for (var i = 0; i < this._loopMap.length; i++) {
            var m = this._loopMap[i];
            newR[i] = rs[m[0]][m[1]];
        }
        oldR = r;
        r = newR;
        rs.r = newR;
    }
    for (var c = 0; c < this._children.length; c++) {
        this._children[c].execute(r);
    }
    console.log(r);

    var parentI = this._outRange[0];
    for (var i = 0; i < this._outMap.length; i++) {
        var m = this._outMap[i];
        parentR[parentI + i] = rs[m[0]][m[1]];
    }
};

var BaseStepNode = function () {
    this._operation = null;
    this._argMap = null;
    this._outRange = null;
    this._children = null;
};

BaseStepNode.prototype.execute = function (parentR) {
    var rs = {
        parentR: parentR,
    };
    var args = [];
    for (var i = 0; i < this._argMap.length; i++) {
        var m = this._argMap[i];
        args[i] = rs[m[0]][m[1]];
    }
    var result = this._operation.apply(this, args);
    parentR[this._outRange[0]] = result;
};

var n = new Node();
n._numLoops = 3;
n._inMap = [
    ['parentR', 0],
    ['parentR', 1],
];
n._loopMap = [
    ['parentR', 0],
    ['r', 4],
];
n._outMap = [
    ['r', 4],
];
n._outRange = [2, 2];

n._children = [];

var c = new BaseStepNode();
c._operation = function (a, b) { return a + b };
c._argMap = [
    ['parentR', 0],
    ['parentR', 1],
];
c._outRange = [2, 2];
n._children.push(c);

c = new BaseStepNode();
c._operation = function (a, b) { return a * 3 };
c._argMap = [
    ['parentR', 2],
];
c._outRange = [3, 3];
n._children.push(c);

c = new BaseStepNode();
c._operation = function (a, b) { return a - 16 };
c._argMap = [
    ['parentR', 3],
];
c._outRange = [4, 4];
n._children.push(c);

var parentR = [3, 4];
n.execute(parentR);
