'use strict';
require('../../test/helper');

var random = Random.create(1);
log('1st random number ' + Random.uint32(random).toString(16));
//=> 1st random number 26ec56eb
log('2nd random number ' + Random.uint32(random).toString(16));
//=> 2nd random number a2624520
log('3rd random number ' + Random.uint32(random).toString(16));
//=> 3rd random number 6bad88f1
log('4th random number ' + Random.uint32(random).toString(16));
//=> 4th random number 4e3e2450

var clone = Random.clone(random);
log(Random.uint32(random).toString(16), '=', Random.uint32(clone).toString(16));
//=> dcf2fc01 = dcf2fc01

var mult = 1751468273; // arbitrary odd number
var bins = [];
var i;
for (i = 0; i < 64; i++) {
    bins[i] = 0;
}

for (i = 0; i < 500000; i++) {
    // 26 == 32 - 6; 6 bits in 64
    bins[Math.imul(mult, Random.uint32(random)) >>> 26]++;
}
var lines = [];
for (i = 0; i < 64; i++) {
    lines[i] = (' ' + i).slice(-2) + ' ' + bins[i];
}
log(lines.join('\n'));
//=>  0 7801
//=>  1 7941
//=>  2 7689
//=>  3 7811
//=>  4 7774
//=>  5 7856
//=>  6 7845
//=>  7 7849
//=>  8 7775
//=>  9 7770
//=> 10 7856
//=> 11 7732
//=> 12 7766
//=> 13 7948
//=> 14 7831
//=> 15 7774
//=> 16 7918
//=> 17 7921
//=> 18 7850
//=> 19 7945
//=> 20 7622
//=> 21 7778
//=> 22 7758
//=> 23 7736
//=> 24 7883
//=> 25 7727
//=> 26 7911
//=> 27 7806
//=> 28 7916
//=> 29 7748
//=> 30 7643
//=> 31 7752
//=> 32 7871
//=> 33 7903
//=> 34 7791
//=> 35 7726
//=> 36 7930
//=> 37 7661
//=> 38 7667
//=> 39 7740
//=> 40 7593
//=> 41 7872
//=> 42 7609
//=> 43 7924
//=> 44 7779
//=> 45 7889
//=> 46 7749
//=> 47 7869
//=> 48 7927
//=> 49 7713
//=> 50 7866
//=> 51 7899
//=> 52 7860
//=> 53 7817
//=> 54 7895
//=> 55 7767
//=> 56 7841
//=> 57 7695
//=> 58 7896
//=> 59 7932
//=> 60 7830
//=> 61 7863
//=> 62 7847
//=> 63 7847
