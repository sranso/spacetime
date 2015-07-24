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
            Autocomplete.select(d.step);
            d3.event.stopPropagation();
            d3.event.preventDefault();
        }) ;


    var expressionContainerEnterEls = autocompleteEnterEls.append('div')
        .attr('class', 'expression-container') ;

    expressionContainerEnterEls.append('div')
        .attr('class', 'expression') ;

    autocompleteEls.exit().remove();

    autocompleteEls.each(function (d) { d.__el__ = this });

    autocompleteEls.select('.expression-container').each(function (d) {
        var container = d3.select(this);
        var expressionEl = container.select('.expression').node();

        var html = DrawSteps.stepHtml(d);
        if (expressionEl.innerHTML !== html) {
            expressionEl.innerHTML = html;
        }
    });

    autocompleteEls.select('.expression-container').each(function (d) {
        DrawReferences.draw(this, d, true);
    });
};

})();
