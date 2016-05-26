'use strict';
global.Tree = {};
(function () {

var treePrefix = Convert.stringToArray('tree ');
var treeMode = Convert.stringToArray('40000');
var blobMode = Convert.stringToArray('100644');

Tree.create = function (file, props) {
    var names = Object.keys(props);
    names.sort();

    var length = 0;
    var n;
    for (n = 0; n < names.length; n++) {
        var name = names[n];
        if (props[name] === 'tree') {
            length += treeMode.length;
        } else {
            length += blobMode.length;
        }
        length += 1 + name.length + 1 + 20;
    }

    var lengthString = '' + length;
    var headerLength = treePrefix.length + lengthString.length + 1;
    var treeLength = headerLength + length;

    var i;
    for (i = 0; i < treePrefix.length; i++) {
        file[i] = treePrefix[i];
    }

    var tree_j = i;
    for (i = 0; i < lengthString.length; i++) {
        file[tree_j + i] = lengthString.charCodeAt(i);
    }
    file[tree_j + i] = 0;

    tree_j += i + 1;
    for (n = 0; n < names.length; n++) {
        var name = names[n];
        if (props[name] === 'tree') {
            var mode = treeMode;
        } else {
            var mode = blobMode;
        }

        for (i = 0; i < mode.length; i++) {
            file[tree_j + i] = mode[i];
        }
        file[tree_j + i] = 0x20;

        tree_j += i + 1;
        for (i = 0; i < name.length; i++) {
            file[tree_j + i] = name.charCodeAt(i);
        }
        file[tree_j + i] = 0;

        tree_j += i + 1;
        for (i = 0; i < 20; i++) {
            file[tree_j + i] = 0;
        }

        tree_j += 20;
    }

    return treeLength;
};

Tree.setHash = function ($t, targetOffset, $s, sourceOffset) {
    var i;
    for (i = 0; i < 20; i++) {
        $t[targetOffset + i] = $s[sourceOffset + i];
    }
};

})();
