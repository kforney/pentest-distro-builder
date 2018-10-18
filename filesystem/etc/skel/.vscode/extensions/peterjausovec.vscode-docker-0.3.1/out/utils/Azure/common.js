"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opn = require("opn");
const vscode = require("vscode");
const vscode_azureextensionui_1 = require("vscode-azureextensionui");
const azureUtilityManager_1 = require("../azureUtilityManager");
let alphaNum = new RegExp('^[a-zA-Z0-9]*$');
function isValidAzureName(value) {
    if (value.length < 5 || value.length > 50) {
        return { isValid: false, message: 'Name must be between 5 and 50 characters' };
    }
    else if (!alphaNum.test(value)) {
        return { isValid: false, message: 'Name may contain alpha numeric characters only' };
    }
    else {
        return { isValid: true };
    }
}
exports.isValidAzureName = isValidAzureName;
/** Uses consistent error handling from register command to replace callbacks for commands that have a dependency on azure account.
 * If the dependency is not found notifies users providing them with information to go download the extension.
 */
// tslint:disable-next-line:no-any
function registerAzureCommand(commandId, callback) {
    let commandItem;
    if (!azureUtilityManager_1.AzureUtilityManager.hasLoadedUtilityManager()) {
        commandItem = () => {
            const open = { title: "View in Marketplace" };
            vscode.window.showErrorMessage('Please install the Azure Account extension to use Azure features.', open).then((response) => {
                if (response === open) {
                    // tslint:disable-next-line:no-unsafe-any
                    opn('https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account');
                }
            });
        };
    }
    else {
        commandItem = callback;
    }
    vscode_azureextensionui_1.registerCommand(commandId, commandItem);
}
exports.registerAzureCommand = registerAzureCommand;
//# sourceMappingURL=common.js.map