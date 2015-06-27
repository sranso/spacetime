'use strict';
var DrawReferences = {};
(function () {

DrawReferences.colorForResult = function (resultStepView) {
    var targetStepView = Global.inputStepView || Global.hoverResultStepView || Global.hoverStepView;
    if (!targetStepView) {
        return '';
    }
    if (targetStepView === Global.hoverResultStepView) {
        if (resultStepView === Global.hoverResultStepView) {
            return 'referenced-by-color';
        } else {
            return '';
        }
    }

    var resultStep = resultStepView.steps[resultStepView.steps.length - 1];
    return referenceColorInputAware(targetStepView, resultStep);
};

var colorForReference = function (reference) {
    var targetStepView = Global.inputStepView || Global.hoverResultStepView || Global.hoverStepView;
    if (!targetStepView) {
        return '';
    }
    if (targetStepView === Global.hoverResultStepView) {
        var resultStep = targetStepView.steps[targetStepView.steps.length - 1];
        if (reference.source === resultStep) {
            return 'referenced-by-color';
        } else {
            return '';
        }
    }

    if (reference.sink !== targetStepView.step) {
        return '';
    }
    return referenceColorInputAware(targetStepView, reference.source);
};

DrawReferences.colorForEnableConnector = function (enableConnectorStepView, enabledBySteps) {
    var targetStepView = Global.inputStepView || Global.hoverResultStepView || Global.hoverStepView;
    if (!targetStepView) {
        return '';
    }
    if (targetStepView === Global.hoverResultStepView) {
        var resultStep = targetStepView.steps[targetStepView.steps.length - 1];
        if (_.contains(enabledBySteps, resultStep)) {
            return 'referenced-by-color';
        } else {
            return '';
        }
    }

    if (enableConnectorStepView !== targetStepView) {
        return '';
    }
    if (Global.inputReferenceIs.length) {
        return '';
    }
    return 'referenced-by-color';
};

DrawReferences.colorForEnableOuterConnector = function (enableConnectorStepView, enabledByStep) {
    var targetStepView = Global.inputStepView || Global.hoverResultStepView || Global.hoverStepView;
    if (!targetStepView) {
        return '';
    }
    if (targetStepView === Global.hoverResultStepView) {
        return '';
    }

    if (enableConnectorStepView !== targetStepView) {
        return '';
    }
    if (Global.inputReferenceIs.length) {
        return '';
    }
    return referenceColor(targetStepView, enabledByStep);
};

var referenceColor = function (targetStepView, referenceStep) {
    if (MultiStep.isMultiStep(targetStepView.step)) {
        var expressionReferences = [];
    } else {
        var expressionReferences = targetStepView.step.references;
    }
    var enabledBy = MultiStep.enabledBy(targetStepView);

    var referenceSteps = _.union(enabledBy, _.pluck(expressionReferences, 'source'));
    if (!_.contains(referenceSteps, referenceStep)) {
        return '';
    }
    referenceSteps = _.sortBy(referenceSteps, '__index');

    var colorIndex = referenceSteps.length - _.indexOf(referenceSteps, referenceStep);
    if (colorIndex <= 4) {
        return 'reference-color-' + colorIndex;
    } else {
        return 'reference-color-5-or-more';
    }
};

var referenceColorInputAware = function (targetStepView, referenceStep) {
    if (Global.inputReferenceIs.length) {
        var inputReferenceSteps = _.map(Global.inputReferenceIs, function (referenceI) {
            return targetStepView.step.references[referenceI].source;
        });
        if (!_.contains(inputReferenceSteps, referenceStep)) {
            return '';
        }
    }

    return referenceColor(targetStepView, referenceStep);
};

var referenceClass = function (reference, referenceI) {
    var color = colorForReference(reference);
    var classes = ['reference'];
    if (Global.inputReferenceIs.length) {
        if (color && _.contains(Global.inputReferenceIs, referenceI)) {
            classes.push('reference-inserting');
            classes.push(color);
        }
    } else if (color) {
        classes.push(color);
    }
    if (reference.absolute) {
        classes.push('reference-absolute');
    }
    return classes.join(' ');
};

DrawReferences.updateInserting = function () {
    Global.inputReferenceIs = [];
    if (!Global.inputStepView) {
        return;
    }
    var cursorRange = DomRange.currentRange();
    if (!cursorRange) {
        return;
    }
    var stepView = Global.inputStepView;
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

    var cursorIndex = 0;
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
            cursorIndex = i + 1;
        }
        if (cursorStartToRefEnd > 0 || cursorEndToRefStart < 0) {
            return;
        }
        Global.inputReferenceIs.push(i);
    });
    if (!Global.inputReferenceIs.length) {
        Global.inputReferenceIs.cursorIndex = cursorIndex;
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
            var result = reference.source.result;
            if (result === null) {
                var text = '-';
            } else if (Quads.isQuads(result)) {
                var text = 'pic';
            } else {
                var text = DrawHelper.clipNumber(reference.source.result, 6);
            }

            d3.select(this)
                .text(text) ;
        });

        referenceEls.each(function (reference, i) {
            var textEl = container.select('.reference-text.reference-' + i).node();
            d3.select(this)
                .attr('class', referenceClass(reference, i))
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
