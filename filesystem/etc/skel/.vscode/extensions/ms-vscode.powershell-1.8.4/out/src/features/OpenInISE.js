"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const ChildProcess = require("child_process");
const vscode = require("vscode");
class OpenInISEFeature {
    constructor() {
        this.command = vscode.commands.registerCommand("PowerShell.OpenInISE", () => {
            const editor = vscode.window.activeTextEditor;
            const document = editor.document;
            const uri = document.uri;
            let ISEPath = process.env.windir;
            if (process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432")) {
                ISEPath += "\\Sysnative";
            }
            else {
                ISEPath += "\\System32";
            }
            ISEPath += "\\WindowsPowerShell\\v1.0\\powershell_ise.exe";
            ChildProcess.exec(ISEPath + ` -File "${uri.fsPath}"`).unref();
        });
    }
    dispose() {
        this.command.dispose();
    }
    setLanguageClient(languageClient) {
        // Not needed for this feature.
    }
}
exports.OpenInISEFeature = OpenInISEFeature;
//# sourceMappingURL=OpenInISE.js.map