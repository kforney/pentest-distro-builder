'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const os = require("os");
let Subscriber;
function subscribeToAllLoggers(subscriber) {
    Subscriber = subscriber;
}
exports.subscribeToAllLoggers = subscribeToAllLoggers;
class Logger {
    constructor(writer) {
        this.writer = writer;
    }
    append(message) {
        this.writer(message);
        if (Subscriber) {
            Subscriber(message);
        }
    }
    appendLine(message) {
        this.writer(message + os.EOL);
        if (Subscriber) {
            Subscriber(message + os.EOL);
        }
    }
    showInformationMessage(message, items) {
        this.appendLine(message);
        return vscode.window.showInformationMessage(message, ...items);
    }
    showWarningMessage(message, items) {
        this.appendLine(message);
        return vscode.window.showWarningMessage(message, ...items);
    }
    showErrorMessage(message, items) {
        this.appendLine(message);
        return vscode.window.showErrorMessage(message, ...items);
    }
}
exports.Logger = Logger;
let outputChannel;
function getOutputChannel() {
    if (outputChannel === undefined) {
        outputChannel = vscode.window.createOutputChannel("C/C++");
    }
    return outputChannel;
}
exports.getOutputChannel = getOutputChannel;
function showOutputChannel() {
    getOutputChannel().show();
}
exports.showOutputChannel = showOutputChannel;
let outputChannelLogger;
function getOutputChannelLogger() {
    if (!outputChannelLogger) {
        outputChannelLogger = new Logger(message => getOutputChannel().append(message));
    }
    return outputChannelLogger;
}
exports.getOutputChannelLogger = getOutputChannelLogger;
//# sourceMappingURL=logger.js.map