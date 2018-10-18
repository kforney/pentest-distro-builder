"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
class NewFileOrProjectFeature {
    constructor() {
        this.loadIcon = "  $(sync)  ";
        this.command =
            vscode.commands.registerCommand("PowerShell.NewProjectFromTemplate", () => {
                if (!this.languageClient && !this.waitingForClientToken) {
                    // If PowerShell isn't finished loading yet, show a loading message
                    // until the LanguageClient is passed on to us
                    this.waitingForClientToken = new vscode.CancellationTokenSource();
                    vscode.window
                        .showQuickPick(["Cancel"], { placeHolder: "New Project: Please wait, starting PowerShell..." }, this.waitingForClientToken.token)
                        .then((response) => {
                        if (response === "Cancel") {
                            this.clearWaitingToken();
                        }
                    });
                    // Cancel the loading prompt after 60 seconds
                    setTimeout(() => {
                        if (this.waitingForClientToken) {
                            this.clearWaitingToken();
                            vscode.window.showErrorMessage("New Project: PowerShell session took too long to start.");
                        }
                    }, 60000);
                }
                else {
                    this.showProjectTemplates();
                }
            });
    }
    dispose() {
        this.command.dispose();
    }
    setLanguageClient(languageClient) {
        this.languageClient = languageClient;
        if (this.waitingForClientToken) {
            this.clearWaitingToken();
            this.showProjectTemplates();
        }
    }
    showProjectTemplates(includeInstalledModules = false) {
        vscode.window
            .showQuickPick(this.getProjectTemplates(includeInstalledModules), { placeHolder: "Choose a template to create a new project",
            ignoreFocusOut: true })
            .then((template) => {
            if (template.label.startsWith(this.loadIcon)) {
                this.showProjectTemplates(true);
            }
            else {
                this.createProjectFromTemplate(template.template);
            }
        });
    }
    getProjectTemplates(includeInstalledModules) {
        return this.languageClient
            .sendRequest(exports.GetProjectTemplatesRequestType, { includeInstalledModules })
            .then((response) => {
            if (response.needsModuleInstall) {
                // TODO: Offer to install Plaster
                vscode.window.showErrorMessage("Plaster is not installed!");
                return Promise.reject("Plaster needs to be installed");
            }
            else {
                let templates = response.templates.map((template) => {
                    return {
                        label: template.title,
                        description: `v${template.version} by ${template.author}, tags: ${template.tags}`,
                        detail: template.description,
                        template,
                    };
                });
                if (!includeInstalledModules) {
                    templates =
                        [{
                                label: this.loadIcon,
                                description: "Load additional templates from installed modules",
                                template: undefined,
                            }]
                            .concat(templates);
                }
                else {
                    templates =
                        [{
                                label: this.loadIcon,
                                description: "Refresh template list",
                                template: undefined,
                            }]
                            .concat(templates);
                }
                return templates;
            }
        });
    }
    createProjectFromTemplate(template) {
        vscode.window
            .showInputBox({ placeHolder: "Enter an absolute path to the folder where the project should be created",
            ignoreFocusOut: true })
            .then((destinationPath) => {
            if (destinationPath) {
                // Show the PowerShell session output in case an error occurred
                vscode.commands.executeCommand("PowerShell.ShowSessionOutput");
                this.languageClient
                    .sendRequest(exports.NewProjectFromTemplateRequestType, { templatePath: template.templatePath, destinationPath })
                    .then((result) => {
                    if (result.creationSuccessful) {
                        this.openWorkspacePath(destinationPath);
                    }
                    else {
                        vscode.window.showErrorMessage("Project creation failed, read the Output window for more details.");
                    }
                });
            }
            else {
                vscode.window
                    .showErrorMessage("New Project: You must enter an absolute folder path to continue.  Try again?", "Yes", "No")
                    .then((response) => {
                    if (response === "Yes") {
                        this.createProjectFromTemplate(template);
                    }
                });
            }
        });
    }
    openWorkspacePath(workspacePath) {
        // Open the created project in a new window
        vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(workspacePath), true);
    }
    clearWaitingToken() {
        if (this.waitingForClientToken) {
            this.waitingForClientToken.dispose();
            this.waitingForClientToken = undefined;
        }
    }
}
exports.NewFileOrProjectFeature = NewFileOrProjectFeature;
exports.GetProjectTemplatesRequestType = new vscode_languageclient_1.RequestType("powerShell/getProjectTemplates");
exports.NewProjectFromTemplateRequestType = new vscode_languageclient_1.RequestType("powerShell/newProjectFromTemplate");
//# sourceMappingURL=NewFileOrProject.js.map