'use strict';
var DrawAutocomplete = {};
(function () {

var autocompleteContainerEl;

DrawAutocomplete.setup = function () {
    autocompleteContainerEl = Draw.trackHtml.select('#autocomplete');
};

DrawAutocomplete.draw = function () {
    if (!Global.autocomplete) {
        autocompleteContainerEl
            .style('display', 'none');

        return;
    }

    var inputEl = Global.inputStepView.__el__;
    var top = inputEl.offsetTop + inputEl.offsetHeight;

    autocompleteContainerEl
        .style('display', 'block')
        .style('top', top + 'px') ;

    var autocompleteEls = autocompleteContainerEl.selectAll('.autocomplete')
        .data(Global.autocomplete) ;

    var autocompleteEnterEls = autocompleteEls.enter().append('div')
        .attr('class', 'autocomplete')
        .on('mousedown', function (d) {
            Autocomplete.select(d);
        }) ;

    autocompleteEls.exit().remove();

    autocompleteEls
        .text(function (d) { return d.text }) ;
};

})();
