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
Type.string20 = 5;
Type.longString = 6;
Type.integer = 7;
Type.float = 8;

Type.tree = 9;

// Minor types

Type.fixedTree = 0;
Type.arrayTree = 1;

})();
