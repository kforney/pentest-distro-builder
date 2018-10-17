/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const goSuggest_1 = require("./goSuggest");
const goExtraInfo_1 = require("./goExtraInfo");
const goDeclaration_1 = require("./goDeclaration");
const goReferences_1 = require("./goReferences");
const goImplementations_1 = require("./goImplementations");
const goFormat_1 = require("./goFormat");
const goRename_1 = require("./goRename");
const goOutline_1 = require("./goOutline");
const goRunTestCodelens_1 = require("./goRunTestCodelens");
const goSignature_1 = require("./goSignature");
const goSymbol_1 = require("./goSymbol");
const goCodeAction_1 = require("./goCodeAction");
const goCheck_1 = require("./goCheck");
const goInstallTools_1 = require("./goInstallTools");
const goMode_1 = require("./goMode");
const goStatus_1 = require("./goStatus");
const goCover_1 = require("./goCover");
const goCover_2 = require("./goCover");
const goTest_1 = require("./goTest");
const testUtils_1 = require("./testUtils");
const goGenerateTests = require("./goGenerateTests");
const goImport_1 = require("./goImport");
const goInstallTools_2 = require("./goInstallTools");
const util_1 = require("./util");
const vscode_languageclient_1 = require("vscode-languageclient");
const goPath_1 = require("./goPath");
const goModifytags_1 = require("./goModifytags");
const goFillStruct_1 = require("./goFillStruct");
const goLiveErrors_1 = require("./goLiveErrors");
const goReferencesCodelens_1 = require("./goReferencesCodelens");
const goImpl_1 = require("./goImpl");
const goBrowsePackage_1 = require("./goBrowsePackage");
const goGetPackage_1 = require("./goGetPackage");
const goDebugConfiguration_1 = require("./goDebugConfiguration");
const goPlayground_1 = require("./goPlayground");
const goLint_1 = require("./goLint");
const goVet_1 = require("./goVet");
const goBuild_1 = require("./goBuild");
const goInstall_1 = require("./goInstall");
function activate(ctx) {
    let useLangServer = vscode.workspace.getConfiguration('go')['useLanguageServer'];
    goInstallTools_1.updateGoPathGoRootFromConfig().then(() => {
        const updateToolsCmdText = 'Update tools';
        const prevGoroot = ctx.globalState.get('goroot');
        const currentGoroot = process.env['GOROOT'];
        if (prevGoroot !== currentGoroot && prevGoroot) {
            vscode.window.showInformationMessage('Your goroot is different than before, few Go tools may need re-compiling', updateToolsCmdText).then(selected => {
                if (selected === updateToolsCmdText) {
                    goInstallTools_2.installAllTools(true);
                }
            });
        }
        else {
            util_1.getGoVersion().then(currentVersion => {
                if (currentVersion) {
                    const prevVersion = ctx.globalState.get('goVersion');
                    const currVersionString = `${currentVersion.major}.${currentVersion.minor}`;
                    if (prevVersion !== currVersionString) {
                        if (prevVersion) {
                            vscode.window.showInformationMessage('Your Go version is different than before, few Go tools may need re-compiling', updateToolsCmdText).then(selected => {
                                if (selected === updateToolsCmdText) {
                                    goInstallTools_2.installAllTools(true);
                                }
                            });
                        }
                        ctx.globalState.update('goVersion', currVersionString);
                    }
                }
            });
        }
        ctx.globalState.update('goroot', currentGoroot);
        goInstallTools_1.offerToInstallTools();
        if (goInstallTools_2.checkLanguageServer()) {
            const languageServerExperimentalFeatures = vscode.workspace.getConfiguration('go').get('languageServerExperimentalFeatures') || {};
            let langServerFlags = vscode.workspace.getConfiguration('go')['languageServerFlags'] || [];
            const c = new vscode_languageclient_1.LanguageClient('go-langserver', {
                command: util_1.getBinPath('go-langserver'),
                args: ['-mode=stdio', ...langServerFlags],
                options: {
                    env: util_1.getToolsEnvVars()
                }
            }, {
                initializationOptions: {
                    funcSnippetEnabled: vscode.workspace.getConfiguration('go')['useCodeSnippetsOnFunctionSuggest'],
                    gocodeCompletionEnabled: languageServerExperimentalFeatures['autoComplete']
                },
                documentSelector: ['go'],
                uriConverters: {
                    // Apply file:/// scheme to all file paths.
                    code2Protocol: (uri) => (uri.scheme ? uri : uri.with({ scheme: 'file' })).toString(),
                    protocol2Code: (uri) => vscode.Uri.parse(uri),
                },
                revealOutputChannelOn: vscode_languageclient_1.RevealOutputChannelOn.Never,
                middleware: {
                    provideDocumentFormattingEdits: (document, options, token, next) => {
                        if (languageServerExperimentalFeatures['format'] === true) {
                            return next(document, options, token);
                        }
                        return [];
                    },
                    provideCompletionItem: (document, position, context, token, next) => {
                        if (languageServerExperimentalFeatures['autoComplete'] === true) {
                            return next(document, position, context, token);
                        }
                        return [];
                    }
                }
            });
            c.onReady().then(() => {
                const capabilities = c.initializeResult && c.initializeResult.capabilities;
                if (!capabilities) {
                    return vscode.window.showErrorMessage('The language server is not able to serve any features at the moment.');
                }
                const outdatedMsg = `Your installed version of "go-langserver" is out of date and does not support {0}. Falling back to default behavior.`;
                if (languageServerExperimentalFeatures['autoComplete'] !== true || !capabilities.completionProvider) {
                    registerCompletionProvider(ctx);
                    if (languageServerExperimentalFeatures['autoComplete'] === true) {
                        vscode.window.showInformationMessage(outdatedMsg.replace('{0}', 'code completion'));
                    }
                }
                if (languageServerExperimentalFeatures['format'] !== true || !capabilities.documentFormattingProvider) {
                    ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(goMode_1.GO_MODE, new goFormat_1.GoDocumentFormattingEditProvider()));
                    if (languageServerExperimentalFeatures['format'] === true) {
                        vscode.window.showInformationMessage(outdatedMsg.replace('{0}', 'code formatting'));
                    }
                }
            });
            ctx.subscriptions.push(c.start());
        }
        else {
            registerCompletionProvider(ctx);
            ctx.subscriptions.push(vscode.languages.registerHoverProvider(goMode_1.GO_MODE, new goExtraInfo_1.GoHoverProvider()));
            ctx.subscriptions.push(vscode.languages.registerDefinitionProvider(goMode_1.GO_MODE, new goDeclaration_1.GoDefinitionProvider()));
            ctx.subscriptions.push(vscode.languages.registerReferenceProvider(goMode_1.GO_MODE, new goReferences_1.GoReferenceProvider()));
            ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(goMode_1.GO_MODE, new goOutline_1.GoDocumentSymbolProvider()));
            ctx.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new goSymbol_1.GoWorkspaceSymbolProvider()));
            ctx.subscriptions.push(vscode.languages.registerSignatureHelpProvider(goMode_1.GO_MODE, new goSignature_1.GoSignatureHelpProvider(), '(', ','));
            ctx.subscriptions.push(vscode.languages.registerImplementationProvider(goMode_1.GO_MODE, new goImplementations_1.GoImplementationProvider()));
            ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(goMode_1.GO_MODE, new goFormat_1.GoDocumentFormattingEditProvider()));
        }
        if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === 'go' && util_1.isGoPathSet()) {
            runBuilds(vscode.window.activeTextEditor.document, vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor.document.uri));
        }
    });
    goCover_2.initGoCover(ctx);
    let testCodeLensProvider = new goRunTestCodelens_1.GoRunTestCodeLensProvider();
    let referencesCodeLensProvider = new goReferencesCodelens_1.GoReferencesCodeLensProvider();
    ctx.subscriptions.push(vscode.languages.registerRenameProvider(goMode_1.GO_MODE, new goRename_1.GoRenameProvider()));
    ctx.subscriptions.push(vscode.languages.registerCodeActionsProvider(goMode_1.GO_MODE, new goCodeAction_1.GoCodeActionProvider()));
    ctx.subscriptions.push(vscode.languages.registerCodeLensProvider(goMode_1.GO_MODE, testCodeLensProvider));
    ctx.subscriptions.push(vscode.languages.registerCodeLensProvider(goMode_1.GO_MODE, referencesCodeLensProvider));
    ctx.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('go', new goDebugConfiguration_1.GoDebugConfigurationProvider()));
    exports.errorDiagnosticCollection = vscode.languages.createDiagnosticCollection('go-error');
    ctx.subscriptions.push(exports.errorDiagnosticCollection);
    exports.warningDiagnosticCollection = vscode.languages.createDiagnosticCollection('go-warning');
    ctx.subscriptions.push(exports.warningDiagnosticCollection);
    vscode.workspace.onDidChangeTextDocument(goCover_1.removeCodeCoverage, null, ctx.subscriptions);
    vscode.workspace.onDidChangeTextDocument(goCheck_1.removeTestStatus, null, ctx.subscriptions);
    vscode.window.onDidChangeActiveTextEditor(goStatus_1.showHideStatus, null, ctx.subscriptions);
    vscode.window.onDidChangeActiveTextEditor(goCover_1.getCodeCoverage, null, ctx.subscriptions);
    vscode.workspace.onDidChangeTextDocument(goLiveErrors_1.parseLiveFile, null, ctx.subscriptions);
    vscode.workspace.onDidChangeTextDocument(goCheck_1.notifyIfGeneratedFile, ctx, ctx.subscriptions);
    startBuildOnSaveWatcher(ctx.subscriptions);
    ctx.subscriptions.push(vscode.commands.registerCommand('go.gopath', () => {
        let gopath = util_1.getCurrentGoPath();
        let msg = `${gopath} is the current GOPATH.`;
        let wasInfered = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null)['inferGopath'];
        let root = vscode.workspace.rootPath;
        if (vscode.window.activeTextEditor && vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)) {
            root = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri.fsPath;
            root = goPath_1.fixDriveCasingInWindows(root);
        }
        // not only if it was configured, but if it was successful.
        if (wasInfered && root && root.indexOf(gopath) === 0) {
            const inferredFrom = vscode.window.activeTextEditor ? 'current folder' : 'workspace root';
            msg += ` It is inferred from ${inferredFrom}`;
        }
        vscode.window.showInformationMessage(msg);
        return gopath;
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.add.tags', (args) => {
        goModifytags_1.addTags(args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.remove.tags', (args) => {
        goModifytags_1.removeTags(args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.fill.struct', () => {
        goFillStruct_1.runFillStruct(vscode.window.activeTextEditor);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.impl.cursor', () => {
        goImpl_1.implCursor();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.cursor', (args) => {
        let goConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
        let isBenchmark = false;
        goTest_1.testAtCursor(goConfig, isBenchmark, args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.benchmark.cursor', (args) => {
        let goConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
        let isBenchmark = true;
        goTest_1.testAtCursor(goConfig, isBenchmark, args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.package', (args) => {
        let goConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
        goTest_1.testCurrentPackage(goConfig, args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.file', (args) => {
        let goConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
        goTest_1.testCurrentFile(goConfig, args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.workspace', (args) => {
        let goConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
        goTest_1.testWorkspace(goConfig, args);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.previous', () => {
        goTest_1.testPrevious();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.coverage', () => {
        goCover_1.toggleCoverageCurrentPackage();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.showOutput', () => {
        testUtils_1.showTestOutput();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.cancel', () => {
        testUtils_1.cancelRunningTests();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.import.add', (arg) => {
        return goImport_1.addImport(typeof arg === 'string' ? arg : null);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.add.package.workspace', () => {
        goImport_1.addImportToWorkspace();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.tools.install', () => {
        goInstallTools_2.installAllTools();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.browse.packages', () => {
        goBrowsePackage_1.browsePackages();
    }));
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
        if (!e.affectsConfiguration('go')) {
            return;
        }
        let updatedGoConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
        sendTelemetryEventForConfig(updatedGoConfig);
        goInstallTools_1.updateGoPathGoRootFromConfig();
        // If there was a change in "useLanguageServer" setting, then ask the user to reload VS Code.
        if (process.platform !== 'win32'
            && didLangServerConfigChange(e)
            && (!updatedGoConfig['useLanguageServer'] || goInstallTools_2.checkLanguageServer())) {
            vscode.window.showInformationMessage('Reload VS Code window for the change in usage of language server to take effect', 'Reload').then(selected => {
                if (selected === 'Reload') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
        }
        useLangServer = updatedGoConfig['useLanguageServer'];
        // If there was a change in "toolsGopath" setting, then clear cache for go tools
        if (util_1.getToolsGopath() !== util_1.getToolsGopath(false)) {
            goPath_1.clearCacheForTools();
        }
        if (updatedGoConfig['enableCodeLens']) {
            testCodeLensProvider.setEnabled(updatedGoConfig['enableCodeLens']['runtest']);
            referencesCodeLensProvider.setEnabled(updatedGoConfig['enableCodeLens']['references']);
        }
        if (e.affectsConfiguration('go.formatTool')) {
            checkToolExists(updatedGoConfig['formatTool']);
        }
        if (e.affectsConfiguration('go.lintTool')) {
            checkToolExists(updatedGoConfig['lintTool']);
        }
        if (e.affectsConfiguration('go.docsTool')) {
            checkToolExists(updatedGoConfig['docsTool']);
        }
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.generate.package', () => {
        goGenerateTests.generateTestCurrentPackage();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.generate.file', () => {
        goGenerateTests.generateTestCurrentFile();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.test.generate.function', () => {
        goGenerateTests.generateTestCurrentFunction();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.toggle.test.file', () => {
        goGenerateTests.toggleTestFile();
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.debug.startSession', config => {
        let workspaceFolder;
        if (vscode.window.activeTextEditor) {
            workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        }
        return vscode.debug.startDebugging(workspaceFolder, config);
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.show.commands', () => {
        vscode.window.showQuickPick(util_1.getExtensionCommands().map(x => x.title)).then(cmd => {
            let selectedCmd = util_1.getExtensionCommands().find(x => x.title === cmd);
            if (selectedCmd) {
                vscode.commands.executeCommand(selectedCmd.command);
            }
        });
    }));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.get.package', goGetPackage_1.goGetPackage));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.playground', goPlayground_1.playgroundCommand));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.lint.package', goLint_1.lintCode));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.lint.workspace', () => goLint_1.lintCode(true)));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.vet.package', goVet_1.vetCode));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.vet.workspace', () => goVet_1.vetCode(true)));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.build.package', goBuild_1.buildCode));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.build.workspace', () => goBuild_1.buildCode(true)));
    ctx.subscriptions.push(vscode.commands.registerCommand('go.install.package', goInstall_1.installCurrentPackage));
    vscode.languages.setLanguageConfiguration(goMode_1.GO_MODE.language, {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    });
    sendTelemetryEventForConfig(vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null));
}
exports.activate = activate;
function deactivate() {
    return Promise.all([util_1.disposeTelemetryReporter(), testUtils_1.cancelRunningTests()]);
}
exports.deactivate = deactivate;
function runBuilds(document, goConfig) {
    if (document.languageId !== 'go') {
        return;
    }
    exports.errorDiagnosticCollection.clear();
    exports.warningDiagnosticCollection.clear();
    goCheck_1.check(document.uri, goConfig)
        .then((errors) => {
        util_1.handleDiagnosticErrors(document, errors);
    })
        .catch(err => {
        vscode.window.showInformationMessage('Error: ' + err);
    });
}
function startBuildOnSaveWatcher(subscriptions) {
    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId !== 'go') {
            return;
        }
        runBuilds(document, vscode.workspace.getConfiguration('go', document.uri));
    }, null, subscriptions);
}
function sendTelemetryEventForConfig(goConfig) {
    /* __GDPR__
       "goConfig" : {
          "buildOnSave" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "buildFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "buildTags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "formatTool": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "formatFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "lintOnSave": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "lintFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "lintTool": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "vetOnSave": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "vetFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "testOnSave": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "testFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "coverOnSave": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "coverOnTestPackage": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "coverageDecorator": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "coverageOptions": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "gopath": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "goroot": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "inferGopath": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "toolsGopath": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "gocodeAutoBuild": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "gocodePackageLookupMode": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "useCodeSnippetsOnFunctionSuggest": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "useCodeSnippetsOnFunctionSuggestWithoutType": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "autocompleteUnimportedPackages": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "docsTool": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "useLanguageServer": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "includeImports": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "addTags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "removeTags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
          "editorContextMenuCommands": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "liveErrors": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "codeLens": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
          "alternateTools": { "classification": "CustomerContent", "purpose": "FeatureInsight" }
       }
     */
    util_1.sendTelemetryEvent('goConfig', {
        buildOnSave: goConfig['buildOnSave'] + '',
        buildFlags: goConfig['buildFlags'],
        buildTags: goConfig['buildTags'],
        formatOnSave: goConfig['formatOnSave'] + '',
        formatTool: goConfig['formatTool'],
        formatFlags: goConfig['formatFlags'],
        lintOnSave: goConfig['lintOnSave'] + '',
        lintFlags: goConfig['lintFlags'],
        lintTool: goConfig['lintTool'],
        vetOnSave: goConfig['vetOnSave'] + '',
        vetFlags: goConfig['vetFlags'],
        testOnSave: goConfig['testOnSave'] + '',
        testFlags: goConfig['testFlags'],
        coverOnSave: goConfig['coverOnSave'] + '',
        coverOnTestPackage: goConfig['coverOnTestPackage'] + '',
        coverageDecorator: goConfig['coverageDecorator'],
        coverageOptions: goConfig['coverageOptions'],
        gopath: goConfig['gopath'] ? 'set' : '',
        goroot: goConfig['goroot'] ? 'set' : '',
        inferGopath: goConfig['inferGopath'] + '',
        toolsGopath: goConfig['toolsGopath'] ? 'set' : '',
        gocodeAutoBuild: goConfig['gocodeAutoBuild'] + '',
        gocodePackageLookupMode: goConfig['gocodePackageLookupMode'] + '',
        useCodeSnippetsOnFunctionSuggest: goConfig['useCodeSnippetsOnFunctionSuggest'] + '',
        useCodeSnippetsOnFunctionSuggestWithoutType: goConfig['useCodeSnippetsOnFunctionSuggestWithoutType'] + '',
        autocompleteUnimportedPackages: goConfig['autocompleteUnimportedPackages'] + '',
        docsTool: goConfig['docsTool'],
        useLanguageServer: goConfig['useLanguageServer'] + '',
        languageServerExperimentalFeatures: JSON.stringify(goConfig['languageServerExperimentalFeatures']),
        includeImports: goConfig['gotoSymbol'] && goConfig['gotoSymbol']['includeImports'] + '',
        addTags: JSON.stringify(goConfig['addTags']),
        removeTags: JSON.stringify(goConfig['removeTags']),
        editorContextMenuCommands: JSON.stringify(goConfig['editorContextMenuCommands']),
        liveErrors: JSON.stringify(goConfig['liveErrors']),
        codeLens: JSON.stringify(goConfig['enableCodeLens']),
        alternateTools: JSON.stringify(goConfig['alternateTools'])
    });
}
function didLangServerConfigChange(e) {
    return e.affectsConfiguration('go.useLanguageServer') || e.affectsConfiguration('go.languageServerFlags') || e.affectsConfiguration('go.languageServerExperimentalFeatures');
}
function checkToolExists(tool) {
    if (tool === util_1.getBinPath(tool)) {
        goInstallTools_1.promptForMissingTool(tool);
    }
}
function registerCompletionProvider(ctx) {
    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(goMode_1.GO_MODE, new goSuggest_1.GoCompletionItemProvider(ctx.globalState), '.', '\"'));
}
//# sourceMappingURL=goMain.js.map