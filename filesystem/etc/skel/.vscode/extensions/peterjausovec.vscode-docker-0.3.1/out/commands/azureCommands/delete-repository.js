"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const dockerExtension_1 = require("../../dockerExtension");
const acrTools = require("../../utils/Azure/acrTools");
const nonNull_1 = require("../../utils/nonNull");
const quick_pick_azure_1 = require("../utils/quick-pick-azure");
/**
 * function to delete an Azure repository and its associated images
 * @param context : if called through right click on AzureRepositoryNode, the node object will be passed in. See azureRegistryNodes.ts for more info
 */
async function deleteRepository(context) {
    let registry;
    let repoName;
    if (context) {
        repoName = context.label;
        registry = context.registry;
    }
    else {
        registry = await quick_pick_azure_1.quickPickACRRegistry();
        const repository = await quick_pick_azure_1.quickPickACRRepository(registry, 'Select the repository you want to delete');
        repoName = repository.name;
    }
    const shouldDelete = await quick_pick_azure_1.confirmUserIntent(`Are you sure you want to delete ${repoName} and its associated images?`);
    if (shouldDelete) {
        const { acrAccessToken } = await acrTools.acquireACRAccessTokenFromRegistry(registry, `repository:${repoName}:*`);
        const path = `/v2/_acr/${repoName}/repository`;
        await acrTools.sendRequestToRegistry('delete', nonNull_1.getLoginServer(registry), path, acrAccessToken);
        vscode.window.showInformationMessage(`Successfully deleted repository ${repoName}`);
        if (context) {
            dockerExtension_1.dockerExplorerProvider.refreshNode(context.parent);
        }
        else {
            dockerExtension_1.dockerExplorerProvider.refreshRegistries();
        }
    }
}
exports.deleteRepository = deleteRepository;
//# sourceMappingURL=delete-repository.js.map