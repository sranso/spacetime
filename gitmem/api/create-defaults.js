'use strict';
(function () {

var pointers = new Uint32Array(4);

global.createDefaults = function (defaults) {
    var names = Object.keys(defaults);
    names.sort();

    var treeConfig = {};
    var i;
    for (i = 0; i < names.length; i++) {
        var name = names[i];
        var pointer = defaults[name];
        pointers[i] = pointer;

        var type = $table.data8[Table.typeOffset(pointer)];
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
            throw new Error('Unexpected defaults type: ' + type);
        }
    }

    var treeLength = Tree.create(treeConfig);
    var moldIndex = Mold.process($mold, treeLength);
    return set._create(moldIndex, pointers);
};

})();
