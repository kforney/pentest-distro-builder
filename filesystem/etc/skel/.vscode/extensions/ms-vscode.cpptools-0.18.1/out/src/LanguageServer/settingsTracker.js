'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util = require("../common");
const maxSettingLengthForTelemetry = 50;
let cache = undefined;
class SettingsTracker {
    constructor(resource) {
        this.previousCppSettings = {};
        this.resource = resource;
        this.collectSettings(() => true);
    }
    getUserModifiedSettings() {
        let filter = (key, val, settings) => {
            return !this.areEqual(val, settings.inspect(key).defaultValue);
        };
        return this.collectSettings(filter);
    }
    getChangedSettings() {
        let filter = (key, val) => {
            return !(key in this.previousCppSettings) || !this.areEqual(val, this.previousCppSettings[key]);
        };
        return this.collectSettings(filter);
    }
    collectSettings(filter) {
        let settings = vscode.workspace.getConfiguration("C_Cpp", this.resource);
        let result = {};
        for (let key in settings) {
            let val = this.getSetting(settings, key);
            if (val === undefined) {
                continue;
            }
            if (val instanceof Object && !(val instanceof Array)) {
                for (let subKey in val) {
                    let newKey = key + "." + subKey;
                    let subVal = this.getSetting(settings, newKey);
                    if (subVal === undefined) {
                        continue;
                    }
                    let entry = this.filterAndSanitize(newKey, subVal, settings, filter);
                    if (entry && entry.key && entry.value) {
                        result[entry.key] = entry.value;
                    }
                }
                continue;
            }
            let entry = this.filterAndSanitize(key, val, settings, filter);
            if (entry && entry.key && entry.value) {
                result[entry.key] = entry.value;
            }
        }
        return result;
    }
    getSetting(settings, key) {
        if (settings.inspect(key).defaultValue !== undefined) {
            let val = settings.get(key);
            if (val instanceof Object) {
                return val;
            }
            let curSetting = util.packageJson.contributes.configuration.properties["C_Cpp." + key];
            if (curSetting) {
                let type = this.typeMatch(val, curSetting["type"]);
                if (type) {
                    if (type !== "string") {
                        return val;
                    }
                    let curEnum = curSetting["enum"];
                    if (curEnum && curEnum.indexOf(val) === -1) {
                        return "<invalid>";
                    }
                    return val;
                }
            }
        }
        return undefined;
    }
    typeMatch(value, type) {
        if (type) {
            if (type instanceof Array) {
                for (let i = 0; i < type.length; i++) {
                    let t = type[i];
                    if (t) {
                        if (typeof value === t) {
                            return t;
                        }
                        if (t === "array" && value instanceof Array) {
                            return t;
                        }
                        if (t === "null" && value === null) {
                            return t;
                        }
                    }
                }
            }
            else if (typeof type === "string" && typeof value === type) {
                return type;
            }
        }
        return undefined;
    }
    filterAndSanitize(key, val, settings, filter) {
        if (filter(key, val, settings)) {
            let value;
            this.previousCppSettings[key] = val;
            switch (key) {
                case "clang_format_style":
                case "clang_format_fallbackStyle": {
                    let newKey = key + "2";
                    if (val) {
                        switch (String(val).toLowerCase()) {
                            case "visual studio":
                            case "llvm":
                            case "google":
                            case "chromium":
                            case "mozilla":
                            case "webkit":
                            case "file":
                            case "none": {
                                value = String(this.previousCppSettings[key]);
                                break;
                            }
                            default: {
                                value = "...";
                                break;
                            }
                        }
                    }
                    else {
                        value = "null";
                    }
                    key = newKey;
                    break;
                }
                case "commentContinuationPatterns": {
                    value = this.areEqual(val, settings.inspect(key).defaultValue) ? "<default>" : "...";
                    break;
                }
                default: {
                    if (key === "clang_format_path" || key.startsWith("default.")) {
                        value = this.areEqual(val, settings.inspect(key).defaultValue) ? "<default>" : "...";
                    }
                    else {
                        value = String(this.previousCppSettings[key]);
                    }
                }
            }
            if (value && value.length > maxSettingLengthForTelemetry) {
                value = value.substr(0, maxSettingLengthForTelemetry) + "...";
            }
            return { key: key, value: value };
        }
    }
    areEqual(value1, value2) {
        if (value1 instanceof Object && value2 instanceof Object) {
            return JSON.stringify(value1) === JSON.stringify(value2);
        }
        return value1 === value2;
    }
}
exports.SettingsTracker = SettingsTracker;
function getTracker(resource) {
    if (!cache) {
        cache = new SettingsTracker(resource);
    }
    return cache;
}
exports.getTracker = getTracker;
//# sourceMappingURL=settingsTracker.js.map