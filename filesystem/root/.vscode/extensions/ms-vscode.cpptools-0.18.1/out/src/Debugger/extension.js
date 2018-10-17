Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const os = require("os");
const attachToProcess_1 = require("./attachToProcess");
const nativeAttach_1 = require("./nativeAttach");
const configurationProvider_1 = require("./configurationProvider");
const util = require("../common");
const path = require("path");
let disposables = [];
function initialize() {
    let attachItemsProvider = nativeAttach_1.NativeAttachItemsProviderFactory.Get();
    let attacher = new attachToProcess_1.AttachPicker(attachItemsProvider);
    disposables.push(vscode.commands.registerCommand('extension.pickNativeProcess', () => attacher.ShowAttachEntries()));
    let remoteAttacher = new attachToProcess_1.RemoteAttachPicker();
    disposables.push(vscode.commands.registerCommand('extension.pickRemoteNativeProcess', (any) => remoteAttacher.ShowAttachEntries(any)));
    let configurationProvider = configurationProvider_1.ConfigurationAssetProviderFactory.getConfigurationProvider();
    if (os.platform() === 'win32') {
        disposables.push(vscode.debug.registerDebugConfigurationProvider('cppvsdbg', new configurationProvider_1.CppVsDbgConfigurationProvider(configurationProvider)));
    }
    disposables.push(vscode.debug.registerDebugConfigurationProvider('cppdbg', new configurationProvider_1.CppDbgConfigurationProvider(configurationProvider)));
    configurationProvider.getConfigurationSnippets();
    const launchJsonDocumentSelector = [{
            scheme: 'file',
            language: 'jsonc',
            pattern: '**/launch.json'
        }];
    disposables.push(vscode.languages.registerCompletionItemProvider(launchJsonDocumentSelector, new configurationProvider_1.ConfigurationSnippetProvider(configurationProvider)));
    registerAdapterExecutableCommands();
    vscode.Disposable.from(...disposables);
}
exports.initialize = initialize;
function dispose() {
    disposables.forEach(d => d.dispose());
}
exports.dispose = dispose;
function registerAdapterExecutableCommands() {
    disposables.push(vscode.commands.registerCommand('extension.cppdbgAdapterExecutableCommand', () => {
        return util.isExtensionReady().then(ready => {
            if (ready) {
                let command = path.join(util.extensionContext.extensionPath, './debugAdapters/OpenDebugAD7');
                if (os.platform() === 'win32') {
                    command = path.join(util.extensionContext.extensionPath, "./debugAdapters/bin/OpenDebugAD7.exe");
                }
                return {
                    command: command
                };
            }
            else {
                throw new Error(util.extensionNotReadyString);
            }
        });
    }));
    disposables.push(vscode.commands.registerCommand('extension.cppvsdbgAdapterExecutableCommand', () => {
        if (os.platform() !== 'win32') {
            vscode.window.showErrorMessage("Debugger type 'cppvsdbg' is not avaliable for non-Windows machines.");
            return null;
        }
        else {
            return util.isExtensionReady().then(ready => {
                if (ready) {
                    return {
                        command: path.join(util.extensionContext.extensionPath, './debugAdapters/vsdbg/bin/vsdbg.exe'),
                        args: ['--interpreter=vscode']
                    };
                }
                else {
                    throw new Error(util.extensionNotReadyString);
                }
            });
        }
    }));
}
//# sourceMappingURL=extension.js.map