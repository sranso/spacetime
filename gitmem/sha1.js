'use strict';
global.Sha1 = {};
(function () {

// 512 bits / 8  = 64 bytes
// 512 bits / 32 = 16 words

var W = new Int32Array(80);
var W8 = new Uint8Array(W.buffer, 0, 16 * 4);

var H0, H1, H2, H3, H4;

Sha1.hash = function ($m, messageStart, messageEnd, $h, hashOffset) {
    if (!($m instanceof Uint8Array)) {
        throw new Error('$m is not a Uint8Array');
    }
    if (typeof messageStart !== 'number') {
        throw new Error('messageStart is not a number');
    }
    if (typeof messageEnd !== 'number') {
        throw new Error('messageEnd is not a number');
    }
    if (!($h instanceof Uint8Array)) {
        throw new Error('$h is not a Uint8Array');
    }
    if (typeof hashOffset !== 'number') {
        throw new Error('hashOffset is not a number');
    }

    var startByte;

    // Set initial hash value [5.3.1]
    H0 = 0x67452301 | 0;
    H1 = 0xefcdab89 | 0;
    H2 = 0x98badcfe | 0;
    H3 = 0x10325476 | 0;
    H4 = 0xc3d2e1f0 | 0;

    var messageLength = messageEnd - messageStart;
    var lastBlockBytes = messageLength % 64;
    var fullBlockEnd = messageEnd - lastBlockBytes;
    var i;
    for (startByte = messageStart; startByte < fullBlockEnd; startByte += 64) {
        for (i = 0; i < 64; i += 4) {
            W[i >>> 2] = (
                ($m[startByte + i] << 24) |
                ($m[startByte + i + 1] << 16) |
                ($m[startByte + i + 2] << 8) |
                $m[startByte + i + 3]
            );
        }
        hashBlock(W);
    }

    var i;
    for (i = 0; i < 16; i++) {
        W[i] = 0;
    }

    var lastWordBytes = lastBlockBytes % 4;
    var lastBlockBytesAligned = lastBlockBytes - lastWordBytes;
    for (i = 0; i < lastBlockBytesAligned; i += 4) {
        W[i >>> 2] = (
            ($m[startByte + i] << 24) |
            ($m[startByte + i + 1] << 16) |
            ($m[startByte + i + 2] << 8) |
            $m[startByte + i + 3]
        );
    }

    switch (lastWordBytes) {
    case 3:
        W8[i + 1] = $m[startByte + i + 2];
    case 2:
        W8[i + 2] = $m[startByte + i + 1];
    case 1:
        W8[i + 3] = $m[startByte + i];
    }

    // Pad the message with a "one" bit [5.1.1]
    W8[lastBlockBytes + 3 - lastWordBytes - lastWordBytes] = 0x80;

    if (lastBlockBytes > 64 - 8 - 1) {
        hashBlock(W);
        for (i = 0; i < 16; i++) {
            W[i] = 0;
        }
    }

    // Append the length in bits [5.1.1]
    // Message must be less than 500 MB (for this implementation)
    W[15] = messageLength * 8;
    hashBlock(W);

    // Write hash to output array
    $h[hashOffset] = H0 >>> 24;
    $h[hashOffset + 1] = (H0 >>> 16) & 0xff;
    $h[hashOffset + 2] = (H0 >>> 8) & 0xff;
    $h[hashOffset + 3] = H0 & 0xff;

    $h[hashOffset + 4] = H1 >>> 24;
    $h[hashOffset + 5] = (H1 >>> 16) & 0xff;
    $h[hashOffset + 6] = (H1 >>> 8) & 0xff;
    $h[hashOffset + 7] = H1 & 0xff;

    $h[hashOffset + 8] = H2 >>> 24;
    $h[hashOffset + 9] = (H2 >>> 16) & 0xff;
    $h[hashOffset + 10] = (H2 >>> 8) & 0xff;
    $h[hashOffset + 11] = H2 & 0xff;

    $h[hashOffset + 12] = H3 >>> 24;
    $h[hashOffset + 13] = (H3 >>> 16) & 0xff;
    $h[hashOffset + 14] = (H3 >>> 8) & 0xff;
    $h[hashOffset + 15] = H3 & 0xff;

    $h[hashOffset + 16] = H4 >>> 24;
    $h[hashOffset + 17] = (H4 >>> 16) & 0xff;
    $h[hashOffset + 18] = (H4 >>> 8) & 0xff;
    $h[hashOffset + 19] = H4 & 0xff;
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

})();
