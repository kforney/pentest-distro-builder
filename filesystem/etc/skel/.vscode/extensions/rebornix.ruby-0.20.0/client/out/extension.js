"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * LSP client for vscode-ruby
 */
const path = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
function activate(context) {
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'index.js'));
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions },
    };
    const rubyDocumentSelector = [
        { scheme: 'file', language: 'ruby' },
        { scheme: 'untitled', language: 'ruby' },
    ];
    // Options to control the language client
    const clientOptions = {
        documentSelector: rubyDocumentSelector,
        synchronize: {
            configurationSection: 'ruby',
            // Notify the server about file changes to '.clientrc files contain in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc'),
        },
    };
    // Create the language client and start the client.
    const client = new vscode_languageclient_1.LanguageClient('ruby', 'Ruby', serverOptions, clientOptions);
    client.registerProposedFeatures();
    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(client.start());
}
exports.activate = activate;
function deactivate() {
    return undefined;
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map