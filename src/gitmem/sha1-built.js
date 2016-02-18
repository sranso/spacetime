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

    // Iteration 0 - 15
    e += (((a) << 5) | ((a) >>> 27)) + ((b & c) ^ (~b & d)) + 0x5a827999 + W[0];
    b = (((b) << 30) | ((b) >>> 2));
    d += (((e) << 5) | ((e) >>> 27)) + ((a & b) ^ (~a & c)) + 0x5a827999 + W[1];
    a = (((a) << 30) | ((a) >>> 2));
    c += (((d) << 5) | ((d) >>> 27)) + ((e & a) ^ (~e & b)) + 0x5a827999 + W[2];
    e = (((e) << 30) | ((e) >>> 2));
    b += (((c) << 5) | ((c) >>> 27)) + ((d & e) ^ (~d & a)) + 0x5a827999 + W[3];
    d = (((d) << 30) | ((d) >>> 2));
    a += (((b) << 5) | ((b) >>> 27)) + ((c & d) ^ (~c & e)) + 0x5a827999 + W[4];
    c = (((c) << 30) | ((c) >>> 2));
    e += (((a) << 5) | ((a) >>> 27)) + ((b & c) ^ (~b & d)) + 0x5a827999 + W[5];
    b = (((b) << 30) | ((b) >>> 2));
    d += (((e) << 5) | ((e) >>> 27)) + ((a & b) ^ (~a & c)) + 0x5a827999 + W[6];
    a = (((a) << 30) | ((a) >>> 2));
    c += (((d) << 5) | ((d) >>> 27)) + ((e & a) ^ (~e & b)) + 0x5a827999 + W[7];
    e = (((e) << 30) | ((e) >>> 2));
    b += (((c) << 5) | ((c) >>> 27)) + ((d & e) ^ (~d & a)) + 0x5a827999 + W[8];
    d = (((d) << 30) | ((d) >>> 2));
    a += (((b) << 5) | ((b) >>> 27)) + ((c & d) ^ (~c & e)) + 0x5a827999 + W[9];
    c = (((c) << 30) | ((c) >>> 2));
    e += (((a) << 5) | ((a) >>> 27)) + ((b & c) ^ (~b & d)) + 0x5a827999 + W[10];
    b = (((b) << 30) | ((b) >>> 2));
    d += (((e) << 5) | ((e) >>> 27)) + ((a & b) ^ (~a & c)) + 0x5a827999 + W[11];
    a = (((a) << 30) | ((a) >>> 2));
    c += (((d) << 5) | ((d) >>> 27)) + ((e & a) ^ (~e & b)) + 0x5a827999 + W[12];
    e = (((e) << 30) | ((e) >>> 2));
    b += (((c) << 5) | ((c) >>> 27)) + ((d & e) ^ (~d & a)) + 0x5a827999 + W[13];
    d = (((d) << 30) | ((d) >>> 2));
    a += (((b) << 5) | ((b) >>> 27)) + ((c & d) ^ (~c & e)) + 0x5a827999 + W[14];
    c = (((c) << 30) | ((c) >>> 2));
    e += (((a) << 5) | ((a) >>> 27)) + ((b & c) ^ (~b & d)) + 0x5a827999 + W[15];
    b = (((b) << 30) | ((b) >>> 2));


    // Iteration 16 - 19
    W_temp = W[13] ^ W[8] ^ W[2] ^ W[0];
    W_t = W[16] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + ((a & b) ^ (~a & c)) + 0x5a827999 + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[14] ^ W[9] ^ W[3] ^ W[1];
    W_t = W[17] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + ((e & a) ^ (~e & b)) + 0x5a827999 + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[15] ^ W[10] ^ W[4] ^ W[2];
    W_t = W[18] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + ((d & e) ^ (~d & a)) + 0x5a827999 + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[16] ^ W[11] ^ W[5] ^ W[3];
    W_t = W[19] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + ((c & d) ^ (~c & e)) + 0x5a827999 + W_t;
    c = (((c) << 30) | ((c) >>> 2));


    // Iteration 20 - 39
    W_temp = W[17] ^ W[12] ^ W[6] ^ W[4];
    W_t = W[20] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + (b ^ c ^ d) + 0x6ed9eba1 + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[18] ^ W[13] ^ W[7] ^ W[5];
    W_t = W[21] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + (a ^ b ^ c) + 0x6ed9eba1 + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[19] ^ W[14] ^ W[8] ^ W[6];
    W_t = W[22] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + (e ^ a ^ b) + 0x6ed9eba1 + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[20] ^ W[15] ^ W[9] ^ W[7];
    W_t = W[23] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + (d ^ e ^ a) + 0x6ed9eba1 + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[21] ^ W[16] ^ W[10] ^ W[8];
    W_t = W[24] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + (c ^ d ^ e) + 0x6ed9eba1 + W_t;
    c = (((c) << 30) | ((c) >>> 2));
    W_temp = W[22] ^ W[17] ^ W[11] ^ W[9];
    W_t = W[25] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + (b ^ c ^ d) + 0x6ed9eba1 + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[23] ^ W[18] ^ W[12] ^ W[10];
    W_t = W[26] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + (a ^ b ^ c) + 0x6ed9eba1 + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[24] ^ W[19] ^ W[13] ^ W[11];
    W_t = W[27] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + (e ^ a ^ b) + 0x6ed9eba1 + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[25] ^ W[20] ^ W[14] ^ W[12];
    W_t = W[28] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + (d ^ e ^ a) + 0x6ed9eba1 + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[26] ^ W[21] ^ W[15] ^ W[13];
    W_t = W[29] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + (c ^ d ^ e) + 0x6ed9eba1 + W_t;
    c = (((c) << 30) | ((c) >>> 2));
    W_temp = W[27] ^ W[22] ^ W[16] ^ W[14];
    W_t = W[30] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + (b ^ c ^ d) + 0x6ed9eba1 + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[28] ^ W[23] ^ W[17] ^ W[15];
    W_t = W[31] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + (a ^ b ^ c) + 0x6ed9eba1 + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[29] ^ W[24] ^ W[18] ^ W[16];
    W_t = W[32] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + (e ^ a ^ b) + 0x6ed9eba1 + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[30] ^ W[25] ^ W[19] ^ W[17];
    W_t = W[33] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + (d ^ e ^ a) + 0x6ed9eba1 + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[31] ^ W[26] ^ W[20] ^ W[18];
    W_t = W[34] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + (c ^ d ^ e) + 0x6ed9eba1 + W_t;
    c = (((c) << 30) | ((c) >>> 2));
    W_temp = W[32] ^ W[27] ^ W[21] ^ W[19];
    W_t = W[35] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + (b ^ c ^ d) + 0x6ed9eba1 + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[33] ^ W[28] ^ W[22] ^ W[20];
    W_t = W[36] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + (a ^ b ^ c) + 0x6ed9eba1 + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[34] ^ W[29] ^ W[23] ^ W[21];
    W_t = W[37] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + (e ^ a ^ b) + 0x6ed9eba1 + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[35] ^ W[30] ^ W[24] ^ W[22];
    W_t = W[38] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + (d ^ e ^ a) + 0x6ed9eba1 + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[36] ^ W[31] ^ W[25] ^ W[23];
    W_t = W[39] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + (c ^ d ^ e) + 0x6ed9eba1 + W_t;
    c = (((c) << 30) | ((c) >>> 2));


    // Iteration 40 - 59
    W_temp = W[37] ^ W[32] ^ W[26] ^ W[24];
    W_t = W[40] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + ((b & c) ^ (b & d) ^ (c & d)) + 0x8f1bbcdc + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[38] ^ W[33] ^ W[27] ^ W[25];
    W_t = W[41] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + ((a & b) ^ (a & c) ^ (b & c)) + 0x8f1bbcdc + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[39] ^ W[34] ^ W[28] ^ W[26];
    W_t = W[42] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + ((e & a) ^ (e & b) ^ (a & b)) + 0x8f1bbcdc + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[40] ^ W[35] ^ W[29] ^ W[27];
    W_t = W[43] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + ((d & e) ^ (d & a) ^ (e & a)) + 0x8f1bbcdc + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[41] ^ W[36] ^ W[30] ^ W[28];
    W_t = W[44] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + ((c & d) ^ (c & e) ^ (d & e)) + 0x8f1bbcdc + W_t;
    c = (((c) << 30) | ((c) >>> 2));
    W_temp = W[42] ^ W[37] ^ W[31] ^ W[29];
    W_t = W[45] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + ((b & c) ^ (b & d) ^ (c & d)) + 0x8f1bbcdc + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[43] ^ W[38] ^ W[32] ^ W[30];
    W_t = W[46] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + ((a & b) ^ (a & c) ^ (b & c)) + 0x8f1bbcdc + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[44] ^ W[39] ^ W[33] ^ W[31];
    W_t = W[47] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + ((e & a) ^ (e & b) ^ (a & b)) + 0x8f1bbcdc + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[45] ^ W[40] ^ W[34] ^ W[32];
    W_t = W[48] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + ((d & e) ^ (d & a) ^ (e & a)) + 0x8f1bbcdc + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[46] ^ W[41] ^ W[35] ^ W[33];
    W_t = W[49] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + ((c & d) ^ (c & e) ^ (d & e)) + 0x8f1bbcdc + W_t;
    c = (((c) << 30) | ((c) >>> 2));
    W_temp = W[47] ^ W[42] ^ W[36] ^ W[34];
    W_t = W[50] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + ((b & c) ^ (b & d) ^ (c & d)) + 0x8f1bbcdc + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[48] ^ W[43] ^ W[37] ^ W[35];
    W_t = W[51] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + ((a & b) ^ (a & c) ^ (b & c)) + 0x8f1bbcdc + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[49] ^ W[44] ^ W[38] ^ W[36];
    W_t = W[52] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + ((e & a) ^ (e & b) ^ (a & b)) + 0x8f1bbcdc + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[50] ^ W[45] ^ W[39] ^ W[37];
    W_t = W[53] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + ((d & e) ^ (d & a) ^ (e & a)) + 0x8f1bbcdc + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[51] ^ W[46] ^ W[40] ^ W[38];
    W_t = W[54] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + ((c & d) ^ (c & e) ^ (d & e)) + 0x8f1bbcdc + W_t;
    c = (((c) << 30) | ((c) >>> 2));
    W_temp = W[52] ^ W[47] ^ W[41] ^ W[39];
    W_t = W[55] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + ((b & c) ^ (b & d) ^ (c & d)) + 0x8f1bbcdc + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[53] ^ W[48] ^ W[42] ^ W[40];
    W_t = W[56] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + ((a & b) ^ (a & c) ^ (b & c)) + 0x8f1bbcdc + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[54] ^ W[49] ^ W[43] ^ W[41];
    W_t = W[57] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + ((e & a) ^ (e & b) ^ (a & b)) + 0x8f1bbcdc + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[55] ^ W[50] ^ W[44] ^ W[42];
    W_t = W[58] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + ((d & e) ^ (d & a) ^ (e & a)) + 0x8f1bbcdc + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[56] ^ W[51] ^ W[45] ^ W[43];
    W_t = W[59] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + ((c & d) ^ (c & e) ^ (d & e)) + 0x8f1bbcdc + W_t;
    c = (((c) << 30) | ((c) >>> 2));


    // Iteration 60 - 79
    W_temp = W[57] ^ W[52] ^ W[46] ^ W[44];
    W_t = W[60] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + (b ^ c ^ d) + 0xca62c1d6 + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[58] ^ W[53] ^ W[47] ^ W[45];
    W_t = W[61] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + (a ^ b ^ c) + 0xca62c1d6 + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[59] ^ W[54] ^ W[48] ^ W[46];
    W_t = W[62] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + (e ^ a ^ b) + 0xca62c1d6 + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[60] ^ W[55] ^ W[49] ^ W[47];
    W_t = W[63] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + (d ^ e ^ a) + 0xca62c1d6 + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[61] ^ W[56] ^ W[50] ^ W[48];
    W_t = W[64] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + (c ^ d ^ e) + 0xca62c1d6 + W_t;
    c = (((c) << 30) | ((c) >>> 2));
    W_temp = W[62] ^ W[57] ^ W[51] ^ W[49];
    W_t = W[65] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + (b ^ c ^ d) + 0xca62c1d6 + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[63] ^ W[58] ^ W[52] ^ W[50];
    W_t = W[66] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + (a ^ b ^ c) + 0xca62c1d6 + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[64] ^ W[59] ^ W[53] ^ W[51];
    W_t = W[67] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + (e ^ a ^ b) + 0xca62c1d6 + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[65] ^ W[60] ^ W[54] ^ W[52];
    W_t = W[68] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + (d ^ e ^ a) + 0xca62c1d6 + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[66] ^ W[61] ^ W[55] ^ W[53];
    W_t = W[69] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + (c ^ d ^ e) + 0xca62c1d6 + W_t;
    c = (((c) << 30) | ((c) >>> 2));
    W_temp = W[67] ^ W[62] ^ W[56] ^ W[54];
    W_t = W[70] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + (b ^ c ^ d) + 0xca62c1d6 + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[68] ^ W[63] ^ W[57] ^ W[55];
    W_t = W[71] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + (a ^ b ^ c) + 0xca62c1d6 + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[69] ^ W[64] ^ W[58] ^ W[56];
    W_t = W[72] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + (e ^ a ^ b) + 0xca62c1d6 + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[70] ^ W[65] ^ W[59] ^ W[57];
    W_t = W[73] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + (d ^ e ^ a) + 0xca62c1d6 + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[71] ^ W[66] ^ W[60] ^ W[58];
    W_t = W[74] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + (c ^ d ^ e) + 0xca62c1d6 + W_t;
    c = (((c) << 30) | ((c) >>> 2));
    W_temp = W[72] ^ W[67] ^ W[61] ^ W[59];
    W_t = W[75] = (((W_temp) << 1) | ((W_temp) >>> 31));
    e += (((a) << 5) | ((a) >>> 27)) + (b ^ c ^ d) + 0xca62c1d6 + W_t;
    b = (((b) << 30) | ((b) >>> 2));
    W_temp = W[73] ^ W[68] ^ W[62] ^ W[60];
    W_t = W[76] = (((W_temp) << 1) | ((W_temp) >>> 31));
    d += (((e) << 5) | ((e) >>> 27)) + (a ^ b ^ c) + 0xca62c1d6 + W_t;
    a = (((a) << 30) | ((a) >>> 2));
    W_temp = W[74] ^ W[69] ^ W[63] ^ W[61];
    W_t = W[77] = (((W_temp) << 1) | ((W_temp) >>> 31));
    c += (((d) << 5) | ((d) >>> 27)) + (e ^ a ^ b) + 0xca62c1d6 + W_t;
    e = (((e) << 30) | ((e) >>> 2));
    W_temp = W[75] ^ W[70] ^ W[64] ^ W[62];
    W_t = W[78] = (((W_temp) << 1) | ((W_temp) >>> 31));
    b += (((c) << 5) | ((c) >>> 27)) + (d ^ e ^ a) + 0xca62c1d6 + W_t;
    d = (((d) << 30) | ((d) >>> 2));
    W_temp = W[76] ^ W[71] ^ W[65] ^ W[63];
    W_t = W[79] = (((W_temp) << 1) | ((W_temp) >>> 31));
    a += (((b) << 5) | ((b) >>> 27)) + (c ^ d ^ e) + 0xca62c1d6 + W_t;
    c = (((c) << 30) | ((c) >>> 2));

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
