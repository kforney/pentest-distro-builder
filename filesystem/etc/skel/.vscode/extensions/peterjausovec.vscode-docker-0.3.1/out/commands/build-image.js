"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const vscode_azureextensionui_1 = require("vscode-azureextensionui");
const dockerExtension_1 = require("../dockerExtension");
const utils_1 = require("../explorer/utils/utils");
const extensionVariables_1 = require("../extensionVariables");
const tag_image_1 = require("./tag-image");
async function getDockerFileUris(folder) {
    return await vscode.workspace.findFiles(new vscode.RelativePattern(folder, dockerExtension_1.DOCKERFILE_GLOB_PATTERN), undefined, 1000, undefined);
}
function createDockerfileItem(rootFolder, uri) {
    let relativeFilePath = path.join(".", uri.fsPath.substr(rootFolder.uri.fsPath.length));
    return {
        description: undefined,
        relativeFilePath: relativeFilePath,
        label: relativeFilePath,
        relativeFolderPath: path.dirname(relativeFilePath)
    };
}
async function resolveDockerFileItem(rootFolder, dockerFileUri) {
    if (dockerFileUri) {
        return createDockerfileItem(rootFolder, dockerFileUri);
    }
    const uris = await getDockerFileUris(rootFolder);
    if (!uris || uris.length === 0) {
        return undefined;
    }
    else {
        let items = uris.map(uri => createDockerfileItem(rootFolder, uri));
        if (items.length === 1) {
            return items[0];
        }
        else {
            const res = await extensionVariables_1.ext.ui.showQuickPick(items, { placeHolder: 'Choose Dockerfile to build' });
            return res;
        }
    }
}
async function buildImage(actionContext, dockerFileUri) {
    const configOptions = vscode.workspace.getConfiguration('docker');
    const defaultContextPath = configOptions.get('imageBuildContextPath', '');
    let dockerFileItem;
    let rootFolder;
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length === 1) {
        rootFolder = vscode.workspace.workspaceFolders[0];
    }
    else {
        let selected = await vscode.window.showWorkspaceFolderPick();
        if (!selected) {
            throw new vscode_azureextensionui_1.UserCancelledError();
        }
        rootFolder = selected;
    }
    if (!rootFolder) {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage('Docker files can only be built if VS Code is opened on a folder.');
        }
        else {
            vscode.window.showErrorMessage('Docker files can only be built if a workspace folder is picked in VS Code.');
        }
        return;
    }
    while (!dockerFileItem) {
        let resolvedItem = await resolveDockerFileItem(rootFolder, dockerFileUri);
        if (resolvedItem) {
            dockerFileItem = resolvedItem;
        }
        else {
            let msg = "Couldn't find a Dockerfile in your workspace. Would you like to add Docker files to the workspace?";
            actionContext.properties.cancelStep = msg;
            await extensionVariables_1.ext.ui.showWarningMessage(msg, vscode_azureextensionui_1.DialogResponses.yes, vscode_azureextensionui_1.DialogResponses.cancel);
            actionContext.properties.cancelStep = undefined;
            await vscode.commands.executeCommand('vscode-docker.configure');
            // Try again
        }
    }
    let contextPath = dockerFileItem.relativeFolderPath;
    if (defaultContextPath && defaultContextPath !== '') {
        contextPath = defaultContextPath;
    }
    let absFilePath = path.join(rootFolder.uri.fsPath, dockerFileItem.relativeFilePath);
    let dockerFileKey = `buildTag_${absFilePath}`;
    let prevImageName = extensionVariables_1.ext.context.globalState.get(dockerFileKey);
    let suggestedImageName;
    if (!prevImageName) {
        // Get imageName based on name of subfolder containing the Dockerfile, or else workspacefolder
        suggestedImageName = path.basename(dockerFileItem.relativeFolderPath).toLowerCase();
        if (suggestedImageName === '.') {
            suggestedImageName = path.basename(rootFolder.uri.fsPath).toLowerCase();
        }
        suggestedImageName += ":latest";
    }
    else {
        suggestedImageName = prevImageName;
    }
    // Temporary work-around for vscode bug where valueSelection can be messed up if a quick pick is followed by a showInputBox
    await utils_1.delay(500);
    tag_image_1.addImageTaggingTelemetry(actionContext, suggestedImageName, '.before');
    const imageName = await tag_image_1.getTagFromUserInput(suggestedImageName, !prevImageName);
    tag_image_1.addImageTaggingTelemetry(actionContext, imageName, '.after');
    await extensionVariables_1.ext.context.globalState.update(dockerFileKey, imageName);
    const terminal = extensionVariables_1.ext.terminalProvider.createTerminal('Docker');
    terminal.sendText(`docker build --rm -f "${dockerFileItem.relativeFilePath}" -t ${imageName} ${contextPath}`);
    terminal.show();
}
exports.buildImage = buildImage;
//# sourceMappingURL=build-image.js.map