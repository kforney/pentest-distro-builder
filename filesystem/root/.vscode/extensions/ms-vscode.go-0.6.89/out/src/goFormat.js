/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const goInstallTools_1 = require("./goInstallTools");
const util_1 = require("./util");
class GoDocumentFormattingEditProvider {
    provideDocumentFormattingEdits(document, options, token) {
        let filename = document.fileName;
        let goConfig = vscode.workspace.getConfiguration('go', document.uri);
        let formatTool = goConfig['formatTool'] || 'goreturns';
        let formatFlags = goConfig['formatFlags'].slice() || [];
        // We ignore the -w flag that updates file on disk because that would break undo feature
        if (formatFlags.indexOf('-w') > -1) {
            formatFlags.splice(formatFlags.indexOf('-w'), 1);
        }
        // Fix for https://github.com/Microsoft/vscode-go/issues/613 and https://github.com/Microsoft/vscode-go/issues/630
        if (formatTool === 'goimports' || formatTool === 'goreturns') {
            formatFlags.push('-srcdir', filename);
        }
        // Since goformat supports the style flag, set tabsize if user has not passed any flags
        if (formatTool === 'goformat' && formatFlags.length === 0 && options.insertSpaces) {
            formatFlags.push('-style=indent=' + options.tabSize);
        }
        return this.runFormatter(formatTool, formatFlags, document, token).then(edits => edits, err => {
            if (typeof err === 'string' && err.startsWith('flag provided but not defined: -srcdir')) {
                goInstallTools_1.promptForUpdatingTool(formatTool);
                return Promise.resolve([]);
            }
            if (err) {
                console.log(err);
                return Promise.reject('Check the console in dev tools to find errors when formatting.');
            }
        });
    }
    runFormatter(formatTool, formatFlags, document, token) {
        let formatCommandBinPath = util_1.getBinPath(formatTool);
        return new Promise((resolve, reject) => {
            if (!path.isAbsolute(formatCommandBinPath)) {
                goInstallTools_1.promptForMissingTool(formatTool);
                return reject();
            }
            let t0 = Date.now();
            let env = util_1.getToolsEnvVars();
            let stdout = '';
            let stderr = '';
            // Use spawn instead of exec to avoid maxBufferExceeded error
            const p = cp.spawn(formatCommandBinPath, formatFlags, { env });
            token.onCancellationRequested(() => !p.killed && util_1.killTree(p.pid));
            p.stdout.setEncoding('utf8');
            p.stdout.on('data', data => stdout += data);
            p.stderr.on('data', data => stderr += data);
            p.on('error', err => {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool(formatTool);
                    return reject();
                }
            });
            p.on('close', code => {
                if (code !== 0) {
                    return reject(stderr);
                }
                // Return the complete file content in the edit.
                // VS Code will calculate minimal edits to be applied
                const fileStart = new vscode.Position(0, 0);
                const fileEnd = document.lineAt(document.lineCount - 1).range.end;
                const textEdits = [new vscode.TextEdit(new vscode.Range(fileStart, fileEnd), stdout)];
                let timeTaken = Date.now() - t0;
                /* __GDPR__
                   "format" : {
                      "tool" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                      "timeTaken": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                   }
                 */
                util_1.sendTelemetryEvent('format', { tool: formatTool }, { timeTaken });
                if (timeTaken > 750) {
                    console.log(`Formatting took too long(${timeTaken}ms). Format On Save feature could be aborted.`);
                }
                return resolve(textEdits);
            });
            if (p.pid) {
                p.stdin.end(document.getText());
            }
        });
    }
}
exports.GoDocumentFormattingEditProvider = GoDocumentFormattingEditProvider;
//# sourceMappingURL=goFormat.js.map