'use strict';
var Reference = {};
(function () {

Reference.create = function () {
    return {
        sink: null,
        source: null,
        absolute: false,
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

Reference.toggleAbsolute = function () {
    if (Global.inputReferenceIs.length) {
        var references = Global.inputStepView.step.references;
        var absolute = references[Global.inputReferenceIs[0]].absolute;
        var sources = _.pluck(references, 'source');
        _.each(Global.active.stretches, function (stretch) {
            var references = stretch.steps[0].references;
            _.each(Global.inputReferenceIs, function (referenceI) {
                references[referenceI].absolute = !absolute;
                Reference.setSource(references[referenceI], sources[referenceI]);
            });
        });
        d3.event.preventDefault();
    }
};

})();