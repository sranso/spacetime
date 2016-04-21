'use strict';
global.Type = {};
(function () {

Type.deleted = 0;
Type.pending = 1;

Type.commit = 2;
Type.tag = 3;
Type.blob = 4;

Type.longStringBlob = 5;
Type.shortStringBlob = 6;
Type.integerBlob = 7;
Type.floatBlob = 8;
Type.booleanBlob = 9;
Type.functionBlob = 10;

Type.minTree = 12;

})();
