'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_cpptools_1 = require("vscode-cpptools");
const cppTools_1 = require("./cppTools");
class CppTools1 {
    get BackupApi() {
        if (!this.backupApi) {
            this.backupApi = new cppTools_1.CppTools(vscode_cpptools_1.Version.v0);
        }
        return this.backupApi;
    }
    getApi(version) {
        switch (version) {
            case vscode_cpptools_1.Version.v0:
                return this.BackupApi;
            case vscode_cpptools_1.Version.v1:
                return new cppTools_1.CppTools(version);
            default:
                throw new RangeError(`Invalid version: ${version}`);
        }
    }
    getTestApi(version) {
        return this.getApi(version);
    }
    registerCustomConfigurationProvider(provider) {
        this.BackupApi.registerCustomConfigurationProvider(provider);
    }
    didChangeCustomConfiguration(provider) {
        this.BackupApi.didChangeCustomConfiguration(provider);
    }
    dispose() {
    }
    getTestHook() {
        return this.BackupApi.getTestHook();
    }
}
exports.CppTools1 = CppTools1;
//# sourceMappingURL=cppTools1.js.map