'use strict';
var Sha1 = {};

// 512 / 8  = 64
// 512 / 32 = 16

var K;
var initConstants = function () {
    K = new Int32Array(80);
    var k = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];

    // Initialize constants [4.2.1]
    for (var t = 0; t < 80; t++) {
        K[t] = k[Math.floor(t / 20)] | 0;
    }
};
initConstants();

var W = new Int32Array(80 + 5);
var W8 = new Uint8Array(W.buffer, 0, 16 * 4);


Sha1.hash = function (M) {
    var l_bytes = M.length;
    var startByte;

    // Set initial hash value [5.3.1]
    W[80] = 0x67452301 | 0;
    W[81] = 0xefcdab89 | 0;
    W[82] = 0x98badcfe | 0;
    W[83] = 0x10325476 | 0;
    W[84] = 0xc3d2e1f0 | 0;

    var lastBlockBytes = l_bytes % 64;
    var fullBlockBytes = l_bytes - lastBlockBytes;
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

    return hexWord(W[80]) + hexWord(W[81]) + hexWord(W[82]) + hexWord(W[83]) + hexWord(W[84]);
};

// Hash computation [6.1.2]
var hashBlock = function (W) {
    var t;

    var a, b, c, d, e;
    var T, W_t, W_temp;

    a = W[80];
    b = W[81];
    c = W[82];
    d = W[83];
    e = W[84];

    for (t = 0; t < 16; t++) {
        // T = ROTL(5, a) + f(t, b, c, d) + e + K[t] + W[t];
        T = ((a << 5) | (a >>> 27)) + ((b & c) ^ (~b & d)) + e + K[t] + W[t];
        e = d;
        d = c;
        // c = ROTL(30, b);
        c = (b << 30) | (b >>> 2);
        b = a;
        a = T;
    }

    for (; t < 20; t++) {
        // T = ROTL(5, a) + f(t, b, c, d) + e + K[t] + W[t];
        W_temp = W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16];
        // W[t] = ROTL(1, W_temp);
        W_t = W[t] = (W_temp << 1) | (W_temp >>> 31);
        T = ((a << 5) | (a >>> 27)) + ((b & c) ^ (~b & d)) + e + K[t] + W_t;
        e = d;
        d = c;
        // c = ROTL(30, b);
        c = (b << 30) | (b >>> 2);
        b = a;
        a = T;
    }

    for (; t < 40; t++) {
        // T = ROTL(5, a) + f(t, b, c, d) + e + K[t] + W[t];
        W_temp = W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16];
        // W[t] = ROTL(1, W_temp);
        W_t = W[t] = (W_temp << 1) | (W_temp >>> 31);
        T = ((a << 5) | (a >>> 27)) + (b ^ c ^ d) + e + K[t] + W_t;
        e = d;
        d = c;
        // c = ROTL(30, b);
        c = (b << 30) | (b >>> 2);
        b = a;
        a = T;
    }

    for (; t < 60; t++) {
        // T = ROTL(5, a) + f(t, b, c, d) + e + K[t] + W[t];
        W_temp = W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16];
        // W[t] = ROTL(1, W_temp);
        W_t = W[t] = (W_temp << 1) | (W_temp >>> 31);
        T = ((a << 5) | (a >>> 27)) + ((b & c) ^ (b & d) ^ (c & d)) + e + K[t] + W_t;
        e = d;
        d = c;
        // c = ROTL(30, b);
        c = (b << 30) | (b >>> 2);
        b = a;
        a = T;
    }

    for (; t < 80; t++) {
        // T = ROTL(5, a) + f(t, b, c, d) + e + K[t] + W[t];
        W_temp = W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16];
        // W[t] = ROTL(1, W_temp);
        W_t = W[t] = (W_temp << 1) | (W_temp >>> 31);
        T = ((a << 5) | (a >>> 27)) + (b ^ c ^ d) + e + K[t] + W_t;
        e = d;
        d = c;
        // c = ROTL(30, b);
        c = (b << 30) | (b >>> 2);
        b = a;
        a = T;
    }

    // 3. Compute the intermediate hash value
    W[80] = (a + W[80]) | 0;
    W[81] = (b + W[81]) | 0;
    W[82] = (c + W[82]) | 0;
    W[83] = (d + W[83]) | 0;
    W[84] = (e + W[84]) | 0;
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

var hexWord = function (word) {
    if (word < 0) {
        word += Math.pow(2, 32);
    }
    var hex = '00000000' + word.toString(16);
    return hex.slice(hex.length - 8);
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

module.exports = Sha1;
