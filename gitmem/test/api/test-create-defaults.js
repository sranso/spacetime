'use strict';
require('../../../test/helper');

global.$table = Table.create(16, Random.create(29923321));
global.$file = new Uint8Array(128);
global.$mold = Mold.create(4, 256);

var answer = hash(42);
$table.data8[Table.typeOffset(answer)] |= Type.onServer;

var defaults = createDefaults({
    message: hash('I <3 short messages'),
    answer: answer,
    pi: hash(3.141592653589793),
});

log(hexHash($table.hashes8, defaults));
//=> ff4ca8563dc70d98a16e7682f4e8c9d9ce2d0d0b
var pointer32 = defaults >> 2;
var moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
log(moldIndex);
//=> 1
var mold32 = moldIndex * Mold.data32_size;
var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
log(pretty($mold.fileArray, fileStart, fileEnd));
//=> tree 99\x00100644 answer\x00\xf7\x0d\x7b\xbaJ\xe1\xf0v\x82\xe05\x8b\xd7\xa2\x06\x80\x94\xfc\x02;100644 message\x00K\xca\xa359/O\x0f\xb3_\xdaX\x01\x7dA\xfa\x07\xdd\xeb\x8b100644 pi\x00\xe5\xc1\xce\xbc\xac\xfc\x81\xcfQ\xa6\x1c\x03\x1eqm\x87I\x816\x0e
log($table.data8[Table.typeOffset(defaults)], Type.tree);
//=> 9 9
log($table.data32[pointer32 + 0], get(defaults, 0), hash(42));
//=> 260 260 260
log(val(get(defaults, 0)));
//=> 42
log(val(get(defaults, 1)));
//=> I <3 short messages
log(val(get(defaults, 2)));
//=> 3.141592653589793

var defaults2 = createDefaults({
    child: defaults,
});
log(get(defaults2, 0), defaults);
//=> 68 68
pointer32 = defaults2 >> 2;
moldIndex = $table.data32[pointer32 + Table.data32_moldIndex];
log(moldIndex);
//=> 2
var mold32 = moldIndex * Mold.data32_size;
var fileStart = $mold.data32[mold32 + Mold.data32_fileStart];
var fileEnd = $mold.data32[mold32 + Mold.data32_fileEnd];
log(pretty($mold.fileArray, fileStart, fileEnd));
//=> tree 32\x0040000 child\x00\xffL\xa8V=\xc7\x0d\x98\xa1nv\x82\xf4\xe8\xc9\xd9\xce-\x0d\x0b
// Note: mode 40000 (tree)
