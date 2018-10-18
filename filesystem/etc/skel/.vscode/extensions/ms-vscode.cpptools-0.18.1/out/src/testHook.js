'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class TestHook {
    constructor() {
        this.statusChangedEvent = new vscode.EventEmitter();
    }
    get StatusChanged() {
        return this.statusChangedEvent.event;
    }
    get valid() {
        return !!this.statusChangedEvent;
    }
    updateStatus(status) {
        this.statusChangedEvent.fire(status);
    }
    dispose() {
        this.statusChangedEvent.dispose();
        this.statusChangedEvent = null;
    }
}
exports.TestHook = TestHook;
let testHook;
function getTestHook() {
    if (!testHook || !testHook.valid) {
        testHook = new TestHook();
    }
    return testHook;
}
exports.getTestHook = getTestHook;
//# sourceMappingURL=testHook.js.map