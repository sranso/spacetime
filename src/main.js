'use strict';
var Main = {};
(function () {

Main.newId = function () {
    Global.idSequence += 1;
    return Global.idSequence;
};

Main.update = function () {
    Step.computeSteps();
    StepExecution.execute();
    StepView.computeViews();
    Active.computeActive();
    Selection.computeInfo();
    Draw.draw();
};

Main.maybeUpdate = function (cb) {
    var lastHoverStepView = Global.hoverStepView;
    var lastInsertStepView = Global.insertStepView;
    cb();
    if (
        Global.hoverStepView !== lastHoverStepView ||
        Global.insertStepView !== lastInsertStepView
    ) {
        Main.update();
    }
};

Main.targetStepView = function () {
    return Global.insertStepView || Global.hoverStepView;
};

Main.mouseUp = function () {
    Selection.stop();
    Main.update();
};

Main.mouseMove = function () {
    var mouse = d3.mouse(Draw.trackContainer.node());
    Main.maybeUpdate(function () {
        Global.hoverStepView = Main.findStepUnderMouse(mouse);
    });
    Selection.maybeChange(mouse);
};

Main.mouseDown = function () {
    window.getSelection().removeAllRanges();
    Main.maybeUpdate(function () { Global.insertStepView = null });
    var mouse = d3.mouse(Draw.trackContainer.node());
    Selection.maybeStart(mouse);
};

Main.findStepUnderMouse = function (mouse) {
    var x = mouse[0], y = mouse[1];
    var startX = Draw.trackHtml.node().offsetLeft;
    var endX = startX + Draw.trackHtml.node().offsetWidth;
    return _.find(Global.stepViews, function (step) {
        var el = step.__el__;
        if (el.offsetTop <= y && y < el.offsetTop + el.offsetHeight) {
            return startX <= x && x < endX;
        }
        return false;
    });
};

Global.steps = [Step.create()];

Step.linkSteps(Global.steps);
Global.stepsHead.next = Global.steps[0];
Global.stepsTail.previous = Global.steps[0];
Global.active = Group.create();
Global.active.hidden = true;
Global.selection = new Selection();

Input.dvorak();
Draw.setup();
Main.update();

})();
