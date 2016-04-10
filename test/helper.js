var fs = require('fs');
var path = require('path');

require('./log');
var loader = require('./loader');

var html = fs.readFileSync(path.resolve(__dirname, '../new.html'), 'utf-8');
loader.loadNode(html);

var quietMode = process.argv[2] === 'quiet';
exports.logToTerminal = !quietMode;
