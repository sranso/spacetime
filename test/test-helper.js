var fs = require('fs');
var path = require('path');

var loader = require('./loader');

var html = fs.readFileSync(path.resolve(__dirname, '../new.html'), 'utf-8');
loader.loadNode(html);
