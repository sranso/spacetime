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
    Step.computeReferenceInfo();
    Selection.computeInfo();
    Draw.draw();
};

Main.maybeUpdate = function (cb) {
    var lastHoverStep = Global.hoverStep;
    var lastInsertStep = Global.insertStep;
    cb();
    if (
        Global.hoverStep !== lastHoverStep ||
        Global.insertStep !== lastInsertStep
    ) {
        Main.update();
    }
};

Main.targetStep = function () {
    return Global.insertStep || Global.hoverStep;
};

Main.mouseUp = function () {
    Selection.stop();
    Main.update();
};

Main.mouseMove = function () {
    var mouse = d3.mouse(Draw.trackContainer.node());
    Main.maybeUpdate(function () {
        var step = Main.findStepUnderMouse(mouse);
        Global.hoverStep = step ? step.stretch : null;
    });
    Selection.maybeChange(mouse);
};

Main.mouseDown = function () {
    window.getSelection().removeAllRanges();
    Main.maybeUpdate(function () { Global.insertStep = null });
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

Global.steps = _.map([
    {text: ''},
], Step.create);

Step.linkSteps(Global.steps);
Global.stepsHead.next = Global.steps[0];
Global.stepsTail.previous = Global.steps[0];
Global.active = Group.create({hidden: true});
Global.selection = new Selection();

Input.dvorak();
Draw.setup();
Main.update();

})();
