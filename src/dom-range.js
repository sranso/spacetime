var DomRange = {};
(function() {

DomRange.currentRange = function () {
    var selection = window.getSelection();
    if (selection.rangeCount === 0) {
        return null;
    }
    return selection.getRangeAt(0);
};

var currentRangeUnder = function (element) {
    var range = DomRange.currentRange();
    if (!range) {
        return null;
    }
    var end = range.endContainer;
    var found = false;
    while (end.parentNode) {
        if (end === element) {
            return range;
        }
        end = end.parentNode;
    }
    return null;
};

DomRange.currentCursorOffset = function (element) {
    var range = currentRangeUnder(element);
    if (!range) {
        return -1;
    }
    var preCursorRange = range.cloneRange();
    preCursorRange.selectNodeContents(element);
    preCursorRange.setEnd(range.endContainer, range.endOffset);
    return preCursorRange.toString().length;
};

DomRange.leafNode = function (node, which) {
    var lower;
    while (lower = node[which]) {
        node = lower;
    }
    return node;
};

DomRange.nodeLength = function (node) {
    if (node.nodeType === 3) {
        return node.nodeValue.length;
    } else {
        return node.childNodes.length;
    }
}

DomRange.setCurrentCursorOffset = function (element, targetOffset) {
    var range = currentRangeUnder(element);
    if (!range) {
        return;
    }
    range.selectNodeContents(element);

    while (range.toString().length > targetOffset) {
        if (range.endContainer.nodeType === 3) {
            if (range.endOffset > 0) {
                range.setEnd(range.endContainer, range.endOffset - 1);
            } else if (range.endContainer.previousSibling) {
                range.setEndAfter(range.endContainer.previousSibling);
            } else {
                range.setEndAfter(range.endContainer.parentNode.previousSibling);
            }
        } else {
            var end = range.endContainer;
            if (range.endOffset === 0) {
                end = end.childNodes[range.endOffset];
                end = DomRange.leafNode(end, 'firstChild');
                range.setEnd(end, 0);
            } else {
                end = end.childNodes[range.endOffset - 1]
                end = DomRange.leafNode(end, 'lastChild');
                range.setEnd(end, DomRange.nodeLength(end));
            }
        }
    }

    range.collapse(false);  // collapse to end boundary
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
};

})();
