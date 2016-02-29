'use strict';
global.Sha1 = {};
(function () {

// 512 / 8  = 64
// 512 / 32 = 16

var W = new Int32Array(80);
var W8 = new Uint8Array(W.buffer, 0, 16 * 4);

var H0, H1, H2, H3, H4;

Sha1.hash = function (M_array, M_start, M_end, H_array, H_offset) {
    if (!(M_array instanceof Uint8Array)) {
        throw new Error('M_array is not a Uint8Array');
    }
    if (typeof M_start !== 'number') {
        throw new Error('M_start is not a number');
    }
    if (typeof M_end !== 'number') {
        throw new Error('M_end is not a number');
    }
    if (!(H_array instanceof Uint8Array)) {
        throw new Error('H_array is not a Uint8Array');
    }
    if (typeof H_offset !== 'number') {
        throw new Error('H_offset is not a number');
    }

    var startByte;

    // Set initial hash value [5.3.1]
    H0 = 0x67452301 | 0;
    H1 = 0xefcdab89 | 0;
    H2 = 0x98badcfe | 0;
    H3 = 0x10325476 | 0;
    H4 = 0xc3d2e1f0 | 0;

    var M_length = M_end - M_start;
    var lastBlockBytes = M_length % 64;
    var fullBlockEnd = M_end - lastBlockBytes;
    var i;
    for (startByte = M_start; startByte < fullBlockEnd; startByte += 64) {
        writeBigEndian(M_array, W8, W, startByte, 64);
        hashBlock(W);
    }

    var i;
    for (i = 0; i < 16; i++) {
        W[i] = 0;
    }
    writeBigEndian(M_array, W8, W, startByte, lastBlockBytes);

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
    W[15] = M_length * 8;
    hashBlock(W);

    // Write hash to output array
    H_array[H_offset] = H0 >>> 24;
    H_array[H_offset + 1] = (H0 >>> 16) & 0xff;
    H_array[H_offset + 2] = (H0 >>> 8) & 0xff;
    H_array[H_offset + 3] = H0 & 0xff;

    H_array[H_offset + 4] = H1 >>> 24;
    H_array[H_offset + 5] = (H1 >>> 16) & 0xff;
    H_array[H_offset + 6] = (H1 >>> 8) & 0xff;
    H_array[H_offset + 7] = H1 & 0xff;

    H_array[H_offset + 8] = H2 >>> 24;
    H_array[H_offset + 9] = (H2 >>> 16) & 0xff;
    H_array[H_offset + 10] = (H2 >>> 8) & 0xff;
    H_array[H_offset + 11] = H2 & 0xff;

    H_array[H_offset + 12] = H3 >>> 24;
    H_array[H_offset + 13] = (H3 >>> 16) & 0xff;
    H_array[H_offset + 14] = (H3 >>> 8) & 0xff;
    H_array[H_offset + 15] = H3 & 0xff;

    H_array[H_offset + 16] = H4 >>> 24;
    H_array[H_offset + 17] = (H4 >>> 16) & 0xff;
    H_array[H_offset + 18] = (H4 >>> 8) & 0xff;
    H_array[H_offset + 19] = H4 & 0xff;
};

// Hash computation [6.1.2]
var hashBlock = function (W) {
    var t;

    var a, b, c, d, e;
    var T, W_t, W_temp;

    a = H0;
    b = H1;
    c = H2;
    d = H3;
    e = H4;

    for (t = 0; t < 16; t++) {
        // T = ROTL(5, a) + f(t, b, c, d) + e + K[t] + W[t];
        T = ((a << 5) | (a >>> 27)) + ((b & c) ^ (~b & d)) + e + 0x5a827999 + W[t];
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
        T = ((a << 5) | (a >>> 27)) + ((b & c) ^ (~b & d)) + e + 0x5a827999 + W_t;
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
        T = ((a << 5) | (a >>> 27)) + (b ^ c ^ d) + e + 0x6ed9eba1 + W_t;
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
        T = ((a << 5) | (a >>> 27)) + ((b & c) ^ (b & d) ^ (c & d)) + e + 0x8f1bbcdc + W_t;
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
        T = ((a << 5) | (a >>> 27)) + (b ^ c ^ d) + e + 0xca62c1d6 + W_t;
        e = d;
        d = c;
        // c = ROTL(30, b);
        c = (b << 30) | (b >>> 2);
        b = a;
        a = T;
    }

    // 3. Compute the intermediate hash value
    H0 = (a + H0) | 0;
    H1 = (b + H1) | 0;
    H2 = (c + H2) | 0;
    H3 = (d + H3) | 0;
    H4 = (e + H4) | 0;
};

var writeBigEndian = function (M_array, W8, W, offset, length) {
    var lengthExtra = length % 4;
    var j = length - lengthExtra;
    var i;
    for (i = 0; i < j; i += 4) {
        W[i >> 2] = (
            (M_array[offset + i] << 24) |
            (M_array[offset + i + 1] << 16) |
            (M_array[offset + i + 2] << 8) |
            M_array[offset + i + 3]
        );
    }

    switch (lengthExtra) {
    case 3:
        W8[j + 1] = M_array[offset + j + 2];
    case 2:
        W8[j + 2] = M_array[offset + j + 1];
    case 1:
        W8[j + 3] = M_array[offset + j];
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
