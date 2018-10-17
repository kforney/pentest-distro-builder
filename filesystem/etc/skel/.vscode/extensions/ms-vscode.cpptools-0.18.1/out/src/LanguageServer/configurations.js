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
const fs = require("fs");
const vscode = require("vscode");
const util = require("../common");
const telemetry = require("../telemetry");
const persistentState_1 = require("./persistentState");
const settings_1 = require("./settings");
const abTesting_1 = require("../abTesting");
const customProviders_1 = require("./customProviders");
const configVersion = 4;
function getDefaultConfig() {
    if (process.platform === 'darwin') {
        return { name: "Mac" };
    }
    else if (process.platform === 'win32') {
        return { name: "Win32" };
    }
    else {
        return { name: "Linux" };
    }
}
function getDefaultCppProperties() {
    return {
        configurations: [getDefaultConfig()],
        version: configVersion
    };
}
class CppProperties {
    constructor(rootUri) {
        this.propertiesFile = null;
        this.configurationJson = null;
        this.configFileWatcher = null;
        this.configFileWatcherFallbackTime = new Date();
        this.compileCommandFileWatchers = [];
        this.defaultCompilerPath = null;
        this.defaultCStandard = null;
        this.defaultCppStandard = null;
        this.defaultIncludes = null;
        this.defaultFrameworks = null;
        this.defaultWindowsSdkVersion = null;
        this.vcpkgIncludes = [];
        this.vcpkgPathReady = false;
        this.defaultIntelliSenseMode = null;
        this.configurationGlobPattern = "c_cpp_properties.json";
        this.disposables = [];
        this.configurationsChanged = new vscode.EventEmitter();
        this.selectionChanged = new vscode.EventEmitter();
        this.compileCommandsChanged = new vscode.EventEmitter();
        this.configurationIncomplete = true;
        console.assert(rootUri !== undefined);
        this.rootUri = rootUri;
        let rootPath = rootUri ? rootUri.fsPath : "";
        this.currentConfigurationIndex = new persistentState_1.PersistentFolderState("CppProperties.currentConfigurationIndex", -1, rootPath);
        this.configFolder = path.join(rootPath, ".vscode");
        let configFilePath = path.join(this.configFolder, "c_cpp_properties.json");
        if (fs.existsSync(configFilePath)) {
            this.propertiesFile = vscode.Uri.file(configFilePath);
            this.parsePropertiesFile();
        }
        if (!this.configurationJson) {
            this.resetToDefaultSettings(this.CurrentConfigurationIndex === -1);
        }
        this.configFileWatcher = vscode.workspace.createFileSystemWatcher(path.join(this.configFolder, this.configurationGlobPattern));
        this.disposables.push(this.configFileWatcher);
        this.configFileWatcher.onDidCreate((uri) => {
            this.propertiesFile = uri;
            this.handleConfigurationChange();
        });
        this.configFileWatcher.onDidDelete(() => {
            this.propertiesFile = null;
            this.resetToDefaultSettings(true);
            this.handleConfigurationChange();
        });
        this.configFileWatcher.onDidChange(() => {
            this.handleConfigurationChange();
        });
        this.buildVcpkgIncludePath();
        this.disposables.push(vscode.Disposable.from(this.configurationsChanged, this.selectionChanged, this.compileCommandsChanged));
    }
    get ConfigurationsChanged() { return this.configurationsChanged.event; }
    get SelectionChanged() { return this.selectionChanged.event; }
    get CompileCommandsChanged() { return this.compileCommandsChanged.event; }
    get Configurations() { return this.configurationJson.configurations; }
    get CurrentConfigurationIndex() { return this.currentConfigurationIndex.Value; }
    get CurrentConfiguration() { return this.Configurations[this.CurrentConfigurationIndex]; }
    get CurrentConfigurationProvider() {
        if (this.CurrentConfiguration.configurationProvider) {
            return this.CurrentConfiguration.configurationProvider;
        }
        return new settings_1.CppSettings(this.rootUri).defaultConfigurationProvider;
    }
    get ConfigurationNames() {
        let result = [];
        this.configurationJson.configurations.forEach((config) => result.push(config.name));
        return result;
    }
    set CompilerDefaults(compilerDefaults) {
        this.defaultCompilerPath = compilerDefaults.compilerPath;
        this.defaultCStandard = compilerDefaults.cStandard;
        this.defaultCppStandard = compilerDefaults.cppStandard;
        this.defaultIncludes = compilerDefaults.includes;
        this.defaultFrameworks = compilerDefaults.frameworks;
        this.defaultWindowsSdkVersion = compilerDefaults.windowsSdkVersion;
        this.defaultIntelliSenseMode = compilerDefaults.intelliSenseMode;
        this.handleConfigurationChange();
    }
    get VcpkgInstalled() {
        return this.vcpkgIncludes.length > 0;
    }
    onConfigurationsChanged() {
        this.configurationsChanged.fire(this.Configurations);
    }
    onSelectionChanged() {
        this.selectionChanged.fire(this.CurrentConfigurationIndex);
    }
    onCompileCommandsChanged(path) {
        this.compileCommandsChanged.fire(path);
    }
    onDidChangeSettings() {
        if (!this.propertiesFile) {
            this.resetToDefaultSettings(true);
            this.handleConfigurationChange();
        }
        else if (!this.configurationIncomplete) {
            this.handleConfigurationChange();
        }
    }
    resetToDefaultSettings(resetIndex) {
        this.configurationJson = getDefaultCppProperties();
        if (resetIndex || this.CurrentConfigurationIndex < 0 ||
            this.CurrentConfigurationIndex >= this.configurationJson.configurations.length) {
            this.currentConfigurationIndex.Value = this.getConfigIndexForPlatform(this.configurationJson);
        }
        this.configurationIncomplete = true;
    }
    applyDefaultIncludePathsAndFrameworks() {
        if (this.configurationIncomplete && this.defaultIncludes && this.defaultFrameworks && this.vcpkgPathReady) {
            let configuration = this.CurrentConfiguration;
            let settings = new settings_1.CppSettings(this.rootUri);
            if (!settings.defaultIncludePath) {
                let abTestSettings = abTesting_1.getABTestSettings();
                let rootFolder = abTestSettings.UseRecursiveIncludes ? "${workspaceFolder}/**" : "${workspaceFolder}";
                configuration.includePath = [rootFolder].concat(this.vcpkgIncludes);
            }
            if (!settings.defaultDefines) {
                configuration.defines = (process.platform === 'win32') ? ["_DEBUG", "UNICODE", "_UNICODE"] : [];
            }
            if (!settings.defaultMacFrameworkPath && process.platform === 'darwin') {
                configuration.macFrameworkPath = this.defaultFrameworks;
            }
            if (!settings.defaultWindowsSdkVersion && this.defaultWindowsSdkVersion && process.platform === 'win32') {
                configuration.windowsSdkVersion = this.defaultWindowsSdkVersion;
            }
            if (!settings.defaultCompilerPath && this.defaultCompilerPath) {
                configuration.compilerPath = this.defaultCompilerPath;
            }
            if (!settings.defaultCStandard && this.defaultCStandard) {
                configuration.cStandard = this.defaultCStandard;
            }
            if (!settings.defaultCppStandard && this.defaultCppStandard) {
                configuration.cppStandard = this.defaultCppStandard;
            }
            if (!settings.defaultIntelliSenseMode) {
                configuration.intelliSenseMode = this.defaultIntelliSenseMode;
            }
            this.configurationIncomplete = false;
        }
    }
    buildVcpkgIncludePath() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let vcpkgRoot = util.getVcpkgRoot();
                if (vcpkgRoot) {
                    let list = yield util.readDir(vcpkgRoot);
                    if (list !== undefined) {
                        list.forEach((entry) => {
                            if (entry !== "vcpkg") {
                                let pathToCheck = path.join(vcpkgRoot, entry);
                                if (fs.existsSync(pathToCheck)) {
                                    let p = path.join(pathToCheck, "include");
                                    if (fs.existsSync(p)) {
                                        p = p.replace(/\\/g, "/");
                                        p = p.replace(vcpkgRoot, "${vcpkgRoot}");
                                        this.vcpkgIncludes.push(p);
                                    }
                                }
                            }
                        });
                    }
                }
            }
            catch (error) { }
            finally {
                this.vcpkgPathReady = true;
                this.handleConfigurationChange();
            }
        });
    }
    getConfigIndexForPlatform(config) {
        let plat;
        if (process.platform === 'darwin') {
            plat = "Mac";
        }
        else if (process.platform === 'win32') {
            plat = "Win32";
        }
        else {
            plat = "Linux";
        }
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            if (config.configurations[i].name === plat) {
                return i;
            }
        }
        return this.configurationJson.configurations.length - 1;
    }
    getIntelliSenseModeForPlatform(name) {
        if (name === "Linux") {
            return "gcc-x64";
        }
        else if (name === "Mac") {
            return "clang-x64";
        }
        else if (name === "Win32") {
            return "msvc-x64";
        }
        else if (process.platform === 'win32') {
            return "msvc-x64";
        }
        else if (process.platform === 'darwin') {
            return "clang-x64";
        }
        else {
            return "gcc-x64";
        }
    }
    addToIncludePathCommand(path) {
        this.handleConfigurationEditCommand((document) => {
            telemetry.logLanguageServerEvent("addToIncludePath");
            this.parsePropertiesFile();
            let config = this.CurrentConfiguration;
            if (config.includePath === undefined) {
                config.includePath = ["${default}"];
            }
            config.includePath.splice(config.includePath.length, 0, path);
            fs.writeFileSync(this.propertiesFile.fsPath, JSON.stringify(this.configurationJson, null, 4));
            this.handleConfigurationChange();
        });
    }
    updateCustomConfigurationProvider(providerId) {
        return new Promise((resolve) => {
            if (this.propertiesFile) {
                this.handleConfigurationEditCommand((document) => {
                    this.parsePropertiesFile();
                    let config = this.CurrentConfiguration;
                    if (providerId) {
                        config.configurationProvider = providerId;
                    }
                    else {
                        delete config.configurationProvider;
                    }
                    fs.writeFileSync(this.propertiesFile.fsPath, JSON.stringify(this.configurationJson, null, 4));
                    this.handleConfigurationChange();
                    resolve();
                });
            }
            else {
                let settings = new settings_1.CppSettings(this.rootUri);
                if (providerId) {
                    settings.update("default.configurationProvider", providerId);
                }
                else {
                    settings.update("default.configurationProvider", undefined);
                }
                this.CurrentConfiguration.configurationProvider = providerId;
                resolve();
            }
        });
    }
    setCompileCommands(path) {
        this.handleConfigurationEditCommand((document) => {
            this.parsePropertiesFile();
            let config = this.CurrentConfiguration;
            config.compileCommands = path;
            fs.writeFileSync(this.propertiesFile.fsPath, JSON.stringify(this.configurationJson, null, 4));
            this.handleConfigurationChange();
        });
    }
    select(index) {
        if (index === this.configurationJson.configurations.length) {
            this.handleConfigurationEditCommand(vscode.window.showTextDocument);
            return;
        }
        this.currentConfigurationIndex.Value = index;
        this.onSelectionChanged();
    }
    resolveDefaults(entries, defaultValue) {
        let result = [];
        entries.forEach(entry => {
            if (entry === "${default}") {
                if (defaultValue !== null) {
                    result = result.concat(defaultValue);
                }
            }
            else {
                result.push(entry);
            }
        });
        return result;
    }
    resolveAndSplit(paths, defaultValue) {
        let result = [];
        if (paths) {
            paths.forEach(entry => {
                let entries = util.resolveVariables(entry, this.configurationJson.env).split(";").filter(e => e);
                entries = this.resolveDefaults(entries, defaultValue);
                result = result.concat(entries);
            });
        }
        return result;
    }
    resolveVariables(input, defaultValue) {
        if (input === undefined || input === "${default}") {
            input = defaultValue;
        }
        if (typeof input === "boolean") {
            return input;
        }
        return util.resolveVariables(input, this.configurationJson.env);
    }
    updateConfiguration(property, defaultValue) {
        if (typeof property === "string" || typeof defaultValue === "string") {
            return this.resolveVariables(property, defaultValue);
        }
        else if (typeof property === "boolean" || typeof defaultValue === "boolean") {
            return this.resolveVariables(property, defaultValue);
        }
        else if (property instanceof Array || defaultValue instanceof Array) {
            if (property) {
                return this.resolveAndSplit(property, defaultValue);
            }
            else if (property === undefined && defaultValue) {
                return this.resolveAndSplit(defaultValue, []);
            }
        }
        return property;
    }
    updateServerOnFolderSettingsChange() {
        let settings = new settings_1.CppSettings(this.rootUri);
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            let configuration = this.configurationJson.configurations[i];
            configuration.includePath = this.updateConfiguration(configuration.includePath, settings.defaultIncludePath);
            configuration.defines = this.updateConfiguration(configuration.defines, settings.defaultDefines);
            configuration.macFrameworkPath = this.updateConfiguration(configuration.macFrameworkPath, settings.defaultMacFrameworkPath);
            configuration.windowsSdkVersion = this.updateConfiguration(configuration.windowsSdkVersion, settings.defaultWindowsSdkVersion);
            configuration.forcedInclude = this.updateConfiguration(configuration.forcedInclude, settings.defaultForcedInclude);
            configuration.compileCommands = this.updateConfiguration(configuration.compileCommands, settings.defaultCompileCommands);
            configuration.compilerPath = this.updateConfiguration(configuration.compilerPath, settings.defaultCompilerPath);
            configuration.cStandard = this.updateConfiguration(configuration.cStandard, settings.defaultCStandard);
            configuration.cppStandard = this.updateConfiguration(configuration.cppStandard, settings.defaultCppStandard);
            configuration.intelliSenseMode = this.updateConfiguration(configuration.intelliSenseMode, settings.defaultIntelliSenseMode);
            configuration.configurationProvider = this.updateConfiguration(configuration.configurationProvider, settings.defaultConfigurationProvider);
            if (!configuration.browse) {
                configuration.browse = {};
            }
            if (!configuration.browse.path) {
                if (settings.defaultBrowsePath) {
                    configuration.browse.path = settings.defaultBrowsePath;
                }
                else if (configuration.includePath) {
                    configuration.browse.path = configuration.includePath.slice(0);
                    if (-1 === configuration.includePath.findIndex((value, index) => {
                        return !!value.match(/^\$\{(workspaceRoot|workspaceFolder)\}(\\|\\\*\*|\/|\/\*\*)?$/g);
                    })) {
                        configuration.browse.path.push("${workspaceFolder}");
                    }
                }
            }
            else {
                configuration.browse.path = this.updateConfiguration(configuration.browse.path, settings.defaultBrowsePath);
            }
            configuration.browse.limitSymbolsToIncludedHeaders = this.updateConfiguration(configuration.browse.limitSymbolsToIncludedHeaders, settings.defaultLimitSymbolsToIncludedHeaders);
            configuration.browse.databaseFilename = this.updateConfiguration(configuration.browse.databaseFilename, settings.defaultDatabaseFilename);
        }
        this.updateCompileCommandsFileWatchers();
        if (!this.configurationIncomplete) {
            this.onConfigurationsChanged();
        }
    }
    updateCompileCommandsFileWatchers() {
        this.compileCommandFileWatchers.forEach((watcher) => watcher.close());
        this.compileCommandFileWatchers = [];
        let filePaths = new Set();
        this.configurationJson.configurations.forEach(c => {
            if (c.compileCommands !== undefined && fs.existsSync(c.compileCommands)) {
                filePaths.add(c.compileCommands);
            }
        });
        try {
            filePaths.forEach((path) => {
                this.compileCommandFileWatchers.push(fs.watch(path, (event, filename) => {
                    if (event !== "rename") {
                        this.onCompileCommandsChanged(path);
                    }
                }));
            });
        }
        catch (e) {
        }
    }
    handleConfigurationEditCommand(onSuccess) {
        if (this.propertiesFile && fs.existsSync(this.propertiesFile.fsPath)) {
            vscode.workspace.openTextDocument(this.propertiesFile).then((document) => {
                onSuccess(document);
            });
        }
        else {
            fs.mkdir(this.configFolder, (e) => {
                if (!e || e.code === 'EEXIST') {
                    let fullPathToFile = path.join(this.configFolder, "c_cpp_properties.json");
                    let filePath = vscode.Uri.file(fullPathToFile).with({ scheme: "untitled" });
                    vscode.workspace.openTextDocument(filePath).then((document) => {
                        let edit = new vscode.WorkspaceEdit();
                        if (this.configurationJson) {
                            this.resetToDefaultSettings(true);
                        }
                        this.applyDefaultIncludePathsAndFrameworks();
                        let settings = new settings_1.CppSettings(this.rootUri);
                        if (settings.defaultConfigurationProvider) {
                            this.configurationJson.configurations.forEach(config => {
                                config.configurationProvider = settings.defaultConfigurationProvider;
                            });
                            settings.update("default.configurationProvider", undefined);
                        }
                        edit.insert(document.uri, new vscode.Position(0, 0), JSON.stringify(this.configurationJson, null, 4));
                        vscode.workspace.applyEdit(edit).then((status) => {
                            document.save().then(() => {
                                this.propertiesFile = vscode.Uri.file(path.join(this.configFolder, "c_cpp_properties.json"));
                                vscode.workspace.openTextDocument(this.propertiesFile).then((document) => {
                                    onSuccess(document);
                                });
                            });
                        });
                    });
                }
            });
        }
    }
    handleConfigurationChange() {
        this.configFileWatcherFallbackTime = new Date();
        if (this.propertiesFile) {
            this.parsePropertiesFile();
            if (this.configurationJson !== undefined) {
                if (this.CurrentConfigurationIndex < 0 ||
                    this.CurrentConfigurationIndex >= this.configurationJson.configurations.length) {
                    this.currentConfigurationIndex.Value = this.getConfigIndexForPlatform(this.configurationJson);
                }
            }
        }
        if (this.configurationJson === undefined) {
            this.resetToDefaultSettings(true);
        }
        this.applyDefaultIncludePathsAndFrameworks();
        this.updateServerOnFolderSettingsChange();
    }
    parsePropertiesFile() {
        try {
            let readResults = fs.readFileSync(this.propertiesFile.fsPath, 'utf8');
            if (readResults === "") {
                return;
            }
            let newJson = JSON.parse(readResults);
            if (!newJson || !newJson.configurations || newJson.configurations.length === 0) {
                throw { message: "Invalid configuration file. There must be at least one configuration present in the array." };
            }
            if (!this.configurationIncomplete && this.configurationJson && this.configurationJson.configurations &&
                this.CurrentConfigurationIndex >= 0 && this.CurrentConfigurationIndex < this.configurationJson.configurations.length) {
                for (let i = 0; i < newJson.configurations.length; i++) {
                    if (newJson.configurations[i].name === this.configurationJson.configurations[this.CurrentConfigurationIndex].name) {
                        this.currentConfigurationIndex.Value = i;
                        break;
                    }
                }
            }
            this.configurationJson = newJson;
            if (this.CurrentConfigurationIndex < 0 || this.CurrentConfigurationIndex >= newJson.configurations.length) {
                this.currentConfigurationIndex.Value = this.getConfigIndexForPlatform(newJson);
            }
            let dirty = false;
            for (let i = 0; i < this.configurationJson.configurations.length; i++) {
                let newId = customProviders_1.getCustomConfigProviders().checkId(this.configurationJson.configurations[i].configurationProvider);
                if (newId !== this.configurationJson.configurations[i].configurationProvider) {
                    dirty = true;
                    this.configurationJson.configurations[i].configurationProvider = newId;
                }
            }
            if (this.configurationJson.env) {
                delete this.configurationJson.env['workspaceRoot'];
                delete this.configurationJson.env['workspaceFolder'];
                delete this.configurationJson.env['default'];
            }
            this.configurationIncomplete = false;
            if (this.configurationJson.version !== configVersion) {
                dirty = true;
                if (this.configurationJson.version === undefined) {
                    this.updateToVersion2();
                }
                if (this.configurationJson.version === 2) {
                    this.updateToVersion3();
                }
                if (this.configurationJson.version === 3) {
                    this.updateToVersion4();
                }
                else {
                    this.configurationJson.version = configVersion;
                    vscode.window.showErrorMessage('Unknown version number found in c_cpp_properties.json. Some features may not work as expected.');
                }
            }
            if (dirty) {
                try {
                    fs.writeFileSync(this.propertiesFile.fsPath, JSON.stringify(this.configurationJson, null, 4));
                }
                catch (err) {
                    vscode.window.showWarningMessage('Attempt to update "' + this.propertiesFile.fsPath + '" failed (do you have write access?)');
                }
            }
        }
        catch (err) {
            vscode.window.showErrorMessage('Failed to parse "' + this.propertiesFile.fsPath + '": ' + err.message);
            throw err;
        }
    }
    updateToVersion2() {
        this.configurationJson.version = 2;
    }
    updateToVersion3() {
        this.configurationJson.version = 3;
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            let config = this.configurationJson.configurations[i];
            if (config.name === "Mac" || (process.platform === 'darwin' && config.name !== "Win32" && config.name !== "Linux")) {
                if (config.macFrameworkPath === undefined) {
                    config.macFrameworkPath = [
                        "/System/Library/Frameworks",
                        "/Library/Frameworks"
                    ];
                }
            }
        }
    }
    updateToVersion4() {
        this.configurationJson.version = 4;
        let settings = new settings_1.CppSettings(this.rootUri);
        for (let i = 0; i < this.configurationJson.configurations.length; i++) {
            let config = this.configurationJson.configurations[i];
            if (config.intelliSenseMode === undefined && !settings.defaultIntelliSenseMode) {
                config.intelliSenseMode = this.getIntelliSenseModeForPlatform(config.name);
            }
            if (config.compilerPath === undefined && this.defaultCompilerPath && !config.compileCommands && !settings.defaultCompilerPath) {
                config.compilerPath = this.defaultCompilerPath;
            }
            if (!config.cStandard && this.defaultCStandard && !settings.defaultCStandard) {
                config.cStandard = this.defaultCStandard;
            }
            if (!config.cppStandard && this.defaultCppStandard && !settings.defaultCppStandard) {
                config.cppStandard = this.defaultCppStandard;
            }
        }
    }
    checkCppProperties() {
        let propertiesFile = path.join(this.configFolder, "c_cpp_properties.json");
        fs.stat(propertiesFile, (err, stats) => {
            if (err) {
                if (this.propertiesFile !== null) {
                    this.propertiesFile = null;
                    this.resetToDefaultSettings(true);
                    this.handleConfigurationChange();
                }
            }
            else if (stats.mtime > this.configFileWatcherFallbackTime) {
                if (this.propertiesFile === null) {
                    this.propertiesFile = vscode.Uri.file(propertiesFile);
                }
                this.handleConfigurationChange();
            }
        });
    }
    dispose() {
        this.disposables.forEach((d) => d.dispose());
        this.disposables = [];
        this.compileCommandFileWatchers.forEach((watcher) => watcher.close());
        this.compileCommandFileWatchers = [];
    }
}
exports.CppProperties = CppProperties;
//# sourceMappingURL=configurations.js.map