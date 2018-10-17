"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_azureextensionui_1 = require("vscode-azureextensionui");
const dockerExtension_1 = require("../../dockerExtension");
const extensionVariables_1 = require("../../extensionVariables");
const acrTools = require("../../utils/Azure/acrTools");
const nonNull_1 = require("../../utils/nonNull");
const quickPicks = require("../utils/quick-pick-azure");
/** Function to delete an Azure hosted image
 * @param context : if called through right click on AzureImageNode, the node object will be passed in. See azureRegistryNodes.ts for more info
 */
async function deleteAzureImage(context) {
    let registry;
    let repoName;
    let tag;
    if (!context) {
        registry = await quickPicks.quickPickACRRegistry();
        const repository = await quickPicks.quickPickACRRepository(registry, 'Select the repository of the image you want to delete');
        repoName = repository.name;
        const image = await quickPicks.quickPickACRImage(repository, 'Select the image you want to delete');
        tag = image.tag;
    }
    else {
        registry = context.registry;
        let wholeName = context.label.split(':');
        repoName = wholeName[0];
        tag = wholeName[1];
    }
    const shouldDelete = await extensionVariables_1.ext.ui.showWarningMessage(`Are you sure you want to delete ${repoName}:${tag}? `, { modal: true }, vscode_azureextensionui_1.DialogResponses.deleteResponse, vscode_azureextensionui_1.DialogResponses.cancel);
    if (shouldDelete === vscode_azureextensionui_1.DialogResponses.deleteResponse) {
        const { acrAccessToken } = await acrTools.acquireACRAccessTokenFromRegistry(registry, `repository:${repoName}:*`);
        const path = `/v2/_acr/${repoName}/tags/${tag}`;
        await acrTools.sendRequestToRegistry('delete', nonNull_1.getLoginServer(registry), path, acrAccessToken);
        vscode.window.showInformationMessage(`Successfully deleted image ${tag}`);
        if (context) {
            dockerExtension_1.dockerExplorerProvider.refreshNode(context.parent);
        }
        else {
            dockerExtension_1.dockerExplorerProvider.refreshRegistries();
        }
    }
}
exports.deleteAzureImage = deleteAzureImage;
//# sourceMappingURL=delete-image.js.map