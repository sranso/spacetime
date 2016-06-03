'use strict';
global.Type = {};
(function () {

// Flags

Type.mask = 0xf;
Type.onServer = 1 << 7;

// Major types

Type.deleted = 0;
Type.pending = 1;

Type.commit = 2;
Type.tag = 3;

Type.string = 4;
Type.longString = 5;
Type.integer = 6;
Type.float = 7;

Type.tree = 8;

// Minor types

Type.fixedTree = 0;
Type.arrayTree = 1;

})();
