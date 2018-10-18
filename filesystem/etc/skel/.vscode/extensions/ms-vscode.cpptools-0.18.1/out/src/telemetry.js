'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const util = require("./common");
let telemetryReporter;
function activate() {
    try {
        telemetryReporter = createReporter();
    }
    catch (e) {
    }
}
exports.activate = activate;
function deactivate() {
    if (telemetryReporter) {
        telemetryReporter.dispose();
    }
}
exports.deactivate = deactivate;
function logDebuggerEvent(eventName, properties) {
    const eventNamePrefix = "cppdbg/VS/Diagnostics/Debugger/";
    if (telemetryReporter) {
        telemetryReporter.sendTelemetryEvent(eventNamePrefix + eventName, properties);
    }
}
exports.logDebuggerEvent = logDebuggerEvent;
function logLanguageServerEvent(eventName, properties, metrics) {
    const eventNamePrefix = "C_Cpp/LanguageServer/";
    if (telemetryReporter) {
        telemetryReporter.sendTelemetryEvent(eventNamePrefix + eventName, properties, metrics);
    }
}
exports.logLanguageServerEvent = logLanguageServerEvent;
function createReporter() {
    let packageInfo = getPackageInfo();
    if (packageInfo && packageInfo.aiKey) {
        return new vscode_extension_telemetry_1.default(packageInfo.name, packageInfo.version, packageInfo.aiKey);
    }
    return null;
}
function getPackageInfo() {
    return {
        name: util.packageJson.publisher + "." + util.packageJson.name,
        version: util.packageJson.version,
        aiKey: util.packageJson.contributes.debuggers[0].aiKey
    };
}
//# sourceMappingURL=telemetry.js.map