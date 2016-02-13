require('../helper');

var getResponseString = (
    '001e# service=git-upload-pack\n' +
    '000000d1c24691ec29fc2bde96ecbbe73ec0625cc3199966 HEAD\0' +
    'multi_ack thin-pack side-band side-band-64k ofs-delta shallow no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/master agent=git/2.6.2\n' +
    '003fc24691ec29fc2bde96ecbbe73ec0625cc3199966 refs/heads/master\n' +
    '0000'
);
var getResponse = GitFile.stringToArray(getResponseString);

log(FetchPack.validateGetResponse(getResponse));
//=> null

getResponse[4] = 'x';
log(FetchPack.validateGetResponse(getResponse));
//=> incorrect start of get response

getResponse = GitFile.stringToArray(getResponseString.replace('side-band-64k', 'side-band-00x'));
log(FetchPack.validateGetResponse(getResponse));
//=> missing fetch-pack capability: side-band-64k
