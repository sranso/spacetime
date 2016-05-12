'use strict';
global.Type = {};
(function () {

Type.deleted = 0;
Type.pending = 1;

Type.commit = 2;
Type.tag = 3;
Type.blob = 4;

Type.string = 4;
Type.integer = 5;
Type.float = 6;
Type.boolean = 7;

Type.tree = 8;

})();
