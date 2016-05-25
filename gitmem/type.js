'use strict';
global.Type = {};
(function () {

Type.mask = 0xf;
Type.onServer = 1 << 7;

Type.deleted = 0;
Type.pending = 1;

Type.commit = 2;
Type.tag = 3;

Type.string = 4;
Type.longString = 5;
Type.integer = 6;
Type.float = 7;

Type.tree = 8;

})();
