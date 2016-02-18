'use strict';
var fs = require('fs');
var path = require('path');

var fileText = fs.readFileSync(__filename, 'utf-8');
var startText = Array(50).join('/');
var start = fileText.indexOf(startText);
var inputText = fileText.slice(start);

var insertIndex = inputText.indexOf('INSERT_HASH_COMPUTATION_HERE');
var beforeInsertIndex = inputText.lastIndexOf('\n', insertIndex) + 1;
var afterInsertIndex = inputText.indexOf('\n', insertIndex) + 1;
var beforeInsert = inputText.slice(0, beforeInsertIndex);
var afterInsert = inputText.slice(afterInsertIndex);

var hashComputation = function () {
    return [
        '    // Iteration 0 - 15\n',
        t0_15(0, 'a', 'b', 'c', 'd', 'e'),
        t0_15(1, 'e', 'a', 'b', 'c', 'd'),
        t0_15(2, 'd', 'e', 'a', 'b', 'c'),
        t0_15(3, 'c', 'd', 'e', 'a', 'b'),
        t0_15(4, 'b', 'c', 'd', 'e', 'a'),
        t0_15(5, 'a', 'b', 'c', 'd', 'e'),
        t0_15(6, 'e', 'a', 'b', 'c', 'd'),
        t0_15(7, 'd', 'e', 'a', 'b', 'c'),
        t0_15(8, 'c', 'd', 'e', 'a', 'b'),
        t0_15(9, 'b', 'c', 'd', 'e', 'a'),
        t0_15(10, 'a', 'b', 'c', 'd', 'e'),
        t0_15(11, 'e', 'a', 'b', 'c', 'd'),
        t0_15(12, 'd', 'e', 'a', 'b', 'c'),
        t0_15(13, 'c', 'd', 'e', 'a', 'b'),
        t0_15(14, 'b', 'c', 'd', 'e', 'a'),
        t0_15(15, 'a', 'b', 'c', 'd', 'e'),

        '\n\n',
        '    // Iteration 16 - 19\n',
        t16_19(16, 'e', 'a', 'b', 'c', 'd'),
        t16_19(17, 'd', 'e', 'a', 'b', 'c'),
        t16_19(18, 'c', 'd', 'e', 'a', 'b'),
        t16_19(19, 'b', 'c', 'd', 'e', 'a'),

        '\n\n',
        '    // Iteration 20 - 39\n',
        t20_39(20, 'a', 'b', 'c', 'd', 'e'),
        t20_39(21, 'e', 'a', 'b', 'c', 'd'),
        t20_39(22, 'd', 'e', 'a', 'b', 'c'),
        t20_39(23, 'c', 'd', 'e', 'a', 'b'),
        t20_39(24, 'b', 'c', 'd', 'e', 'a'),
        t20_39(25, 'a', 'b', 'c', 'd', 'e'),
        t20_39(26, 'e', 'a', 'b', 'c', 'd'),
        t20_39(27, 'd', 'e', 'a', 'b', 'c'),
        t20_39(28, 'c', 'd', 'e', 'a', 'b'),
        t20_39(29, 'b', 'c', 'd', 'e', 'a'),
        t20_39(30, 'a', 'b', 'c', 'd', 'e'),
        t20_39(31, 'e', 'a', 'b', 'c', 'd'),
        t20_39(32, 'd', 'e', 'a', 'b', 'c'),
        t20_39(33, 'c', 'd', 'e', 'a', 'b'),
        t20_39(34, 'b', 'c', 'd', 'e', 'a'),
        t20_39(35, 'a', 'b', 'c', 'd', 'e'),
        t20_39(36, 'e', 'a', 'b', 'c', 'd'),
        t20_39(37, 'd', 'e', 'a', 'b', 'c'),
        t20_39(38, 'c', 'd', 'e', 'a', 'b'),
        t20_39(39, 'b', 'c', 'd', 'e', 'a'),

        '\n\n',
        '    // Iteration 40 - 59\n',
        t40_59(40, 'a', 'b', 'c', 'd', 'e'),
        t40_59(41, 'e', 'a', 'b', 'c', 'd'),
        t40_59(42, 'd', 'e', 'a', 'b', 'c'),
        t40_59(43, 'c', 'd', 'e', 'a', 'b'),
        t40_59(44, 'b', 'c', 'd', 'e', 'a'),
        t40_59(45, 'a', 'b', 'c', 'd', 'e'),
        t40_59(46, 'e', 'a', 'b', 'c', 'd'),
        t40_59(47, 'd', 'e', 'a', 'b', 'c'),
        t40_59(48, 'c', 'd', 'e', 'a', 'b'),
        t40_59(49, 'b', 'c', 'd', 'e', 'a'),
        t40_59(50, 'a', 'b', 'c', 'd', 'e'),
        t40_59(51, 'e', 'a', 'b', 'c', 'd'),
        t40_59(52, 'd', 'e', 'a', 'b', 'c'),
        t40_59(53, 'c', 'd', 'e', 'a', 'b'),
        t40_59(54, 'b', 'c', 'd', 'e', 'a'),
        t40_59(55, 'a', 'b', 'c', 'd', 'e'),
        t40_59(56, 'e', 'a', 'b', 'c', 'd'),
        t40_59(57, 'd', 'e', 'a', 'b', 'c'),
        t40_59(58, 'c', 'd', 'e', 'a', 'b'),
        t40_59(59, 'b', 'c', 'd', 'e', 'a'),

        '\n\n',
        '    // Iteration 60 - 79\n',
        t60_79(60, 'a', 'b', 'c', 'd', 'e'),
        t60_79(61, 'e', 'a', 'b', 'c', 'd'),
        t60_79(62, 'd', 'e', 'a', 'b', 'c'),
        t60_79(63, 'c', 'd', 'e', 'a', 'b'),
        t60_79(64, 'b', 'c', 'd', 'e', 'a'),
        t60_79(65, 'a', 'b', 'c', 'd', 'e'),
        t60_79(66, 'e', 'a', 'b', 'c', 'd'),
        t60_79(67, 'd', 'e', 'a', 'b', 'c'),
        t60_79(68, 'c', 'd', 'e', 'a', 'b'),
        t60_79(69, 'b', 'c', 'd', 'e', 'a'),
        t60_79(70, 'a', 'b', 'c', 'd', 'e'),
        t60_79(71, 'e', 'a', 'b', 'c', 'd'),
        t60_79(72, 'd', 'e', 'a', 'b', 'c'),
        t60_79(73, 'c', 'd', 'e', 'a', 'b'),
        t60_79(74, 'b', 'c', 'd', 'e', 'a'),
        t60_79(75, 'a', 'b', 'c', 'd', 'e'),
        t60_79(76, 'e', 'a', 'b', 'c', 'd'),
        t60_79(77, 'd', 'e', 'a', 'b', 'c'),
        t60_79(78, 'c', 'd', 'e', 'a', 'b'),
        t60_79(79, 'b', 'c', 'd', 'e', 'a'),
    ].join('');
};

var t0_15 = function (t, a, b, c, d, e) {
    var fn = '(('+b+' & '+c+') ^ (~'+b+' & '+d+'))';
    return (
        '    '+e+' += '+rotl(a, 5)+' + '+fn+' + 0x5a827999 + W['+t+'];\n' +
        '    '+b+' = '+rotl(b, 30)+';\n'
    );
};

var t16_19 = function (t, a, b, c, d, e) {
    var fn = '(('+b+' & '+c+') ^ (~'+b+' & '+d+'))';
    return (
        W_t(t) +
        '    '+e+' += '+rotl(a, 5)+' + '+fn+' + 0x5a827999 + W_t;\n' +
        '    '+b+' = '+rotl(b, 30)+';\n'
    );
};

var t20_39 = function (t, a, b, c, d, e) {
    var fn = '('+b+' ^ '+c+' ^ '+d+')';
    return (
        W_t(t) +
        '    '+e+' += '+rotl(a, 5)+' + '+fn+' + 0x6ed9eba1 + W_t;\n' +
        '    '+b+' = '+rotl(b, 30)+';\n'
    );
};

var t40_59 = function (t, a, b, c, d, e) {
    var fn = '(('+b+' & '+c+') ^ ('+b+' & '+d+') ^ ('+c+' & '+d+'))';
    return (
        W_t(t) +
        '    '+e+' += '+rotl(a, 5)+' + '+fn+' + 0x8f1bbcdc + W_t;\n' +
        '    '+b+' = '+rotl(b, 30)+';\n'
    );
};

var t60_79 = function (t, a, b, c, d, e) {
    var fn = '('+b+' ^ '+c+' ^ '+d+')';
    return (
        W_t(t) +
        '    '+e+' += '+rotl(a, 5)+' + '+fn+' + 0xca62c1d6 + W_t;\n' +
        '    '+b+' = '+rotl(b, 30)+';\n'
    );
};

var W_t = function (t) {
    var t3 = t - 3;
    var t8 = t - 8;
    var t14 = t - 14;
    var t16 = t - 16;
    return (
        '    W_temp = W['+t3+'] ^ W['+t8+'] ^ W['+t14+'] ^ W['+t16+'];\n' +
        '    W_t = W['+t+'] = '+rotl('W_temp', 1)+';\n'
    );
};

var rotl = function (x, n) {
    return '((('+x+') << '+n+') | (('+x+') >>> '+(32 - n)+'))';
};

var processed = beforeInsert + hashComputation() + afterInsert;

fs.writeFileSync(__dirname + '/sha1-built.js', processed, 'utf-8');
process.exit(0);




// The JS above this line transforms the JS below.
//////////////////////////////////////////////////////////////////
// sha1-built.js is built by sha1-preprocessor.js


'use strict';
global.Sha1 = {};
(function () {

// 512 / 8  = 64
// 512 / 32 = 16

var W = new Int32Array(80);
var W8 = new Uint8Array(W.buffer, 0, 16 * 4);

var H0, H1, H2, H3, H4;

Sha1.hash = function (M, H, H_offset) {
    if (!(M instanceof Uint8Array)) {
        throw new Error('M is not Uint8Array');
    }
    if (!(H instanceof Uint8Array)) {
        throw new Error('H is not Uint8Array');
    }
    if (typeof H_offset !== 'number') {
        throw new Error('H_offset is not a number');
    }

    var l_bytes = M.length;
    var startByte;

    // Set initial hash value [5.3.1]
    H0 = 0x67452301 | 0;
    H1 = 0xefcdab89 | 0;
    H2 = 0x98badcfe | 0;
    H3 = 0x10325476 | 0;
    H4 = 0xc3d2e1f0 | 0;

    var lastBlockBytes = l_bytes % 64;
    var fullBlockBytes = l_bytes - lastBlockBytes;
    var i;
    for (startByte = 0; startByte < fullBlockBytes; startByte += 64) {
        convBuf(M, W8, W, startByte, 64);
        hashBlock(W);
    }

    var i;
    for (i = 0; i < 16; i++) {
        W[i] = 0;
    }
    convBuf(M, W8, W, startByte, lastBlockBytes);

    // Pad the message with a "one" bit [5.1.1]
    var lastWordBytes = lastBlockBytes % 4;
    W8[lastBlockBytes + 3 - lastWordBytes - lastWordBytes] = 0x80;

    if (lastBlockBytes > 64 - 8 - 1) {
        hashBlock(W);
        for (i = 0; i < 16; i++) {
            W[i] = 0;
        }
    }

    // Append the length in bits [5.1.1]
    // Message must be less than 500 MB (for this implementation)
    W[15] = l_bytes * 8;
    hashBlock(W);

    // Write hash to output array
    H[H_offset] = H0 >>> 24;
    H[H_offset + 1] = (H0 >>> 16) & 0xff;
    H[H_offset + 2] = (H0 >>> 8) & 0xff;
    H[H_offset + 3] = H0 & 0xff;

    H[H_offset + 4] = H1 >>> 24;
    H[H_offset + 5] = (H1 >>> 16) & 0xff;
    H[H_offset + 6] = (H1 >>> 8) & 0xff;
    H[H_offset + 7] = H1 & 0xff;

    H[H_offset + 8] = H2 >>> 24;
    H[H_offset + 9] = (H2 >>> 16) & 0xff;
    H[H_offset + 10] = (H2 >>> 8) & 0xff;
    H[H_offset + 11] = H2 & 0xff;

    H[H_offset + 12] = H3 >>> 24;
    H[H_offset + 13] = (H3 >>> 16) & 0xff;
    H[H_offset + 14] = (H3 >>> 8) & 0xff;
    H[H_offset + 15] = H3 & 0xff;

    H[H_offset + 16] = H4 >>> 24;
    H[H_offset + 17] = (H4 >>> 16) & 0xff;
    H[H_offset + 18] = (H4 >>> 8) & 0xff;
    H[H_offset + 19] = H4 & 0xff;
};

// Hash computation [6.1.2]
var hashBlock = function (W) {
    var t;

    var a, b, c, d, e;
    var W_t, W_temp;

    a = H0;
    b = H1;
    c = H2;
    d = H3;
    e = H4;

    INSERT_HASH_COMPUTATION_HERE

    H0 = (a + H0) | 0;
    H1 = (b + H1) | 0;
    H2 = (c + H2) | 0;
    H3 = (d + H3) | 0;
    H4 = (e + H4) | 0;
};

var convBuf = function (M, W8, W, start, length) {
    var i, lm = length % 4, j = length - lm;
    for (i = 0; i < j; i += 4) {
        W[i >> 2] = M[start + i] << 24 | M[start + i + 1] << 16 | M[start + i + 2] << 8 | M[start + i + 3];
    }
    switch (lm) {
    case 3:
        W8[j + 1] = M[start + j + 2];
    case 2:
        W8[j + 2] = M[start + j + 1];
    case 1:
        W8[j + 3] = M[start + j];
    }
};

// var f = function (t, x, y, z) {
//     var t20 = Math.floor(t / 20);
//     switch (t20) {
//         case 0:
//             return (x & y) ^ (~x & z);
//         case 1:
//         case 3:
//             return x ^ y ^ z;
//         case 2:
//             return (x & y) ^ (x & z) ^ (y & z);
//     }
// };
//
// var ROTL = function (n, x) {
//     return (x << n) | (x >>> (32 - n));
// };

})();
