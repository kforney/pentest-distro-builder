"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
function showAnimatedStatusBarMessage(text, hideWhenDone) {
    const animatedStatusBarItem = new AnimatedStatusBarItem(text);
    animatedStatusBarItem.show(hideWhenDone);
    return animatedStatusBarItem;
}
exports.showAnimatedStatusBarMessage = showAnimatedStatusBarMessage;
class AnimatedStatusBarItem {
    get alignment() {
        return this.statusBarItem.alignment;
    }
    get priority() {
        return this.statusBarItem.priority;
    }
    get text() {
        return this.statusBarItem.text;
    }
    set text(value) {
        this.statusBarItem.text = value;
    }
    get tooltip() {
        return this.statusBarItem.tooltip;
    }
    set tooltip(value) {
        this.statusBarItem.tooltip = value;
    }
    get color() {
        return this.statusBarItem.color;
    }
    set color(value) {
        this.statusBarItem.color = value;
    }
    get command() {
        return this.statusBarItem.command;
    }
    set command(value) {
        this.statusBarItem.command = value;
    }
    constructor(baseText, alignment, priority) {
        this.animationRate = 1;
        this.statusBarItem = vscode_1.window.createStatusBarItem(alignment, priority);
        this.baseText = baseText;
        this.counter = 0;
        this.suffixStates = ["  ", ".  ", ".. ", "..."];
        this.maxCount = this.suffixStates.length;
        this.timerInterval = ((1 / this.maxCount) * 1000) / this.animationRate;
        this.elapsedTime = 0;
    }
    show(hideWhenDone) {
        this.statusBarItem.show();
        this.start();
        if (hideWhenDone !== undefined) {
            hideWhenDone.then(() => this.hide());
        }
    }
    hide() {
        this.stop();
        this.statusBarItem.hide();
    }
    dispose() {
        this.statusBarItem.dispose();
    }
    updateCounter() {
        this.counter = (this.counter + 1) % this.maxCount;
        this.elapsedTime = this.elapsedTime + this.timerInterval;
    }
    updateText() {
        this.text = this.baseText + this.suffixStates[this.counter];
    }
    update() {
        this.updateCounter();
        this.updateText();
    }
    reset() {
        this.counter = 0;
        this.updateText();
    }
    start() {
        this.reset();
        this.intervalId = setInterval(() => this.update(), this.timerInterval);
    }
    stop() {
        clearInterval(this.intervalId);
    }
}
//# sourceMappingURL=animatedStatusBar.js.map