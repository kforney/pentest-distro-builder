"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_1 = require("vscode");
const locate_1 = require("../locate/locate");
function registerIntellisenseProvider(ctx) {
    // for locate: if it's a project, use the root, othewise, don't bother
    if (vscode.workspace.getConfiguration('ruby').intellisense == 'rubyLocate') {
        const refreshLocate = () => {
            let progressOptions = { location: vscode.ProgressLocation.Window, title: 'Indexing Ruby source files' };
            vscode.window.withProgress(progressOptions, () => locate.walk());
        };
        const settings = vscode.workspace.getConfiguration("ruby.locate") || {};
        let locate = new locate_1.Locate(vscode.workspace.rootPath, settings);
        refreshLocate();
        ctx.subscriptions.push(vscode.commands.registerCommand('ruby.reloadProject', refreshLocate));
        const watch = vscode.workspace.createFileSystemWatcher(settings.include);
        watch.onDidChange(uri => locate.parse(uri.fsPath));
        watch.onDidCreate(uri => locate.parse(uri.fsPath));
        watch.onDidDelete(uri => locate.rm(uri.fsPath));
        const locationConverter = match => new vscode.Location(vscode.Uri.file(match.file), new vscode.Position(match.line, match.char));
        const defProvider = {
            provideDefinition: (doc, pos) => {
                const txt = doc.getText(doc.getWordRangeAtPosition(pos));
                return locate.find(txt).then(matches => matches.map(locationConverter));
            }
        };
        ctx.subscriptions.push(vscode.languages.registerDefinitionProvider(['ruby', 'erb'], defProvider));
        const symbolKindTable = {
            class: () => vscode_1.SymbolKind.Class,
            module: () => vscode_1.SymbolKind.Module,
            method: symbolInfo => symbolInfo.name === 'initialize' ? vscode_1.SymbolKind.Constructor : vscode_1.SymbolKind.Method,
            classMethod: () => vscode_1.SymbolKind.Method,
        };
        const defaultSymbolKind = symbolInfo => {
            console.warn(`Unknown symbol type: ${symbolInfo.type}`);
            return vscode_1.SymbolKind.Variable;
        };
        // NOTE: Workaround for high CPU usage on IPC (channel.onread) when too many symbols returned.
        // For channel.onread see issue like this: https://github.com/Microsoft/vscode/issues/6026
        const numOfSymbolLimit = 3000;
        const symbolsConverter = matches => matches.slice(0, numOfSymbolLimit).map(match => {
            const symbolKind = (symbolKindTable[match.type] || defaultSymbolKind)(match);
            return new vscode_1.SymbolInformation(match.name, symbolKind, match.containerName, locationConverter(match));
        });
        const docSymbolProvider = {
            provideDocumentSymbols: (document, token) => {
                return locate.listInFile(document.fileName).then(symbolsConverter);
            }
        };
        ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(['ruby', 'erb'], docSymbolProvider));
        const workspaceSymbolProvider = {
            provideWorkspaceSymbols: (query, token) => {
                return locate.query(query).then(symbolsConverter);
            }
        };
        ctx.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(workspaceSymbolProvider));
    }
    else {
        var rubyLocateDisabled = () => {
            vscode.window.showInformationMessage('The `ruby.intellisense` configuration is not set to use rubyLocate.');
        };
        ctx.subscriptions.push(vscode.commands.registerCommand('ruby.reloadProject', rubyLocateDisabled));
    }
}
exports.registerIntellisenseProvider = registerIntellisenseProvider;
//# sourceMappingURL=intellisense.js.map