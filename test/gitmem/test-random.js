require('../helper');

Random.seed(0xf959d463, 0x56afd6e8, 0x8ee4bd6c, 0x8c72d5a5);
log('1: ' + Random.rand().toString(16));
//=> 1: d6cf72f0
log('2: ' + Random.rand().toString(16));
//=> 2: d259d903
log('3: ' + Random.rand().toString(16));
//=> 3: dbe7091
log('4: ' + Random.rand().toString(16));
//=> 4: cce18511
log('5: ' + Random.rand().toString(16));
//=> 5: 5afcac68
