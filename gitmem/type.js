'use strict';
global.Type = {};
(function () {

Type.deleted = 0;
Type.pending = 1;

Type.commit = 2;
Type.tag = 3;
Type.blob = 4;

Type.string = 4;
Type.longString = 5;
Type.integer = 6;
Type.float = 7;
Type.boolean = 8;

Type.tree = 9;

})();
