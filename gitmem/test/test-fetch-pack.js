'use strict';
require('../../test/helper');

global.$file = new Uint8Array(256);
global.$pack = new Uint8Array(256);
global.$ = new Uint32Array(32);
$.nextIndex = 0;
global.$table = Table.create(32, Random.create(6889162));
global.$mold = Mold.create(8, 512);

Constants.initialize(-1, 1);
Commit.initialize();

log(FetchPack.postPath);
//=> /git-upload-pack
log(FetchPack.postContentType);
//=> application/x-git-upload-pack-request

var getResponseString = (
    '001e# service=git-upload-pack\n' +
    '000000d1c24691ec29fc2bde96ecbbe73ec0625cc3199966 HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/2.6.2\n' +
    '003cf058e064dc438ca61341d2ca56d0cbda04cac2a3 refs/heads/foo\n' +
    '003fc24691ec29fc2bde96ecbbe73ec0625cc3199966 refs/heads/master\n' +
    '0000'
);
var getResponse = Convert.stringToArray(getResponseString);

log(FetchPack.validateGetResponse(getResponse));
//=> null

getResponse[4] = 'x';
log(FetchPack.validateGetResponse(getResponse));
//=> Incorrect start of get response

getResponse = Convert.stringToArray(getResponseString.replace('thin-pack', 'xxxx-xxxx'));
log(FetchPack.validateGetResponse(getResponse));
//=> Missing fetch-pack capability: thin-pack


getResponse = Convert.stringToArray(getResponseString);

var refs = FetchPack.refsFromGetResponse(getResponse);
log(refs.length);
//=> 3
log(refs[0][0]);
//=> HEAD
log(hexHash($table.hashes8, refs[0][1]));
//=> c24691ec29fc2bde96ecbbe73ec0625cc3199966
log(refs[1][0]);
//=> refs/heads/foo
log(hexHash($table.hashes8, refs[1][1]));
//=> f058e064dc438ca61341d2ca56d0cbda04cac2a3
log(refs[2][0]);
//=> refs/heads/master
log(hexHash($table.hashes8, refs[2][1]));
//=> c24691ec29fc2bde96ecbbe73ec0625cc3199966

getResponseString = '001e# service=git-upload-pack\n00000000';
getResponse = Convert.stringToArray(getResponseString);
var emptyRefs = FetchPack.refsFromGetResponse(getResponse);
log(emptyRefs.length);
//=> 0

getResponseString = (
    '001e# service=git-upload-pack\n' +
    '000000c59b2c1027ea7cd211885b32a8a954574a1da1fdb0 refs/heads/test-branch\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow no-progress include-tag multi_ack_detailed no-done agent=git/2.6.2' +
    '0000'
);
getResponse = Convert.stringToArray(getResponseString);
var singleRef = FetchPack.refsFromGetResponse(getResponse);
log(singleRef.length, singleRef[0][0]);
//=> 1 'refs/heads/test-branch'









var user = set(Commit.User.zero,
               Commit.User.email, hash('jake@jakesandlund.com'),
               Commit.User.timezoneOffset, hash(360),
               Commit.User.name, hash('Jake Sandlund'));

var info = set(Commit.Info.zero,
               Commit.Info.author, user,
               Commit.Info.committer, user);

var commit1 = commit(Commit.zero,
                     Commit.message, hash('My test commit'),
                     Commit.committerTime, hash(1463772798),
                     Commit.tree, $[Constants.emptyTree],
                     Commit.info, info,
                     Commit.parent, 0);
log(hexHash($table.hashes8, commit1));
//=> d445dd84cfb7cd6de47fc0c75bfb6943d7a7499a

var commit2 = commit(Commit.zero,
                     Commit.message, hash('second commit'),
                     Commit.committerTime, hash(1463930072),
                     Commit.tree, $[Constants.emptyTree],
                     Commit.info, info,
                     Commit.parent, commit1);
log(hexHash($table.hashes8, commit2));
//=> a2270ed3a23dff04dc5810811c02ece68fee803b

var packLength = Pack.create(commit2);

var want = refs[1][1];
var body = FetchPack.postBody(want, 0);
log(pretty(body));
//=> 0050want f058e064dc438ca61341d2ca56d0cbda04cac2a3\x00 thin-pack agent=gitmem/0.0.0
//=> 00000009done
//=>

body = FetchPack.postBody(want, commit2);
log(pretty(body));
//=> 0050want f058e064dc438ca61341d2ca56d0cbda04cac2a3\x00 thin-pack agent=gitmem/0.0.0
//=> 00000032have a2270ed3a23dff04dc5810811c02ece68fee803b
//=> 0032have d445dd84cfb7cd6de47fc0c75bfb6943d7a7499a
//=> 0009done
//=>








var postResponse = Convert.stringToArray('0008NAK\nPACK 1');
var pack = FetchPack.packFromPostResponse(postResponse);
log(pretty(pack));
//=> PACK 1
postResponse = Convert.stringToArray('0031ACK 1c78104e0c37f9204618a6fc8a860af3a9e7cd36\nPACK 2');
pack = FetchPack.packFromPostResponse(postResponse);
log(pretty(pack));
//=> PACK 2

postResponse = Convert.stringToArray('');
pack = FetchPack.packFromPostResponse(postResponse);
log(pack);
//=> null

postResponse = Convert.stringToArray('0009oops!0000');
pack = FetchPack.packFromPostResponse(postResponse);
log(pack);
//=> null
