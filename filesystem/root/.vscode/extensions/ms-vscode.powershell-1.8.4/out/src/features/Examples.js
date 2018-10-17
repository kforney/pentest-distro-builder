"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
class ExamplesFeature {
    constructor() {
        this.examplesPath = path.resolve(__dirname, "../../../examples");
        this.command = vscode.commands.registerCommand("PowerShell.OpenExamplesFolder", () => {
            vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(this.examplesPath), true);
        });
    }
    setLanguageClient(languageclient) {
        // Eliminate tslint warning
    }
    dispose() {
        this.command.dispose();
    }
}
exports.ExamplesFeature = ExamplesFeature;
//# sourceMappingURL=Examples.js.map