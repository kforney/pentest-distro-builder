"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const util_1 = require("./util");
const goStatus_1 = require("./goStatus");
const goStatus_2 = require("./goStatus");
/**
 * Runs linter in the current package or workspace.
 */
function lintCode(lintWorkspace) {
    let editor = vscode.window.activeTextEditor;
    if (!editor && !lintWorkspace) {
        vscode.window.showInformationMessage('No editor is active, cannot find current package to lint');
        return;
    }
    if (editor.document.languageId !== 'go' && !lintWorkspace) {
        vscode.window.showInformationMessage('File in the active editor is not a Go file, cannot find current package to lint');
        return;
    }
    let documentUri = editor ? editor.document.uri : null;
    let goConfig = vscode.workspace.getConfiguration('go', documentUri);
    goStatus_1.outputChannel.clear(); // Ensures stale output from lint on save is cleared
    goStatus_2.diagnosticsStatusBarItem.show();
    goStatus_2.diagnosticsStatusBarItem.text = 'Linting...';
    goLint(documentUri, goConfig, lintWorkspace)
        .then(warnings => {
        util_1.handleDiagnosticErrors(editor ? editor.document : null, warnings, vscode.DiagnosticSeverity.Warning);
        goStatus_2.diagnosticsStatusBarItem.hide();
    })
        .catch(err => {
        vscode.window.showInformationMessage('Error: ' + err);
        goStatus_2.diagnosticsStatusBarItem.text = 'Linting Failed';
    });
}
exports.lintCode = lintCode;
/**
 * Runs linter and presents the output in the 'Go' channel and in the diagnostic collections.
 *
 * @param fileUri Document uri.
 * @param goConfig Configuration for the Go extension.
 * @param lintWorkspace If true runs linter in all workspace.
 */
function goLint(fileUri, goConfig, lintWorkspace) {
    epoch++;
    let closureEpoch = epoch;
    if (tokenSource) {
        if (running) {
            tokenSource.cancel();
        }
        tokenSource.dispose();
    }
    tokenSource = new vscode.CancellationTokenSource();
    const currentWorkspace = util_1.getWorkspaceFolderPath(fileUri);
    const cwd = (lintWorkspace && currentWorkspace) ? currentWorkspace : path.dirname(fileUri.fsPath);
    if (!path.isAbsolute(cwd)) {
        return Promise.resolve([]);
    }
    const lintTool = goConfig['lintTool'] || 'golint';
    const lintFlags = goConfig['lintFlags'] || [];
    const lintEnv = Object.assign({}, util_1.getToolsEnvVars());
    const args = [];
    lintFlags.forEach(flag => {
        // --json is not a valid flag for golint and in gometalinter, it is used to print output in json which we dont want
        if (flag === '--json') {
            return;
        }
        if (flag.startsWith('--config=') || flag.startsWith('-config=')) {
            let configFilePath = flag.substr(flag.indexOf('=') + 1).trim();
            if (!configFilePath) {
                return;
            }
            configFilePath = util_1.resolvePath(configFilePath);
            args.push(`${flag.substr(0, flag.indexOf('=') + 1)}${configFilePath}`);
            return;
        }
        args.push(flag);
    });
    if (lintTool === 'gometalinter') {
        if (args.indexOf('--aggregate') === -1) {
            args.push('--aggregate');
        }
        if (goConfig['toolsGopath']) {
            // gometalinter will expect its linters to be in the GOPATH
            // So add the toolsGopath to GOPATH
            lintEnv['GOPATH'] += path.delimiter + goConfig['toolsGopath'];
        }
    }
    if (lintTool === 'golangci-lint') {
        if (args.indexOf('run') === -1) {
            args.unshift('run');
        }
        if (args.indexOf('--print-issued-lines=false') === -1) {
            // print only file:number:column
            args.push('--print-issued-lines=false');
        }
    }
    if (lintWorkspace && currentWorkspace) {
        args.push('./...');
    }
    running = true;
    const lintPromise = util_1.runTool(args, cwd, 'warning', false, lintTool, lintEnv, false, tokenSource.token).then((result) => {
        if (closureEpoch === epoch)
            running = false;
        return result;
    });
    return lintPromise;
}
exports.goLint = goLint;
let epoch = 0;
let tokenSource;
let running = false;
//# sourceMappingURL=goLint.js.map