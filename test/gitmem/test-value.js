var helper = require('../helper');

var blob = Value.blobFromString('foo');
log(helper.pretty(blob));
//=> blob 3\x00foo
log(Value.parseString(blob));
//=> foo

blob = Value.blobFromNumber(375.2);
log(helper.pretty(blob));
//=> blob 5\x00375.2
var number = Value.parseNumber(blob);
log(number, typeof number);
//=> 375.2 'number'

blob = Value.blobFromBoolean(true);
log(helper.pretty(blob));
//=> blob 4\x00true
var bool = Value.parseBoolean(blob);
log(bool, typeof bool);
//=> true 'boolean'
