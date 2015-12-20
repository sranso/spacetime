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

// M_input is the message
// M is the message after pre-processing
Sha1.hash = function (M_input) {
    var l_bytes = M_input.length;

    // N is number of blocks after padding
    // 1 for one bit, 8 for length
    var N = Math.ceil((l_bytes + 1 + 8) / 64);
    var N_words = N * 16;

    var M = new Int32Array(N_words);
    var M8 = new Uint8Array(M.buffer);

    // Preprocess the message [5.1.1]
    var i;
    for (i = 0; i <= l_bytes; i += 4) {
        M8[i] = M_input[i + 3];
        M8[i + 1] = M_input[i + 2];
        M8[i + 2] = M_input[i + 1];
        M8[i + 3] = M_input[i];
    }

    // Pad the message with a "one" bit [5.1.1]
    M8[i - (l_bytes & 3) - 1] = 0x80;

    // Append the length in bits [5.1.1]
    // Message must be less than 500 MB
    M[N_words - 1] = l_bytes * 8;

    // Set initial hash value [5.3.1]
    var H0 = 0x67452301 | 0;
    var H1 = 0xefcdab89 | 0;
    var H2 = 0x98badcfe | 0;
    var H3 = 0x10325476 | 0;
    var H4 = 0xc3d2e1f0 | 0;

    // W is message schedule
    var W = new Int32Array(80);
    var t;

    var a, b, c, d, e;
    var T;

    // Hash computation [6.1.2]
    for (i = 0; i < N_words; i += 16) {
        // 1. Prepare the message schedule
        for (t = 0; t < 16; t++) {
            W[t] = M[i + t];
        }
        for (; t < 80; t++) {
            W[t] = ROTL(1, W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16]);
        }

        // 2. Initialize the working variables
        a = H0;
        b = H1;
        c = H2;
        d = H3;
        e = H4;

        for (t = 0; t < 80; t++) {
            T = ROTL(5, a) + f(t, b, c, d) + e + K[t] + W[t];
            e = d;
            d = c;
            c = ROTL(30, b);
            b = a;
            a = T;
        }

        // 3. Compute the intermediate hash value
        H0 = (a + H0) | 0;
        H1 = (b + H1) | 0;
        H2 = (c + H2) | 0;
        H3 = (d + H3) | 0;
        H4 = (e + H4) | 0;
    }

    return hexWord(H0) + hexWord(H1) + hexWord(H2) + hexWord(H3) + hexWord(H4);
};

var hexWord = function (word) {
    if (word < 0) {
        word += Math.pow(2, 32);
    }
    var hex = '00000000' + word.toString(16);
    return hex.slice(hex.length - 8);
};

var f = function (t, x, y, z) {
    var t20 = Math.floor(t / 20);
    switch (t20) {
        case 0:
            return (x & y) ^ (~x & z);
        case 1:
        case 3:
            return x ^ y ^ z;
        case 2:
            return (x & y) ^ (x & z) ^ (y & z);
    }
};

var ROTL = function (n, x) {
    return (x << n) | (x >>> (32 - n));
};

module.exports = Sha1;
