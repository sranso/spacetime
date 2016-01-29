var helper = require('../helper');

Random.seed(1);
log('1st random number ' + Random.rand().toString(16));
//=> 1st random number 26ec56eb
log('2nd random number ' + Random.rand().toString(16));
//=> 2nd random number a2624520
log('3rd random number ' + Random.rand().toString(16));
//=> 3rd random number 6bad88f1
log('4th random number ' + Random.rand().toString(16));
//=> 4th random number 4e3e2450
log('5th random number ' + Random.rand().toString(16));
//=> 5th random number dcf2fc01

var mult = 1751468273; // arbitrary odd number
var bins = [];
var i;
for (i = 0; i < 64; i++) {
    bins[i] = 0;
}

for (i = 0; i < 10000000; i++) {
    // 26 == 32 - 6; 6 bits in 64
    bins[Math.imul(mult, Random.rand()) >>> 26]++;
}
var lines = [];
for (i = 0; i < 64; i++) {
    lines[i] = ('  ' + i).slice(-3) + ' ' + bins[i];
}
log(lines.join('\n'));
//=>   0 156015
//=>   1 156416
//=>   2 155847
//=>   3 156252
//=>   4 156227
//=>   5 156122
//=>   6 155750
//=>   7 156666
//=>   8 156739
//=>   9 155952
//=>  10 156421
//=>  11 156423
//=>  12 156093
//=>  13 157285
//=>  14 156548
//=>  15 155940
//=>  16 156759
//=>  17 156712
//=>  18 156122
//=>  19 156300
//=>  20 155724
//=>  21 156527
//=>  22 156482
//=>  23 156300
//=>  24 156670
//=>  25 155998
//=>  26 156355
//=>  27 156527
//=>  28 156158
//=>  29 156249
//=>  30 156228
//=>  31 156444
//=>  32 156505
//=>  33 156027
//=>  34 155828
//=>  35 156100
//=>  36 155989
//=>  37 155842
//=>  38 155824
//=>  39 156001
//=>  40 155654
//=>  41 156481
//=>  42 155751
//=>  43 156540
//=>  44 155247
//=>  45 155848
//=>  46 156282
//=>  47 156637
//=>  48 157246
//=>  49 156231
//=>  50 156778
//=>  51 155753
//=>  52 156857
//=>  53 156886
//=>  54 156637
//=>  55 155463
//=>  56 156439
//=>  57 155266
//=>  58 155697
//=>  59 156404
//=>  60 156441
//=>  61 156524
//=>  62 156223
//=>  63 156348

if (helper.runBenchmarks) {

    console.time('Math.random');
    for (i = 0; i < 10000000; i++) {
        Math.random();
    }
    console.timeEnd('Math.random');

    console.time('Random.rand');
    for (i = 0; i < 10000000; i++) {
        Random.rand();
    }
    console.timeEnd('Random.rand');
}
