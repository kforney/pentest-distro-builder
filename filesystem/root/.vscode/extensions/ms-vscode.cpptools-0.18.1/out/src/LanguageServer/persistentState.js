'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("../common");
const path = require("path");
class PersistentStateBase {
    constructor(key, defaultValue, state) {
        this.key = key;
        this.defaultvalue = defaultValue;
        this.state = state;
    }
    get Value() {
        return this.state.get(this.key, this.defaultvalue);
    }
    set Value(newValue) {
        this.state.update(this.key, newValue);
    }
}
class PersistentState extends PersistentStateBase {
    constructor(key, defaultValue) {
        super(key, defaultValue, util.extensionContext.globalState);
    }
}
exports.PersistentState = PersistentState;
class PersistentWorkspaceState extends PersistentStateBase {
    constructor(key, defaultValue) {
        super(key, defaultValue, util.extensionContext.workspaceState);
    }
}
exports.PersistentWorkspaceState = PersistentWorkspaceState;
class PersistentFolderState extends PersistentWorkspaceState {
    constructor(key, defaultValue, folder) {
        let newKey = key + (folder ? `-${path.basename(folder)}` : "-untitled");
        super(newKey, defaultValue);
    }
}
exports.PersistentFolderState = PersistentFolderState;
//# sourceMappingURL=persistentState.js.map