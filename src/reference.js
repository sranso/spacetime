'use strict';
var Reference = {};
(function () {

Reference.create = function () {
    return {
        sink: null,
        source: null,
    };
};

Reference.sentinelCharacter = '☃';

Reference.setSource = function (reference, source) {
    if (reference.source) {
        reference.source.referencedBy = _.without(reference.source.referencedBy, reference);
    }
    source.referencedBy.push(reference);
    reference.source = source;
};

})();
