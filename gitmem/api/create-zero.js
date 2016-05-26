'use strict';
(function () {

var pointers = new Uint32Array(4);

global.createZero = function (childZeros) {
    var names = Object.keys(childZeros);
    names.sort();

    var treeConfig = {};
    var i;
    for (i = 0; i < names.length; i++) {
        var name = names[i];
        var pointer = childZeros[name];
        pointers[i] = pointer;

        var type = $table.data8[Table.typeOffset(pointer)] & Type.mask;
        switch (type) {
        case Type.string:
        case Type.integer:
        case Type.float:
            treeConfig[name] = 'blob';
            break;
        case Type.tree:
            treeConfig[name] = 'tree';
            break;
        default:
            throw new Error('Unexpected zero type: ' + type);
        }
    }

    var treeLength = Tree.create($file, treeConfig);
    var moldIndex = Mold.process($mold, treeLength);
    return ApiSet._create(moldIndex, pointers);
};

})();
