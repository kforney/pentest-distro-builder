"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const utils = require("./utils");
class PowerShellProcess {
    constructor(exePath, bundledModulesPath, title, log, startArgs, sessionFilePath, sessionSettings) {
        this.exePath = exePath;
        this.bundledModulesPath = bundledModulesPath;
        this.title = title;
        this.log = log;
        this.startArgs = startArgs;
        this.sessionFilePath = sessionFilePath;
        this.sessionSettings = sessionSettings;
        this.onExitedEmitter = new vscode.EventEmitter();
        this.consoleTerminal = undefined;
        this.onExited = this.onExitedEmitter.event;
    }
    static escapeSingleQuotes(pspath) {
        return pspath.replace(new RegExp("'", "g"), "''");
    }
    start(logFileName) {
        return new Promise((resolve, reject) => {
            try {
                const startScriptPath = path.resolve(__dirname, this.bundledModulesPath, "PowerShellEditorServices/Start-EditorServices.ps1");
                const editorServicesLogPath = this.log.getLogFilePath(logFileName);
                const featureFlags = this.sessionSettings.developer.featureFlags !== undefined
                    ? this.sessionSettings.developer.featureFlags.map((f) => `'${f}'`).join(", ")
                    : "";
                this.startArgs +=
                    `-LogPath '${PowerShellProcess.escapeSingleQuotes(editorServicesLogPath)}' ` +
                        `-SessionDetailsPath '${PowerShellProcess.escapeSingleQuotes(this.sessionFilePath)}' ` +
                        `-FeatureFlags @(${featureFlags})`;
                const powerShellArgs = [
                    "-NoProfile",
                    "-NonInteractive",
                ];
                // Only add ExecutionPolicy param on Windows
                if (utils.isWindowsOS()) {
                    powerShellArgs.push("-ExecutionPolicy", "Bypass");
                }
                powerShellArgs.push("-Command", "& '" + PowerShellProcess.escapeSingleQuotes(startScriptPath) + "' " + this.startArgs);
                let powerShellExePath = this.exePath;
                if (this.sessionSettings.developer.powerShellExeIsWindowsDevBuild) {
                    // Windows PowerShell development builds need the DEVPATH environment
                    // variable set to the folder where development binaries are held
                    // NOTE: This batch file approach is needed temporarily until VS Code's
                    // createTerminal API gets an argument for setting environment variables
                    // on the launched process.
                    const batScriptPath = path.resolve(__dirname, "../../sessions/powershell.bat");
                    fs.writeFileSync(batScriptPath, `@set DEVPATH=${path.dirname(powerShellExePath)}\r\n@${powerShellExePath} %*`);
                    powerShellExePath = batScriptPath;
                }
                this.log.write("Language server starting --", "    exe: " + powerShellExePath, "    args: " + startScriptPath + " " + this.startArgs);
                // Make sure no old session file exists
                utils.deleteSessionFile(this.sessionFilePath);
                // Launch PowerShell in the integrated terminal
                this.consoleTerminal =
                    vscode.window.createTerminal(this.title, powerShellExePath, powerShellArgs);
                if (this.sessionSettings.integratedConsole.showOnStartup) {
                    this.consoleTerminal.show(true);
                }
                // Start the language client
                utils.waitForSessionFile(this.sessionFilePath, (sessionDetails, error) => {
                    // Clean up the session file
                    utils.deleteSessionFile(this.sessionFilePath);
                    if (error) {
                        reject(error);
                    }
                    else {
                        this.sessionDetails = sessionDetails;
                        resolve(this.sessionDetails);
                    }
                });
                this.consoleCloseSubscription =
                    vscode.window.onDidCloseTerminal((terminal) => {
                        if (terminal === this.consoleTerminal) {
                            this.log.write("powershell.exe terminated or terminal UI was closed");
                            this.onExitedEmitter.fire();
                        }
                    });
                this.consoleTerminal.processId.then((pid) => { this.log.write(`powershell.exe started, pid: ${pid}`); });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    showConsole(preserveFocus) {
        if (this.consoleTerminal) {
            this.consoleTerminal.show(preserveFocus);
        }
    }
    dispose() {
        // Clean up the session file
        utils.deleteSessionFile(this.sessionFilePath);
        if (this.consoleCloseSubscription) {
            this.consoleCloseSubscription.dispose();
            this.consoleCloseSubscription = undefined;
        }
        if (this.consoleTerminal) {
            this.log.write("Terminating PowerShell process...");
            this.consoleTerminal.dispose();
            this.consoleTerminal = undefined;
        }
    }
}
exports.PowerShellProcess = PowerShellProcess;
//# sourceMappingURL=process.js.map