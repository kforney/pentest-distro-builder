"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const utils = require("./utils");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Diagnostic"] = 0] = "Diagnostic";
    LogLevel[LogLevel["Verbose"] = 1] = "Verbose";
    LogLevel[LogLevel["Normal"] = 2] = "Normal";
    LogLevel[LogLevel["Warning"] = 3] = "Warning";
    LogLevel[LogLevel["Error"] = 4] = "Error";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
class Logger {
    constructor() {
        this.MinimumLogLevel = LogLevel.Normal;
        this.logChannel = vscode.window.createOutputChannel("PowerShell Extension Logs");
        this.logBasePath = path.resolve(__dirname, "../../logs");
        utils.ensurePathExists(this.logBasePath);
        this.commands = [
            vscode.commands.registerCommand("PowerShell.ShowLogs", () => { this.showLogPanel(); }),
            vscode.commands.registerCommand("PowerShell.OpenLogFolder", () => { this.openLogFolder(); }),
        ];
    }
    dispose() {
        this.commands.forEach((command) => { command.dispose(); });
        this.logChannel.dispose();
    }
    getLogFilePath(baseName) {
        return path.resolve(this.logSessionPath, `${baseName}.log`);
    }
    writeAtLevel(logLevel, message, ...additionalMessages) {
        if (logLevel >= this.MinimumLogLevel) {
            this.writeLine(message, logLevel);
            additionalMessages.forEach((line) => {
                this.writeLine(line, logLevel);
            });
        }
    }
    write(message, ...additionalMessages) {
        this.writeAtLevel(LogLevel.Normal, message, ...additionalMessages);
    }
    writeDiagnostic(message, ...additionalMessages) {
        this.writeAtLevel(LogLevel.Diagnostic, message, ...additionalMessages);
    }
    writeVerbose(message, ...additionalMessages) {
        this.writeAtLevel(LogLevel.Verbose, message, ...additionalMessages);
    }
    writeWarning(message, ...additionalMessages) {
        this.writeAtLevel(LogLevel.Warning, message, ...additionalMessages);
    }
    writeAndShowWarning(message, ...additionalMessages) {
        this.writeWarning(message, ...additionalMessages);
        vscode.window.showWarningMessage(message, "Show Logs").then((selection) => {
            if (selection !== undefined) {
                this.showLogPanel();
            }
        });
    }
    writeError(message, ...additionalMessages) {
        this.writeAtLevel(LogLevel.Error, message, ...additionalMessages);
    }
    writeAndShowError(message, ...additionalMessages) {
        this.writeError(message, ...additionalMessages);
        vscode.window.showErrorMessage(message, "Show Logs").then((selection) => {
            if (selection !== undefined) {
                this.showLogPanel();
            }
        });
    }
    startNewLog(minimumLogLevel = "Normal") {
        this.MinimumLogLevel = this.logLevelNameToValue(minimumLogLevel.trim());
        this.logSessionPath =
            path.resolve(this.logBasePath, `${Math.floor(Date.now() / 1000)}-${vscode.env.sessionId}`);
        this.logFilePath = this.getLogFilePath("vscode-powershell");
        utils.ensurePathExists(this.logSessionPath);
    }
    logLevelNameToValue(logLevelName) {
        switch (logLevelName.toLowerCase()) {
            case "diagnostic": return LogLevel.Diagnostic;
            case "verbose": return LogLevel.Verbose;
            case "normal": return LogLevel.Normal;
            case "warning": return LogLevel.Warning;
            case "error": return LogLevel.Error;
            default: return LogLevel.Normal;
        }
    }
    showLogPanel() {
        this.logChannel.show();
    }
    openLogFolder() {
        if (this.logSessionPath) {
            // Open the folder in VS Code since there isn't an easy way to
            // open the folder in the platform's file browser
            vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(this.logSessionPath), true);
        }
    }
    writeLine(message, level = LogLevel.Normal) {
        const now = new Date();
        const timestampedMessage = `${now.toLocaleDateString()} ${now.toLocaleTimeString()} [${LogLevel[level].toUpperCase()}] - ${message}`;
        this.logChannel.appendLine(timestampedMessage);
        if (this.logFilePath) {
            fs.appendFile(this.logFilePath, timestampedMessage + os.EOL, (err) => {
                if (err) {
                    // tslint:disable-next-line:no-console
                    console.log(`Error writing to vscode-powershell log file: ${err}`);
                }
            });
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logging.js.map