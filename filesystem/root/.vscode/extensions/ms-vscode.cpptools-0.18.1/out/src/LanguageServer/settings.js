'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function getTarget() {
    return (vscode.workspace.workspaceFolders) ? vscode.ConfigurationTarget.WorkspaceFolder : vscode.ConfigurationTarget.Global;
}
class Settings {
    constructor(section, resource) {
        this.settings = vscode.workspace.getConfiguration(section, resource ? resource : null);
    }
    get Section() { return this.settings; }
}
class CppSettings extends Settings {
    constructor(resource) {
        super("C_Cpp", resource);
    }
    get clangFormatPath() { return super.Section.get("clang_format_path"); }
    get clangFormatStyle() { return super.Section.get("clang_format_style"); }
    get clangFormatFallbackStyle() { return super.Section.get("clang_format_fallbackStyle"); }
    get clangFormatSortIncludes() { return super.Section.get("clang_format_sortIncludes"); }
    get clangFormatOnSave() { return super.Section.get("clang_format_formatOnSave"); }
    get formatting() { return super.Section.get("formatting"); }
    get intelliSenseEngine() { return super.Section.get("intelliSenseEngine"); }
    get intelliSenseEngineFallback() { return super.Section.get("intelliSenseEngineFallback"); }
    get errorSquiggles() { return super.Section.get("errorSquiggles"); }
    get dimInactiveRegions() { return super.Section.get("dimInactiveRegions"); }
    get inactiveRegionOpacity() { return super.Section.get("inactiveRegionOpacity"); }
    get inactiveRegionForegroundColor() { return super.Section.get("inactiveRegionForegroundColor"); }
    get inactiveRegionBackgroundColor() { return super.Section.get("inactiveRegionBackgroundColor"); }
    get autoComplete() { return super.Section.get("autocomplete"); }
    get loggingLevel() { return super.Section.get("loggingLevel"); }
    get navigationLength() { return super.Section.get("navigation.length", 60); }
    get autoAddFileAssociations() { return super.Section.get("autoAddFileAssociations"); }
    get workspaceParsingPriority() { return super.Section.get("workspaceParsingPriority"); }
    get workspaceSymbols() { return super.Section.get("workspaceSymbols"); }
    get exclusionPolicy() { return super.Section.get("exclusionPolicy"); }
    get commentContinuationPatterns() { return super.Section.get("commentContinuationPatterns"); }
    get configurationWarnings() { return super.Section.get("configurationWarnings"); }
    get preferredPathSeparator() { return super.Section.get("preferredPathSeparator"); }
    get defaultIncludePath() { return super.Section.get("default.includePath"); }
    get defaultDefines() { return super.Section.get("default.defines"); }
    get defaultMacFrameworkPath() { return super.Section.get("default.macFrameworkPath"); }
    get defaultWindowsSdkVersion() { return super.Section.get("default.windowsSdkVersion"); }
    get defaultCompileCommands() { return super.Section.get("default.compileCommands"); }
    get defaultForcedInclude() { return super.Section.get("default.forcedInclude"); }
    get defaultIntelliSenseMode() { return super.Section.get("default.intelliSenseMode"); }
    get defaultCompilerPath() { return super.Section.get("default.compilerPath"); }
    get defaultCStandard() { return super.Section.get("default.cStandard"); }
    get defaultCppStandard() { return super.Section.get("default.cppStandard"); }
    get defaultConfigurationProvider() { return super.Section.get("default.configurationProvider"); }
    get defaultBrowsePath() { return super.Section.get("default.browse.path"); }
    get defaultDatabaseFilename() { return super.Section.get("default.browse.databaseFilename"); }
    get defaultLimitSymbolsToIncludedHeaders() { return super.Section.get("default.browse.limitSymbolsToIncludedHeaders"); }
    get defaultSystemIncludePath() { return super.Section.get("default.systemIncludePath"); }
    toggleSetting(name, value1, value2) {
        let value = super.Section.get(name);
        super.Section.update(name, value === value1 ? value2 : value1, getTarget());
    }
    update(name, value) {
        super.Section.update(name, value);
    }
}
exports.CppSettings = CppSettings;
class OtherSettings {
    constructor(resource) {
        if (!resource) {
            resource = null;
        }
        this.resource = resource;
    }
    get editorTabSize() { return vscode.workspace.getConfiguration("editor", this.resource).get("tabSize"); }
    get filesAssociations() { return vscode.workspace.getConfiguration("files", null).get("associations"); }
    get filesExclude() { return vscode.workspace.getConfiguration("files", this.resource).get("exclude"); }
    get searchExclude() { return vscode.workspace.getConfiguration("search", this.resource).get("exclude"); }
    set filesAssociations(value) {
        vscode.workspace.getConfiguration("files", null).update("associations", value, vscode.ConfigurationTarget.Workspace);
    }
}
exports.OtherSettings = OtherSettings;
//# sourceMappingURL=settings.js.map