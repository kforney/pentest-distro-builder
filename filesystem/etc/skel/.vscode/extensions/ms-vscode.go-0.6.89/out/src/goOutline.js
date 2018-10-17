/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
const goInstallTools_1 = require("./goInstallTools");
function documentSymbols(options, token) {
    return new Promise((resolve, reject) => {
        let gooutline = util_1.getBinPath('go-outline');
        let gooutlineFlags = ['-f', options.fileName];
        if (options.importsOnly) {
            gooutlineFlags.push('-imports-only');
        }
        if (options.document) {
            gooutlineFlags.push('-modified');
        }
        let p;
        if (token) {
            token.onCancellationRequested(() => util_1.killProcess(p));
        }
        // Spawn `go-outline` process
        p = cp.execFile(gooutline, gooutlineFlags, { env: util_1.getToolsEnvVars() }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('go-outline');
                }
                if (stderr && stderr.startsWith('flag provided but not defined: ')) {
                    goInstallTools_1.promptForUpdatingTool('go-outline');
                    if (stderr.startsWith('flag provided but not defined: -imports-only')) {
                        options.importsOnly = false;
                    }
                    if (stderr.startsWith('flag provided but not defined: -modified')) {
                        options.document = null;
                    }
                    p = null;
                    return documentSymbols(options, token).then(results => {
                        return resolve(results);
                    });
                }
                if (err)
                    return resolve(null);
                let result = stdout.toString();
                let decls = JSON.parse(result);
                return resolve(decls);
            }
            catch (e) {
                reject(e);
            }
        });
        if (options.document && p.pid) {
            p.stdin.end(util_1.getFileArchive(options.document));
        }
    });
}
exports.documentSymbols = documentSymbols;
class GoDocumentSymbolProvider {
    constructor() {
        this.goKindToCodeKind = {
            'package': vscode.SymbolKind.Package,
            'import': vscode.SymbolKind.Namespace,
            'variable': vscode.SymbolKind.Variable,
            'type': vscode.SymbolKind.Interface,
            'function': vscode.SymbolKind.Function
        };
    }
    convertToCodeSymbols(document, decls, symbols, containerName, byteOffsetToDocumentOffset) {
        let gotoSymbolConfig = vscode.workspace.getConfiguration('go', document.uri)['gotoSymbol'];
        let includeImports = gotoSymbolConfig ? gotoSymbolConfig['includeImports'] : false;
        (decls || []).forEach(decl => {
            if (!includeImports && decl.type === 'import')
                return;
            let label = decl.label;
            if (decl.receiverType) {
                label = '(' + decl.receiverType + ').' + label;
            }
            let start = byteOffsetToDocumentOffset(decl.start - 1);
            let end = byteOffsetToDocumentOffset(decl.end - 1);
            let symbolInfo = new vscode.SymbolInformation(label, this.goKindToCodeKind[decl.type], new vscode.Range(document.positionAt(start), document.positionAt(end)), document.uri, containerName);
            symbols.push(symbolInfo);
            if (decl.children) {
                this.convertToCodeSymbols(document, decl.children, symbols, decl.label, byteOffsetToDocumentOffset);
            }
        });
    }
    provideDocumentSymbols(document, token) {
        let options = { fileName: document.fileName, document: document };
        return documentSymbols(options, token).then(decls => {
            let symbols = [];
            this.convertToCodeSymbols(document, decls, symbols, '', util_1.makeMemoizedByteOffsetConverter(new Buffer(document.getText())));
            return symbols;
        });
    }
}
exports.GoDocumentSymbolProvider = GoDocumentSymbolProvider;
//# sourceMappingURL=goOutline.js.map