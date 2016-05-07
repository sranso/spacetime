'use strict';
require('../../test/helper');

log(SendPack.postPath);
//=> /git-receive-pack
log(SendPack.postContentType);
//=> application/x-git-receive-pack-request

log(hex(SendPack.zeroHash));
//=> 0000000000000000000000000000000000000000
log(SendPack.nonePack.length);
//=> 0

var author = {
    name: 'Jake Sandlund',
    email: 'jake@jakesandlund.com',
    time: 1454284683000,
    timezoneOffset: 360,
};

var commitObject = {
    tree: {hash: Tree._actuallyEmptyTreeHash, hashOffset: 0},
    parents: [],
    committer: author,
    author: author,
    message: 'Initial empty commit\n',
};

var commit = CommitFile.create(commitObject);
var commitHash = new Uint8Array(20);
Sha1.hash(commit, commitHash, 0);
log(hex(commitHash));
//=> c24691ec29fc2bde96ecbbe73ec0625cc3199966

var previousHash = new Uint8Array(20);
log(hex(previousHash));
//=> 0000000000000000000000000000000000000000

var branch = 'refs/heads/master';

var pack = Pack.create([commit, Tree._actuallyEmptyTree]);
log(hex(pack));
//=> 5041434b0000000200000002930c789c9dcc3b0ec2301045d1deab980d808c195b6309a1b4d0b2027f26c2103b284c0a768f11ac80e649ef16471666c048c6e6e4d0a4e838faa09d668b71a4ecbc211a23337a8d2aac729d1738873bc325b43cad2dc3e1d6eff099e72f6dd35c8fb0438b86d0d11e361dd4aad75a44f86f409d5a911226e0fa90177c3df50669053d7020789c030000000001e7cc6aed1b4b407fb5c1245e4606f2e3458130fa

var body = SendPack.postBody(branch, commitHash, SendPack.zeroHash, SendPack.nonePack);
log(pretty(body));
//=> 0090c24691ec29fc2bde96ecbbe73ec0625cc3199966 0000000000000000000000000000000000000000 refs/heads/master\x00 report-status quiet agent=gitmem/0.0.0
//=> 0000

body = SendPack.postBody(branch, previousHash, commitHash, pack);
log(pretty(body.subarray(0, 175)));
//=> 00900000000000000000000000000000000000000000 c24691ec29fc2bde96ecbbe73ec0625cc3199966 refs/heads/master\x00 report-status quiet agent=gitmem/0.0.0
//=> 0000PACK\x00\x00\x00\x02\x00\x00\x00\x02\x93\x0cx\x9c\x9d\xcc;\x0e\xc20\x10E\xd1\xde\xab
log(hex(body.subarray(290)));
//=> 3d7020789c030000000001e7cc6aed1b4b407fb5c1245e4606f2e3458130fa