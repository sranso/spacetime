require('../helper');

var getResponseString = (
    '001e# service=git-upload-pack\n' +
    '000000d1c24691ec29fc2bde96ecbbe73ec0625cc3199966 HEAD\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/2.6.2\n' +
    '003cf058e064dc438ca61341d2ca56d0cbda04cac2a3 refs/heads/foo\n' +
    '003fc24691ec29fc2bde96ecbbe73ec0625cc3199966 refs/heads/master\n' +
    '0000'
);
var getResponse = GitFile.stringToArray(getResponseString);

log(FetchPack.validateGetResponse(getResponse));
//=> null

getResponse[4] = 'x';
log(FetchPack.validateGetResponse(getResponse));
//=> incorrect start of get response

getResponse = GitFile.stringToArray(getResponseString.replace('ofs-delta', 'xxx-xxxxx'));
log(FetchPack.validateGetResponse(getResponse));
//=> missing fetch-pack capability: ofs-delta

getResponse = GitFile.stringToArray(getResponseString);

var refs = FetchPack.refsFromGetResponse(getResponse);
log(refs.length);
//=> 3
var ref = refs[0];
log(ref[0], hex(ref[1]));
//=> HEAD c24691ec29fc2bde96ecbbe73ec0625cc3199966
ref = refs[1];
log(ref[0], hex(ref[1]));
//=> refs/heads/foo f058e064dc438ca61341d2ca56d0cbda04cac2a3
ref = refs[2];
log(ref[0], hex(ref[1]));
//=> refs/heads/master c24691ec29fc2bde96ecbbe73ec0625cc3199966

getResponseString = '001e# service=git-upload-pack\n00000000';
getResponse = GitFile.stringToArray(getResponseString);
var emptyRefs = FetchPack.refsFromGetResponse(getResponse);
log(emptyRefs.length);
//=> 0

getResponseString = (
    '001e# service=git-upload-pack\n' +
    '000000c59b2c1027ea7cd211885b32a8a954574a1da1fdb0 refs/heads/test-branch\0multi_ack thin-pack side-band side-band-64k ofs-delta shallow no-progress include-tag multi_ack_detailed no-done agent=git/2.6.2' +
    '0000'
);
getResponse = GitFile.stringToArray(getResponseString);
var singleRef = FetchPack.refsFromGetResponse(getResponse);
log(singleRef.length, singleRef[0][0]);
//=> 1 'refs/heads/test-branch'









var commit1 = CommitObject.clone(CommitObject.none);
commit1.author = commit1.committer = {
    name: 'Jake Sandlund',
    email: 'jake@jakesandlund.com',
    time: 1454907687000,
    timezoneOffset: 360,
};
commit1.tree = {hash: Tree._actuallyEmptyTreeHash, hashOffset: 0};
commit1.parents = [];
commit1.message = 'Initial commit\n';
commit1.file = CommitFile.createFromObject(commit1);
commit1.hash = new Uint8Array(20);
Sha1.hash(commit1.file, commit1.hash, 0);
log(hex(commit1.hash));
//=> b11da54dece45e24d1bfefdba6b5e5ce38ec126b

var commit2 = CommitObject.clone(commit1);
commit2.author = commit2.committer = {
    name: 'snakes',
    email: commit1.author.email,
    time: 1454907943000,
    timezoneOffset: commit1.author.timezoneOffset,
};
commit2.parents = [commit1];
commit2.file = CommitFile.createFromObject(commit2);
commit2.hash = new Uint8Array(20);
Sha1.hash(commit2.file, commit2.hash, 0);
log(hex(commit2.hash));
//=> d278c413b49559191bd25b4f7bac2712b1eb325c

var commit3 = CommitObject.clone(commit2);
commit3.author = commit3.committer = {
    name: commit1.author.name,
    email: commit1.author.email,
    time: 1455421909026,
    timezoneOffset: commit1.author.timezoneOffset,
};
commit3.parents = [
    commit2,
    commit1,
];
commit3.file = CommitFile.createFromObject(commit3);
commit3.hash = new Uint8Array(20);
Sha1.hash(commit3.file, commit3.hash, 0);
log(hex(commit3.hash));
//=> b99282bfec6709ff37988fef2a3f7add47448343

var pack = Pack.create([commit3.file, commit2.file, commit1.file, Tree._actuallyEmptyTree]);
var index = PackIndex.create(pack);
var store = Store.create();

log(FetchPack.postPath);
//=> /git-upload-pack
log(FetchPack.postContentType);
//=> application/x-git-upload-pack-request

var wants = [refs[1][1]];
var have = null;
var body = FetchPack.postBody([index], store, wants, have);
log(pretty(body));
//=> 0050want f058e064dc438ca61341d2ca56d0cbda04cac2a3\x00 ofs-delta agent=gitmem/0.0.0
//=> 00000009done
//=>

wants = [refs[1][1], refs[2][1]];
have = commit3;
commit2.parents = null;
body = FetchPack.postBody([index], store, wants, have);
log(commit2.parents.length);
//=> 1
log(pretty(body));
//=> 0050want f058e064dc438ca61341d2ca56d0cbda04cac2a3\x00 ofs-delta agent=gitmem/0.0.0
//=> 0032want c24691ec29fc2bde96ecbbe73ec0625cc3199966
//=> 00000032have b99282bfec6709ff37988fef2a3f7add47448343
//=> 0032have d278c413b49559191bd25b4f7bac2712b1eb325c
//=> 0032have b11da54dece45e24d1bfefdba6b5e5ce38ec126b
//=> 0009done
//=>








var postResponse = GitFile.stringToArray('0008NAK\nPACK 1');
var pack = FetchPack.packFromPostResponse(postResponse);
log(pretty(pack));
//=> PACK 1
postResponse = GitFile.stringToArray('0031ACK 1c78104e0c37f9204618a6fc8a860af3a9e7cd36\nPACK 2');
pack = FetchPack.packFromPostResponse(postResponse);
log(pretty(pack));
//=> PACK 2
