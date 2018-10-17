'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const testApi_1 = require("vscode-cpptools/out/testApi");
const util = require("../common");
const configs = require("./configurations");
const settings_1 = require("./settings");
const telemetry = require("../telemetry");
const persistentState_1 = require("./persistentState");
const ui_1 = require("./ui");
const protocolFilter_1 = require("./protocolFilter");
const dataBinding_1 = require("./dataBinding");
const minimatch = require("minimatch");
const logger = require("../logger");
const extension_1 = require("./extension");
const vscode_1 = require("vscode");
const settingsTracker_1 = require("./settingsTracker");
const testHook_1 = require("../testHook");
const customProviders_1 = require("../LanguageServer/customProviders");
let ui;
const configProviderTimeout = 2000;
const NavigationListRequest = new vscode_languageclient_1.RequestType('cpptools/requestNavigationList');
const GoToDeclarationRequest = new vscode_languageclient_1.RequestType('cpptools/goToDeclaration');
const QueryCompilerDefaultsRequest = new vscode_languageclient_1.RequestType('cpptools/queryCompilerDefaults');
const SwitchHeaderSourceRequest = new vscode_languageclient_1.RequestType('cpptools/didSwitchHeaderSource');
const DidOpenNotification = new vscode_languageclient_1.NotificationType('textDocument/didOpen');
const FileCreatedNotification = new vscode_languageclient_1.NotificationType('cpptools/fileCreated');
const FileDeletedNotification = new vscode_languageclient_1.NotificationType('cpptools/fileDeleted');
const ResetDatabaseNotification = new vscode_languageclient_1.NotificationType('cpptools/resetDatabase');
const PauseParsingNotification = new vscode_languageclient_1.NotificationType('cpptools/pauseParsing');
const ResumeParsingNotification = new vscode_languageclient_1.NotificationType('cpptools/resumeParsing');
const ActiveDocumentChangeNotification = new vscode_languageclient_1.NotificationType('cpptools/activeDocumentChange');
const TextEditorSelectionChangeNotification = new vscode_languageclient_1.NotificationType('cpptools/textEditorSelectionChange');
const ChangeFolderSettingsNotification = new vscode_languageclient_1.NotificationType('cpptools/didChangeFolderSettings');
const ChangeCompileCommandsNotification = new vscode_languageclient_1.NotificationType('cpptools/didChangeCompileCommands');
const ChangeSelectedSettingNotification = new vscode_languageclient_1.NotificationType('cpptools/didChangeSelectedSetting');
const IntervalTimerNotification = new vscode_languageclient_1.NotificationType('cpptools/onIntervalTimer');
const CustomConfigurationNotification = new vscode_languageclient_1.NotificationType('cpptools/didChangeCustomConfiguration');
const ClearCustomConfigurationsNotification = new vscode_languageclient_1.NotificationType('cpptools/clearCustomConfigurations');
const ReloadWindowNotification = new vscode_languageclient_1.NotificationType('cpptools/reloadWindow');
const LogTelemetryNotification = new vscode_languageclient_1.NotificationType('cpptools/logTelemetry');
const ReportNavigationNotification = new vscode_languageclient_1.NotificationType('cpptools/reportNavigation');
const ReportTagParseStatusNotification = new vscode_languageclient_1.NotificationType('cpptools/reportTagParseStatus');
const ReportStatusNotification = new vscode_languageclient_1.NotificationType('cpptools/reportStatus');
const DebugProtocolNotification = new vscode_languageclient_1.NotificationType('cpptools/debugProtocol');
const DebugLogNotification = new vscode_languageclient_1.NotificationType('cpptools/debugLog');
const InactiveRegionNotification = new vscode_languageclient_1.NotificationType('cpptools/inactiveRegions');
const CompileCommandsPathsNotification = new vscode_languageclient_1.NotificationType('cpptools/compileCommandsPaths');
const UpdateClangFormatPathNotification = new vscode_languageclient_1.NotificationType('cpptools/updateClangFormatPath');
let failureMessageShown = false;
function createClient(allClients, workspaceFolder) {
    return new DefaultClient(allClients, workspaceFolder);
}
exports.createClient = createClient;
function createNullClient() {
    return new NullClient();
}
exports.createNullClient = createNullClient;
class DefaultClient {
    constructor(allClients, workspaceFolder) {
        this.disposables = [];
        this.trackedDocuments = new Set();
        this.crashTimes = [];
        this.isSupported = true;
        this.inactiveRegionsDecorations = new Map();
        this.model = {
            isTagParsing: new dataBinding_1.DataBinding(false),
            isUpdatingIntelliSense: new dataBinding_1.DataBinding(false),
            navigationLocation: new dataBinding_1.DataBinding(""),
            tagParserStatus: new dataBinding_1.DataBinding(""),
            activeConfigName: new dataBinding_1.DataBinding("")
        };
        this.pendingRequests = 0;
        try {
            let languageClient = this.createLanguageClient(allClients, workspaceFolder);
            languageClient.registerProposedFeatures();
            languageClient.start();
            util.setProgress(util.getProgressExecutableStarted());
            this.rootFolder = workspaceFolder;
            ui = ui_1.getUI();
            ui.bind(this);
            this.queueTask(() => languageClient.onReady().then(() => {
                this.configuration = new configs.CppProperties(this.RootUri);
                this.configuration.ConfigurationsChanged((e) => this.onConfigurationsChanged(e));
                this.configuration.SelectionChanged((e) => this.onSelectedConfigurationChanged(e));
                this.configuration.CompileCommandsChanged((e) => this.onCompileCommandsChanged(e));
                this.disposables.push(this.configuration);
                languageClient.sendRequest(QueryCompilerDefaultsRequest, {}).then((compilerDefaults) => {
                    this.configuration.CompilerDefaults = compilerDefaults;
                });
                this.languageClient = languageClient;
                this.settingsTracker = settingsTracker_1.getTracker(this.RootUri);
                telemetry.logLanguageServerEvent("NonDefaultInitialCppSettings", this.settingsTracker.getUserModifiedSettings());
                failureMessageShown = false;
                this.registerNotifications();
                this.registerFileWatcher();
            }, (err) => {
                this.isSupported = false;
                if (!failureMessageShown) {
                    failureMessageShown = true;
                    vscode.window.showErrorMessage("Unable to start the C/C++ language server. IntelliSense features will be disabled. Error: " + String(err));
                }
            }));
        }
        catch (err) {
            this.isSupported = false;
            if (!failureMessageShown) {
                failureMessageShown = true;
                let additionalInfo;
                if (err.code === "EPERM") {
                    additionalInfo = `EPERM: Check permissions for '${getLanguageServerFileName()}'`;
                }
                else {
                    additionalInfo = String(err);
                }
                vscode.window.showErrorMessage("Unable to start the C/C++ language server. IntelliSense features will be disabled. Error: " + additionalInfo);
            }
        }
    }
    get TagParsingChanged() { return this.model.isTagParsing.ValueChanged; }
    get IntelliSenseParsingChanged() { return this.model.isUpdatingIntelliSense.ValueChanged; }
    get NavigationLocationChanged() { return this.model.navigationLocation.ValueChanged; }
    get TagParserStatusChanged() { return this.model.tagParserStatus.ValueChanged; }
    get ActiveConfigChanged() { return this.model.activeConfigName.ValueChanged; }
    get RootPath() {
        return (this.rootFolder) ? this.rootFolder.uri.fsPath : "";
    }
    get RootUri() {
        return (this.rootFolder) ? this.rootFolder.uri : null;
    }
    get Name() {
        return this.getName(this.rootFolder);
    }
    get TrackedDocuments() {
        return this.trackedDocuments;
    }
    getName(workspaceFolder) {
        return workspaceFolder ? workspaceFolder.name : "untitled";
    }
    createLanguageClient(allClients, workspaceFolder) {
        let serverModule = getLanguageServerFileName();
        let serverName = this.getName(workspaceFolder);
        let serverOptions = {
            run: { command: serverModule },
            debug: { command: serverModule, args: [serverName] }
        };
        let settings = new settings_1.CppSettings(workspaceFolder ? workspaceFolder.uri : null);
        let other = new settings_1.OtherSettings(workspaceFolder ? workspaceFolder.uri : null);
        let storagePath = util.extensionContext.storagePath;
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
            storagePath = path.join(storagePath, serverName);
        }
        let clientOptions = {
            documentSelector: [
                { scheme: 'file', language: 'cpp' },
                { scheme: 'file', language: 'c' }
            ],
            synchronize: {
                configurationSection: ['C_Cpp', 'files', 'search']
            },
            workspaceFolder: workspaceFolder,
            initializationOptions: {
                clang_format_path: util.resolveVariables(settings.clangFormatPath, null),
                clang_format_style: settings.clangFormatStyle,
                clang_format_fallbackStyle: settings.clangFormatFallbackStyle,
                clang_format_sortIncludes: settings.clangFormatSortIncludes,
                formatting: settings.formatting,
                extension_path: util.extensionContext.extensionPath,
                exclude_files: other.filesExclude,
                exclude_search: other.searchExclude,
                storage_path: storagePath,
                tab_size: other.editorTabSize,
                intelliSenseEngine: settings.intelliSenseEngine,
                intelliSenseEngineFallback: settings.intelliSenseEngineFallback,
                autocomplete: settings.autoComplete,
                errorSquiggles: settings.errorSquiggles,
                dimInactiveRegions: settings.dimInactiveRegions,
                loggingLevel: settings.loggingLevel,
                workspaceParsingPriority: settings.workspaceParsingPriority,
                workspaceSymbols: settings.workspaceSymbols,
                exclusionPolicy: settings.exclusionPolicy,
                preferredPathSeparator: settings.preferredPathSeparator,
                default: {
                    systemIncludePath: settings.defaultSystemIncludePath
                },
                vcpkg_root: util.getVcpkgRoot()
            },
            middleware: protocolFilter_1.createProtocolFilter(this, allClients),
            errorHandler: {
                error: () => vscode_languageclient_1.ErrorAction.Continue,
                closed: () => {
                    this.crashTimes.push(Date.now());
                    if (this.crashTimes.length < 5) {
                        let newClient = allClients.replace(this, true);
                        newClient.crashTimes = this.crashTimes;
                    }
                    else {
                        let elapsed = this.crashTimes[this.crashTimes.length - 1] - this.crashTimes[0];
                        if (elapsed <= 3 * 60 * 1000) {
                            if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
                                vscode.window.showErrorMessage(`The language server for '${serverName}' crashed 5 times in the last 3 minutes. It will not be restarted.`);
                            }
                            else {
                                vscode.window.showErrorMessage(`The language server crashed 5 times in the last 3 minutes. It will not be restarted.`);
                            }
                            allClients.replace(this, false);
                        }
                        else {
                            this.crashTimes.shift();
                            let newClient = allClients.replace(this, true);
                            newClient.crashTimes = this.crashTimes;
                        }
                    }
                    return vscode_languageclient_1.CloseAction.DoNotRestart;
                }
            }
        };
        return new vscode_languageclient_1.LanguageClient(`cpptools: ${serverName}`, serverOptions, clientOptions);
    }
    onDidChangeSettings() {
        let changedSettings = this.settingsTracker.getChangedSettings();
        if (Object.keys(changedSettings).length > 0) {
            if (changedSettings["commentContinuationPatterns"]) {
                extension_1.updateLanguageConfigurations();
            }
            if (changedSettings["clang_format_path"]) {
                let settings = new settings_1.CppSettings(this.RootUri);
                this.languageClient.sendNotification(UpdateClangFormatPathNotification, util.resolveVariables(settings.clangFormatPath, null));
            }
            this.configuration.onDidChangeSettings();
            telemetry.logLanguageServerEvent("CppSettingsChange", changedSettings, null);
        }
    }
    onDidChangeVisibleTextEditors(editors) {
        let settings = new settings_1.CppSettings(this.RootUri);
        if (settings.dimInactiveRegions) {
            for (let e of editors) {
                let valuePair = this.inactiveRegionsDecorations.get(e.document.uri.toString());
                if (valuePair) {
                    e.setDecorations(valuePair.decoration, valuePair.ranges);
                }
            }
        }
    }
    onRegisterCustomConfigurationProvider(provider) {
        return this.notifyWhenReady(() => {
            if (!this.RootPath) {
                return;
            }
            let selectedProvider = this.configuration.CurrentConfigurationProvider;
            if (!selectedProvider) {
                let ask = new persistentState_1.PersistentFolderState("Client.registerProvider", true, this.RootPath);
                if (ask.Value) {
                    ui.showConfigureCustomProviderMessage(() => {
                        let folderStr = (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) ? "the '" + this.Name + "'" : "this";
                        const message = `${provider.name} would like to configure IntelliSense for ${folderStr} folder.`;
                        const allow = "Allow";
                        const dontAllow = "Don't Allow";
                        const askLater = "Ask Me Later";
                        return vscode.window.showInformationMessage(message, allow, dontAllow, askLater).then(result => {
                            switch (result) {
                                case allow: {
                                    this.configuration.updateCustomConfigurationProvider(provider.extensionId).then(() => {
                                        telemetry.logLanguageServerEvent("customConfigurationProvider", { "providerId": provider.extensionId });
                                    });
                                    ask.Value = false;
                                    return true;
                                }
                                case dontAllow: {
                                    ask.Value = false;
                                    break;
                                }
                                default: {
                                    break;
                                }
                            }
                            return false;
                        });
                    }, () => ask.Value = false);
                }
            }
            else if (selectedProvider === provider.extensionId) {
                telemetry.logLanguageServerEvent("customConfigurationProvider", { "providerId": provider.extensionId });
            }
            else if (selectedProvider === provider.name) {
                this.configuration.updateCustomConfigurationProvider(provider.extensionId);
            }
        });
    }
    updateCustomConfigurations(requestingProvider) {
        return this.notifyWhenReady(() => {
            if (!this.configurationProvider) {
                return;
            }
            let currentProvider = customProviders_1.getCustomConfigProviders().get(this.configurationProvider);
            if (!currentProvider || (requestingProvider && requestingProvider.extensionId !== currentProvider.extensionId) || this.trackedDocuments.size === 0) {
                return;
            }
            let tokenSource = new vscode_1.CancellationTokenSource();
            let documentUris = [];
            this.trackedDocuments.forEach(document => documentUris.push(document.uri));
            let task = () => {
                return currentProvider.provideConfigurations(documentUris, tokenSource.token);
            };
            this.queueTaskWithTimeout(task, configProviderTimeout, tokenSource).then(configs => this.sendCustomConfigurations(configs));
        });
    }
    provideCustomConfiguration(document) {
        return __awaiter(this, void 0, void 0, function* () {
            let tokenSource = new vscode_1.CancellationTokenSource();
            let providers = customProviders_1.getCustomConfigProviders();
            if (providers.size === 0) {
                return Promise.resolve();
            }
            let providerId = yield this.getCustomConfigurationProviderId();
            if (!providerId) {
                return Promise.resolve();
            }
            let providerName = providerId;
            let configName = yield this.getCurrentConfigName();
            let provideConfigurationAsync = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    let provider = providers.get(providerId);
                    if (provider) {
                        providerName = provider.name;
                        if (yield provider.canProvideConfiguration(document.uri, tokenSource.token)) {
                            return provider.provideConfigurations([document.uri], tokenSource.token);
                        }
                    }
                }
                catch (err) {
                }
                return Promise.reject("");
            });
            return this.queueTaskWithTimeout(provideConfigurationAsync, configProviderTimeout, tokenSource).then((configs) => {
                if (configs && configs.length > 0) {
                    this.sendCustomConfigurations(configs);
                }
            }, () => {
                let settings = new settings_1.CppSettings(this.RootUri);
                if (settings.configurationWarnings === "Enabled" && !this.isExternalHeader(document) && !vscode.debug.activeDebugSession) {
                    const dismiss = "Dismiss";
                    const disable = "Disable Warnings";
                    vscode.window.showInformationMessage(`'${providerName}' is unable to provide IntelliSense configuration information for '${document.uri.fsPath}'. ` +
                        `Settings from the '${configName}' configuration will be used instead.`, dismiss, disable).then(response => {
                        switch (response) {
                            case disable: {
                                settings.toggleSetting("configurationWarnings", "Enabled", "Disabled");
                                break;
                            }
                        }
                    });
                }
            });
        });
    }
    isExternalHeader(document) {
        return util.isHeader(document) && !document.uri.toString().startsWith(this.RootUri.toString());
    }
    getCustomConfigurationProviderId() {
        return this.queueTask(() => Promise.resolve(this.configuration.CurrentConfiguration.configurationProvider));
    }
    getCurrentConfigName() {
        return this.queueTask(() => Promise.resolve(this.configuration.CurrentConfiguration.name));
    }
    takeOwnership(document) {
        let params = {
            textDocument: {
                uri: document.uri.toString(),
                languageId: document.languageId,
                version: document.version,
                text: document.getText()
            }
        };
        this.notifyWhenReady(() => this.languageClient.sendNotification(DidOpenNotification, params));
        this.trackedDocuments.add(document);
    }
    queueTask(task) {
        if (this.isSupported) {
            this.pendingRequests++;
            let nextTask = () => {
                let result = task();
                this.pendingRequests--;
                if (this.pendingRequests === 0) {
                    this.pendingTask = null;
                }
                return result;
            };
            if (this.pendingTask) {
                return this.pendingTask.then(nextTask, nextTask);
            }
            else {
                this.pendingTask = nextTask();
                return this.pendingTask;
            }
        }
        else {
            return Promise.reject("Unsupported client");
        }
    }
    queueTaskWithTimeout(task, ms, cancelToken) {
        let timer;
        let timeout = () => new Promise((resolve, reject) => {
            timer = setTimeout(() => {
                clearTimeout(timer);
                if (cancelToken) {
                    cancelToken.cancel();
                }
                reject("Timed out in " + ms + "ms.");
            }, ms);
        });
        return this.queueTask(() => {
            return Promise.race([task(), timeout()]).then((result) => {
                clearTimeout(timer);
                return result;
            }, (error) => {
                throw error;
            });
        });
    }
    requestWhenReady(request) {
        return this.queueTask(request);
    }
    notifyWhenReady(notify) {
        return this.queueTask(() => new Promise(resolve => {
            notify();
            resolve();
        }));
    }
    registerNotifications() {
        console.assert(this.languageClient !== undefined, "This method must not be called until this.languageClient is set in \"onReady\"");
        this.languageClient.onNotification(ReloadWindowNotification, () => util.promptForReloadWindowDueToSettingsChange());
        this.languageClient.onNotification(LogTelemetryNotification, (e) => this.logTelemetry(e));
        this.languageClient.onNotification(ReportNavigationNotification, (e) => this.navigate(e));
        this.languageClient.onNotification(ReportStatusNotification, (e) => this.updateStatus(e));
        this.languageClient.onNotification(ReportTagParseStatusNotification, (e) => this.updateTagParseStatus(e));
        this.languageClient.onNotification(InactiveRegionNotification, (e) => this.updateInactiveRegions(e));
        this.languageClient.onNotification(CompileCommandsPathsNotification, (e) => this.promptCompileCommands(e));
        this.setupOutputHandlers();
    }
    registerFileWatcher() {
        console.assert(this.languageClient !== undefined, "This method must not be called until this.languageClient is set in \"onReady\"");
        if (this.rootFolder) {
            this.rootPathFileWatcher = vscode.workspace.createFileSystemWatcher("**/*", false, true, false);
            this.rootPathFileWatcher.onDidCreate((uri) => {
                this.languageClient.sendNotification(FileCreatedNotification, { uri: uri.toString() });
            });
            this.rootPathFileWatcher.onDidDelete((uri) => {
                this.languageClient.sendNotification(FileDeletedNotification, { uri: uri.toString() });
            });
            this.disposables.push(this.rootPathFileWatcher);
        }
        else {
            this.rootPathFileWatcher = undefined;
        }
    }
    setupOutputHandlers() {
        console.assert(this.languageClient !== undefined, "This method must not be called until this.languageClient is set in \"onReady\"");
        this.languageClient.onNotification(DebugProtocolNotification, (output) => {
            if (!this.debugChannel) {
                this.debugChannel = vscode.window.createOutputChannel(`C/C++ Debug Protocol: ${this.Name}`);
                this.disposables.push(this.debugChannel);
            }
            this.debugChannel.appendLine("");
            this.debugChannel.appendLine("************************************************************************************************************************");
            this.debugChannel.append(`${output}`);
        });
        this.languageClient.onNotification(DebugLogNotification, (output) => {
            if (!this.outputChannel) {
                if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
                    this.outputChannel = vscode.window.createOutputChannel(`C/C++: ${this.Name}`);
                }
                else {
                    this.outputChannel = logger.getOutputChannel();
                }
                this.disposables.push(this.outputChannel);
            }
            this.outputChannel.appendLine(`${output}`);
        });
    }
    logTelemetry(notificationBody) {
        telemetry.logLanguageServerEvent(notificationBody.event, notificationBody.properties, notificationBody.metrics);
    }
    navigate(payload) {
        let cppSettings = new settings_1.CppSettings(this.RootUri);
        if (cppSettings.autoAddFileAssociations && payload.navigation.startsWith("<def")) {
            this.addFileAssociations(payload.navigation.substr(4));
            return;
        }
        let currentNavigation = payload.navigation;
        let maxLength = cppSettings.navigationLength;
        if (currentNavigation.length > maxLength) {
            currentNavigation = currentNavigation.substring(0, maxLength - 3).concat("...");
        }
        this.model.navigationLocation.Value = currentNavigation;
    }
    addFileAssociations(fileAssociations) {
        let settings = new settings_1.OtherSettings(this.RootUri);
        let assocs = settings.filesAssociations;
        let is_c = fileAssociations.startsWith("c");
        fileAssociations = fileAssociations.substr(is_c ? 3 : 2);
        let filesAndPaths = fileAssociations.split(";");
        let foundNewAssociation = false;
        for (let i = 0; i < filesAndPaths.length - 1; ++i) {
            let fileAndPath = filesAndPaths[i].split("@");
            let file = fileAndPath[0];
            let filePath = fileAndPath[1];
            if ((file in assocs) || (("**/" + file) in assocs)) {
                continue;
            }
            let j = file.lastIndexOf('.');
            if (j !== -1) {
                let ext = file.substr(j);
                if ((("*" + ext) in assocs) || (("**/*" + ext) in assocs)) {
                    continue;
                }
            }
            let foundGlobMatch = false;
            for (let assoc in assocs) {
                if (minimatch(filePath, assoc)) {
                    foundGlobMatch = true;
                    break;
                }
            }
            if (foundGlobMatch) {
                continue;
            }
            assocs[file] = is_c ? "c" : "cpp";
            foundNewAssociation = true;
        }
        if (foundNewAssociation) {
            settings.filesAssociations = assocs;
        }
    }
    updateStatus(notificationBody) {
        let message = notificationBody.status;
        util.setProgress(util.getProgressExecutableSuccess());
        let testHook = testHook_1.getTestHook();
        if (message.endsWith("Indexing...")) {
            this.model.isTagParsing.Value = true;
            testHook.updateStatus(testApi_1.Status.TagParsingBegun);
        }
        else if (message.endsWith("Updating IntelliSense...")) {
            this.model.isUpdatingIntelliSense.Value = true;
            testHook.updateStatus(testApi_1.Status.IntelliSenseCompiling);
        }
        else if (message.endsWith("IntelliSense Ready")) {
            this.model.isUpdatingIntelliSense.Value = false;
            testHook.updateStatus(testApi_1.Status.IntelliSenseReady);
        }
        else if (message.endsWith("Ready")) {
            this.model.isTagParsing.Value = false;
            testHook.updateStatus(testApi_1.Status.TagParsingDone);
            util.setProgress(util.getProgressParseRootSuccess());
        }
        else if (message.endsWith("No Squiggles")) {
            util.setIntelliSenseProgress(util.getProgressIntelliSenseNoSquiggles());
        }
        else if (message.endsWith("IntelliSense Fallback")) {
            let showIntelliSenseFallbackMessage = new persistentState_1.PersistentState("CPP.showIntelliSenseFallbackMessage", true);
            if (showIntelliSenseFallbackMessage.Value) {
                ui.showConfigureIncludePathMessage(() => {
                    let learnMorePanel = "Configuration Help";
                    let dontShowAgain = "Don't Show Again";
                    let fallbackMsg = this.configuration.VcpkgInstalled ?
                        "Update your IntelliSense settings or use Vcpkg to install libraries to help find missing headers." :
                        "Configure your IntelliSense settings to help find missing headers.";
                    return vscode.window.showInformationMessage(fallbackMsg, learnMorePanel, dontShowAgain).then((value) => {
                        switch (value) {
                            case learnMorePanel:
                                let uri = vscode.Uri.parse(`https://go.microsoft.com/fwlink/?linkid=864631`);
                                vscode.commands.executeCommand('vscode.open', uri);
                                vscode.commands.getCommands(true).then((commands) => {
                                    if (commands.indexOf("workbench.action.problems.focus") >= 0) {
                                        vscode.commands.executeCommand("workbench.action.problems.focus");
                                    }
                                });
                                this.handleConfigurationEditCommand();
                                break;
                            case dontShowAgain:
                                showIntelliSenseFallbackMessage.Value = false;
                                break;
                        }
                        return true;
                    });
                }, () => showIntelliSenseFallbackMessage.Value = false);
            }
        }
    }
    updateTagParseStatus(notificationBody) {
        this.model.tagParserStatus.Value = notificationBody.status;
    }
    updateInactiveRegions(params) {
        let settings = new settings_1.CppSettings(this.RootUri);
        let decoration = vscode.window.createTextEditorDecorationType({
            opacity: settings.inactiveRegionOpacity.toString(),
            backgroundColor: settings.inactiveRegionBackgroundColor,
            color: settings.inactiveRegionForegroundColor,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen
        });
        let ranges = [];
        params.regions.forEach(element => {
            let newRange = new vscode.Range(element.startLine, 0, element.endLine, 0);
            ranges.push(newRange);
        });
        let valuePair = this.inactiveRegionsDecorations.get(params.uri);
        if (valuePair) {
            valuePair.decoration.dispose();
            valuePair.decoration = decoration;
            valuePair.ranges = ranges;
        }
        else {
            let toInsert = {
                decoration: decoration,
                ranges: ranges
            };
            this.inactiveRegionsDecorations.set(params.uri, toInsert);
        }
        if (settings.dimInactiveRegions) {
            let editors = vscode.window.visibleTextEditors.filter(e => e.document.uri.toString() === params.uri);
            for (let e of editors) {
                e.setDecorations(decoration, ranges);
            }
        }
    }
    promptCompileCommands(params) {
        if (this.configuration.CurrentConfiguration.compileCommands !== undefined) {
            return;
        }
        let ask = new persistentState_1.PersistentState("CPP.showCompileCommandsSelection", true);
        if (!ask.Value) {
            return;
        }
        let compileCommandStr = params.paths.length > 1 ? "a compile_commands.json file" : params.paths[0];
        let folderStr = (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) ? "the '" + this.Name + "'" : "this";
        const message = `Would you like to use ${compileCommandStr} to auto-configure IntelliSense for ${folderStr} folder?`;
        ui.showConfigureCompileCommandsMessage(() => {
            const yes = "Yes";
            const no = "No";
            const askLater = "Ask Me Later";
            return vscode.window.showInformationMessage(message, yes, no, askLater).then((value) => __awaiter(this, void 0, void 0, function* () {
                switch (value) {
                    case yes:
                        if (params.paths.length > 1) {
                            let index = yield ui.showCompileCommands(params.paths);
                            if (index < 0) {
                                return false;
                            }
                            this.configuration.setCompileCommands(params.paths[index]);
                        }
                        else {
                            this.configuration.setCompileCommands(params.paths[0]);
                        }
                        return true;
                    case askLater:
                        break;
                    case no:
                        ask.Value = false;
                        break;
                }
                return false;
            }));
        }, () => ask.Value = false);
    }
    requestGoToDeclaration() {
        return this.requestWhenReady(() => this.languageClient.sendRequest(GoToDeclarationRequest, null));
    }
    requestSwitchHeaderSource(rootPath, fileName) {
        let params = {
            rootPath: rootPath,
            switchHeaderSourceFileName: fileName
        };
        return this.requestWhenReady(() => this.languageClient.sendRequest(SwitchHeaderSourceRequest, params));
    }
    requestNavigationList(document) {
        return this.requestWhenReady(() => {
            return this.languageClient.sendRequest(NavigationListRequest, this.languageClient.code2ProtocolConverter.asTextDocumentIdentifier(document));
        });
    }
    activeDocumentChanged(document) {
        this.notifyWhenReady(() => {
            this.languageClient.sendNotification(ActiveDocumentChangeNotification, this.languageClient.code2ProtocolConverter.asTextDocumentIdentifier(document));
        });
    }
    activate() {
        for (let key in this.model) {
            if (this.model.hasOwnProperty(key)) {
                this.model[key].activate();
            }
        }
        this.resumeParsing();
    }
    selectionChanged(selection) {
        this.notifyWhenReady(() => this.languageClient.sendNotification(TextEditorSelectionChangeNotification, selection));
    }
    resetDatabase() {
        this.notifyWhenReady(() => this.languageClient.sendNotification(ResetDatabaseNotification));
    }
    deactivate() {
        for (let key in this.model) {
            if (this.model.hasOwnProperty(key)) {
                this.model[key].deactivate();
            }
        }
        this.pauseParsing();
    }
    pauseParsing() {
        this.notifyWhenReady(() => this.languageClient.sendNotification(PauseParsingNotification));
    }
    resumeParsing() {
        this.notifyWhenReady(() => this.languageClient.sendNotification(ResumeParsingNotification));
    }
    onConfigurationsChanged(configurations) {
        let params = {
            configurations: configurations,
            currentConfiguration: this.configuration.CurrentConfigurationIndex
        };
        this.notifyWhenReady(() => {
            this.languageClient.sendNotification(ChangeFolderSettingsNotification, params);
            this.model.activeConfigName.Value = configurations[params.currentConfiguration].name;
        }).then(() => {
            let newProvider = this.configuration.CurrentConfigurationProvider;
            if (this.configurationProvider !== newProvider) {
                this.configurationProvider = newProvider;
                this.updateCustomConfigurations();
            }
        });
    }
    onSelectedConfigurationChanged(index) {
        let params = {
            currentConfiguration: index
        };
        this.notifyWhenReady(() => {
            this.languageClient.sendNotification(ChangeSelectedSettingNotification, params);
            this.model.activeConfigName.Value = this.configuration.ConfigurationNames[index];
        });
    }
    onCompileCommandsChanged(path) {
        let params = {
            uri: path
        };
        this.notifyWhenReady(() => this.languageClient.sendNotification(ChangeCompileCommandsNotification, params));
    }
    sendCustomConfigurations(configs) {
        if (!configs || !(configs instanceof Array)) {
            return;
        }
        let sanitized = configs;
        sanitized = sanitized.filter(item => {
            if (item && item.uri && item.configuration &&
                item.configuration.includePath && item.configuration.defines && item.configuration.intelliSenseMode && item.configuration.standard) {
                return true;
            }
            console.warn("discarding invalid SourceFileConfigurationItem: " + item);
            return false;
        });
        if (sanitized.length === 0) {
            return;
        }
        let params = {
            configurationItems: sanitized
        };
        this.notifyWhenReady(() => this.languageClient.sendNotification(CustomConfigurationNotification, params));
    }
    clearCustomConfigurations() {
        this.notifyWhenReady(() => this.languageClient.sendNotification(ClearCustomConfigurationsNotification));
    }
    handleConfigurationSelectCommand() {
        this.notifyWhenReady(() => {
            ui.showConfigurations(this.configuration.ConfigurationNames)
                .then((index) => {
                if (index < 0) {
                    return;
                }
                this.configuration.select(index);
            });
        });
    }
    handleConfigurationProviderSelectCommand() {
        this.notifyWhenReady(() => {
            ui.showConfigurationProviders(this.configuration.CurrentConfigurationProvider)
                .then(extensionId => {
                if (extensionId === undefined) {
                    return;
                }
                this.configuration.updateCustomConfigurationProvider(extensionId)
                    .then(() => {
                    if (extensionId) {
                        this.updateCustomConfigurations(customProviders_1.getCustomConfigProviders().get(extensionId));
                        telemetry.logLanguageServerEvent("customConfigurationProvider", { "providerId": extensionId });
                    }
                    else {
                        this.clearCustomConfigurations();
                    }
                });
            });
        });
    }
    handleShowParsingCommands() {
        this.notifyWhenReady(() => {
            ui.showParsingCommands()
                .then((index) => {
                if (index === 0) {
                    this.pauseParsing();
                }
                else if (index === 1) {
                    this.resumeParsing();
                }
            });
        });
    }
    handleConfigurationEditCommand() {
        this.notifyWhenReady(() => this.configuration.handleConfigurationEditCommand(vscode.window.showTextDocument));
    }
    handleAddToIncludePathCommand(path) {
        this.notifyWhenReady(() => this.configuration.addToIncludePathCommand(path));
    }
    onInterval() {
        if (this.languageClient !== undefined && this.configuration !== undefined) {
            this.languageClient.sendNotification(IntervalTimerNotification);
            this.configuration.checkCppProperties();
        }
    }
    dispose() {
        let promise = (this.languageClient) ? this.languageClient.stop() : Promise.resolve();
        return promise.then(() => {
            this.disposables.forEach((d) => d.dispose());
            this.disposables = [];
            for (let key in this.model) {
                if (this.model.hasOwnProperty(key)) {
                    this.model[key].dispose();
                }
            }
        });
    }
}
function getLanguageServerFileName() {
    let extensionProcessName = 'Microsoft.VSCode.CPP.Extension';
    let plat = process.platform;
    if (plat === 'linux') {
        extensionProcessName += '.linux';
    }
    else if (plat === 'darwin') {
        extensionProcessName += '.darwin';
    }
    else if (plat === 'win32') {
        extensionProcessName += '.exe';
    }
    else {
        throw "Invalid Platform";
    }
    return path.resolve(util.getExtensionFilePath("bin"), extensionProcessName);
}
class NullClient {
    constructor() {
        this.booleanEvent = new vscode.EventEmitter();
        this.stringEvent = new vscode.EventEmitter();
        this.RootPath = "/";
        this.RootUri = vscode.Uri.file("/");
        this.Name = "(empty)";
        this.TrackedDocuments = new Set();
    }
    get TagParsingChanged() { return this.booleanEvent.event; }
    get IntelliSenseParsingChanged() { return this.booleanEvent.event; }
    get NavigationLocationChanged() { return this.stringEvent.event; }
    get TagParserStatusChanged() { return this.stringEvent.event; }
    get ActiveConfigChanged() { return this.stringEvent.event; }
    onDidChangeSettings() { }
    onDidChangeVisibleTextEditors(editors) { }
    onRegisterCustomConfigurationProvider(provider) { return Promise.resolve(); }
    updateCustomConfigurations(requestingProvider) { return Promise.resolve(); }
    provideCustomConfiguration(document) { return Promise.resolve(); }
    getCustomConfigurationProviderId() { return Promise.resolve(undefined); }
    getCurrentConfigName() { return Promise.resolve(""); }
    takeOwnership(document) { }
    queueTask(task) { return task(); }
    queueTaskWithTimeout(task, ms, tokenSource) { return task(); }
    requestWhenReady(request) { return; }
    notifyWhenReady(notify) { }
    sendCustomConfigurations(configs) { }
    requestGoToDeclaration() { return Promise.resolve(); }
    requestSwitchHeaderSource(rootPath, fileName) { return Promise.resolve(""); }
    requestNavigationList(document) { return Promise.resolve(""); }
    activeDocumentChanged(document) { }
    activate() { }
    selectionChanged(selection) { }
    resetDatabase() { }
    deactivate() { }
    pauseParsing() { }
    resumeParsing() { }
    handleConfigurationSelectCommand() { }
    handleConfigurationProviderSelectCommand() { }
    handleShowParsingCommands() { }
    handleConfigurationEditCommand() { }
    handleAddToIncludePathCommand(path) { }
    onInterval() { }
    dispose() {
        this.booleanEvent.dispose();
        this.stringEvent.dispose();
        return Promise.resolve();
    }
}
//# sourceMappingURL=client.js.map