'use strict';
global.ApiCreateCommit = {};
(function () {

var newPointers = new Uint32Array(5);
var tempHash = new Uint8Array(20);

global.createCommit = function (pointer) {
    var pointer32 = pointer >> 2;
    var i;
    for (i = 0; i < 5; i++) {
        newPointers[i] = $table.data32[pointer32 + i];
    }

    for (i = 1; i < arguments.length; i += 2) {
        var childIndex = arguments[i];
        if (childIndex >= 5) {
            throw new Error('Trying to set child ' + childIndex + ' out of 5');
        }
        newPointers[childIndex] = arguments[i + 1];
    }

    return ApiCreateCommit._create(newPointers);
};

ApiCreateCommit._create = function (newPointers) {
    // Create commit file
    var commitLength = CommitFile.create($file, newPointers, 0);

    // Hash and store in table
    Sha1.hash($file, 0, commitLength, tempHash, 0);
    var pointer = Table.findPointer($table, tempHash, 0);
    if (pointer > 0) {
        return pointer;
    }

    pointer = ~pointer;
    Table.setHash($table, pointer, tempHash, 0);
    var pointer32 = pointer >> 2;
    $table.data8[Table.typeOffset(pointer)] = Type.commit;
    var i;
    for (i = 0; i < 5; i++) {
        $table.data32[pointer32 + i] = newPointers[i];
    }

    return pointer;
};

})();
