'use strict';
var DrawReferences = {};
(function () {

DrawReferences.referenceClass = function (step, containingStep, referenceI) {
    if (step.referenceAway == null || !Main.targetStepView()) {
        return '';
    }
    var lastTargetStep = Main.targetStepView().steps[Main.targetStepView().steps.length - 1];
    if (containingStep && containingStep !== lastTargetStep) {
        return '';
    }

    var classes = [];
    if (_.contains(Global.insertReferenceIs, referenceI)) {
        classes.push('reference-inserting');
    }
    if (step.referenceAway <= 4) {
        classes.push('reference-color-' + step.referenceAway);
    } else {
        classes.push('reference-color-5-or-more');
    }
    return classes.join(' ');
}

DrawReferences.updateInserting = function () {
    Global.insertReferenceIs = [];
    if (!Global.insertStepView) {
        return;
    }
    var cursorRange = DomRange.currentRange();
    if (!cursorRange) {
        return;
    }
    var stepView = Global.insertStepView;
    var stepEl = d3.select(stepView.__el__);
    var container = stepEl.select('.expression-container');
    var references = stepView.step.references;

    cursorRange = cursorRange.cloneRange();
    var start = cursorRange.startContainer;
    if (start.childNodes.length) {
        if (cursorRange.startOffset === start.childNodes.length) {
            start = start.childNodes[cursorRange.startOffset - 1];
            start = DomRange.leafNode(start, 'lastChild');
            cursorRange.setStart(start, DomRange.nodeLength(start));
        } else {
            start = start.childNodes[cursorRange.startOffset];
            start = DomRange.leafNode(start, 'firstChild');
            cursorRange.setStart(start, 0);
        }
    }
    var end = cursorRange.endContainer;
    if (end.childNodes.length) {
        if (cursorRange.endOffset === 0) {
            end = end.childNodes[cursorRange.endOffset];
            end = DomRange.leafNode(end, 'firstChild');
            cursorRange.setEnd(end, 0);
        } else {
            end = end.childNodes[cursorRange.endOffset - 1]
            end = DomRange.leafNode(end, 'lastChild');
            cursorRange.setEnd(end, DomRange.nodeLength(end));
        }
    }

    var cursorIndex = -0.5;
    _.each(references, function (reference, i) {
        var textEl = container.select('.reference-text.reference-' + i).node();
        var range = document.createRange();
        range.selectNodeContents(textEl);
        if (textEl.previousSibling && textEl.previousSibling.nodeType === 3) {
            var offset = textEl.previousSibling.nodeValue.length;
            range.setStart(textEl.previousSibling, offset);
        }
        if (textEl.nextSibling && textEl.nextSibling.nodeType === 3) {
            range.setEnd(textEl.nextSibling, 0);
        }

        // The naming of Range.END_TO_START is awful, since you'd
        // think that END would apply to cursorRange and START would
        // apply to range, because that's how they're layed out
        // spatially, but no it's the opposite. So I'm using
        // "flipped" names.
        // -1 means cursor is before, +1 means it is after.
        var cursorStartToRefEnd = cursorRange.compareBoundaryPoints(Range.END_TO_START, range);
        var cursorEndToRefStart = cursorRange.compareBoundaryPoints(Range.START_TO_END, range);
        var cursorEndToRefEnd = cursorRange.compareBoundaryPoints(Range.END_TO_END, range);
        if (cursorEndToRefEnd > 0) {
            cursorIndex = i + 0.5;
        }
        if (cursorStartToRefEnd > 0 || cursorEndToRefStart < 0) {
            return;
        }
        Global.insertReferenceIs.push(i);
    });
    if (!Global.insertReferenceIs.length) {
        Global.insertReferenceIs = [cursorIndex];
    }
};

DrawReferences.draw = function (expressionContainerEls) {
    expressionContainerEls.each(function (d) {
        var container = d3.select(this);

        var containingStep = d.step;
        if (MultiStep.isMultiStep(containingStep)) {
            return;
        }

        var referenceEls = container.selectAll('.reference')
            .data(containingStep.references) ;

        referenceEls.enter().append('div')
            .attr('class', 'reference')
            .on('click', function (d, i) {
                selectReference(container, i);
            }) ;

        referenceEls.exit().remove();

        referenceEls.each(function (reference) {
            d3.select(this)
                .text(DrawHelper.clipNumber(reference.step.result, 6)) ;
        });

        referenceEls.each(function (reference, i) {
            var textEl = container.select('.reference-text.reference-' + i).node();
            var color = DrawReferences.referenceClass(reference.step, containingStep, i);
            d3.select(this)
                .attr('class', 'reference ' + color)
                .style('top', textEl.offsetTop + 'px')
                .style('left', textEl.offsetLeft + 'px')
                .style('width', (textEl.offsetWidth - 2) + 'px') ;
        });
    });
};

var selectReference = function (container, i) {
    var textEl = container.select('.reference-text.reference-' + i).node();

    var range = document.createRange();
    range.setEnd(textEl, 1);
    range.collapse(false);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
};

})();
