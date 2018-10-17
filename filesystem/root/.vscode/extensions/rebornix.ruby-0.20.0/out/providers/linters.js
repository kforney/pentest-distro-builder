"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const debounce = require("lodash/debounce");
const lintCollection_1 = require("../lint/lintCollection");
const lintConfig_1 = require("../lint/lintConfig");
function getGlobalLintConfig() {
    let globalConfig = new lintConfig_1.Config();
    let pathToRuby = vscode.workspace.getConfiguration("ruby.interpreter").commandPath;
    if (pathToRuby) {
        globalConfig.pathToRuby = pathToRuby;
    }
    let useBundler = vscode.workspace.getConfiguration("ruby").get("useBundler");
    if (useBundler !== null) {
        globalConfig.useBundler = useBundler;
    }
    let pathToBundler = vscode.workspace.getConfiguration("ruby").pathToBundler;
    if (pathToBundler) {
        globalConfig.pathToBundler = pathToBundler;
    }
    return globalConfig;
}
function registerLinters(ctx) {
    const globalConfig = getGlobalLintConfig();
    const linters = new lintCollection_1.LintCollection(globalConfig, vscode.workspace.getConfiguration("ruby").lint, vscode.workspace.rootPath);
    ctx.subscriptions.push(linters);
    function executeLinting(e) {
        if (!e)
            return;
        linters.run(e.document);
    }
    // Debounce linting to prevent running on every keypress, only run when typing has stopped
    const lintDebounceTime = vscode.workspace.getConfiguration('ruby').lintDebounceTime;
    const executeDebouncedLinting = debounce(executeLinting, lintDebounceTime);
    ctx.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(executeLinting));
    ctx.subscriptions.push(vscode.workspace.onDidChangeTextDocument(executeDebouncedLinting));
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        const docs = vscode.window.visibleTextEditors.map(editor => editor.document);
        console.log("Config changed. Should lint:", docs.length);
        const globalConfig = getGlobalLintConfig();
        linters.cfg(vscode.workspace.getConfiguration("ruby").lint, globalConfig);
        docs.forEach(doc => linters.run(doc));
    }));
    // run against all of the current open files
    vscode.window.visibleTextEditors.forEach(executeLinting);
}
exports.registerLinters = registerLinters;
//# sourceMappingURL=linters.js.map