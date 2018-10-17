Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class DataBinding {
    constructor(value) {
        this.valueChanged = new vscode.EventEmitter();
        this.isActive = true;
        this.value = value;
        this.isActive = true;
    }
    get Value() {
        return this.value;
    }
    set Value(value) {
        if (value !== this.value) {
            this.value = value;
            if (this.isActive) {
                this.valueChanged.fire(this.value);
            }
        }
    }
    get ValueChanged() {
        return this.valueChanged.event;
    }
    activate() {
        this.isActive = true;
        this.valueChanged.fire(this.value);
    }
    deactivate() {
        this.isActive = false;
    }
    dispose() {
        this.deactivate();
        this.valueChanged.dispose();
    }
}
exports.DataBinding = DataBinding;
//# sourceMappingURL=dataBinding.js.map