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
const vscode = require("vscode");
const customProviders_1 = require("./customProviders");
let ui;
var ConfigurationPriority;
(function (ConfigurationPriority) {
    ConfigurationPriority[ConfigurationPriority["IncludePath"] = 1] = "IncludePath";
    ConfigurationPriority[ConfigurationPriority["CompileCommands"] = 2] = "CompileCommands";
    ConfigurationPriority[ConfigurationPriority["CustomProvider"] = 3] = "CustomProvider";
})(ConfigurationPriority || (ConfigurationPriority = {}));
class UI {
    constructor() {
        this.navigationStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
        this.navigationStatusBarItem.tooltip = "C/C++ Navigation";
        this.navigationStatusBarItem.command = "C_Cpp.Navigate";
        this.ShowNavigation = true;
        this.configStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
        this.configStatusBarItem.command = "C_Cpp.ConfigurationSelect";
        this.configStatusBarItem.tooltip = "C/C++ Configuration";
        this.ShowConfiguration = true;
        this.intelliSenseStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
        this.intelliSenseStatusBarItem.text = "";
        this.intelliSenseStatusBarItem.tooltip = "Updating IntelliSense...";
        this.intelliSenseStatusBarItem.color = "Red";
        this.ShowFlameIcon = true;
        this.browseEngineStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        this.browseEngineStatusBarItem.text = "";
        this.browseEngineStatusBarItem.tooltip = "Discovering files...";
        this.browseEngineStatusBarItem.color = new vscode.ThemeColor("statusBar.foreground");
        this.browseEngineStatusBarItem.command = "C_Cpp.ShowParsingCommands";
        this.ShowDBIcon = true;
    }
    set NavigationLocation(location) {
        this.navigationStatusBarItem.text = location;
    }
    set ActiveConfig(label) {
        this.configStatusBarItem.text = label;
    }
    set TagParseStatus(label) {
        this.browseEngineStatusBarItem.tooltip = label;
    }
    get IsTagParsing() {
        return this.browseEngineStatusBarItem.text !== "";
    }
    set IsTagParsing(val) {
        this.browseEngineStatusBarItem.text = val ? "$(database)" : "";
        this.ShowDBIcon = val;
    }
    get IsUpdatingIntelliSense() {
        return this.intelliSenseStatusBarItem.text !== "";
    }
    set IsUpdatingIntelliSense(val) {
        this.intelliSenseStatusBarItem.text = val ? "$(flame)" : "";
        this.ShowFlameIcon = val;
    }
    set ShowNavigation(show) {
        if (show) {
            this.navigationStatusBarItem.show();
        }
        else {
            this.navigationStatusBarItem.hide();
        }
    }
    set ShowDBIcon(show) {
        if (show && this.IsTagParsing) {
            this.browseEngineStatusBarItem.show();
        }
        else {
            this.browseEngineStatusBarItem.hide();
        }
    }
    set ShowFlameIcon(show) {
        if (show && this.IsUpdatingIntelliSense) {
            this.intelliSenseStatusBarItem.show();
        }
        else {
            this.intelliSenseStatusBarItem.hide();
        }
    }
    set ShowConfiguration(show) {
        if (show) {
            this.configStatusBarItem.show();
        }
        else {
            this.configStatusBarItem.hide();
        }
    }
    activeDocumentChanged() {
        let activeEditor = vscode.window.activeTextEditor;
        let isCpp = (activeEditor && (activeEditor.document.languageId === "cpp" || activeEditor.document.languageId === "c"));
        let isSettingsJson = (activeEditor && (activeEditor.document.fileName.endsWith("c_cpp_properties.json") || activeEditor.document.fileName.endsWith("settings.json")));
        this.ShowConfiguration = isCpp || isSettingsJson;
        this.ShowDBIcon = isCpp || isSettingsJson;
        this.ShowFlameIcon = isCpp || isSettingsJson;
        this.ShowNavigation = isCpp;
    }
    bind(client) {
        client.TagParsingChanged(value => { this.IsTagParsing = value; });
        client.IntelliSenseParsingChanged(value => { this.IsUpdatingIntelliSense = value; });
        client.NavigationLocationChanged(value => { this.NavigationLocation = value; });
        client.TagParserStatusChanged(value => { this.TagParseStatus = value; });
        client.ActiveConfigChanged(value => { this.ActiveConfig = value; });
    }
    showNavigationOptions(navigationList) {
        let options = {};
        options.placeHolder = "Select where to navigate to";
        let items = [];
        let navlist = navigationList.split(";");
        for (let i = 0; i < navlist.length - 1; i += 2) {
            items.push({ label: navlist[i], description: "", index: Number(navlist[i + 1]) });
        }
        vscode.window.showQuickPick(items, options)
            .then(selection => {
            if (!selection) {
                return;
            }
            vscode.window.activeTextEditor.revealRange(new vscode.Range(selection.index, 0, selection.index, 0), vscode.TextEditorRevealType.InCenter);
            vscode.window.activeTextEditor.selection = new vscode.Selection(new vscode.Position(selection.index, 0), new vscode.Position(selection.index, 0));
        });
    }
    showConfigurations(configurationNames) {
        let options = {};
        options.placeHolder = "Select a Configuration...";
        let items = [];
        for (let i = 0; i < configurationNames.length; i++) {
            items.push({ label: configurationNames[i], description: "", index: i });
        }
        items.push({ label: "Edit Configurations...", description: "", index: configurationNames.length });
        return vscode.window.showQuickPick(items, options)
            .then(selection => (selection) ? selection.index : -1);
    }
    showConfigurationProviders(currentProvider) {
        let options = {};
        options.placeHolder = "Select a Configuration Provider...";
        let providers = customProviders_1.getCustomConfigProviders();
        let items = [];
        providers.forEach(provider => {
            let label = provider.name;
            if (provider.extensionId === currentProvider) {
                label += " (active)";
            }
            items.push({ label: label, description: "", key: provider.extensionId });
        });
        items.push({ label: "(none)", description: "Disable the active configuration provider, if applicable.", key: "" });
        return vscode.window.showQuickPick(items, options)
            .then(selection => (selection) ? selection.key : undefined);
    }
    showCompileCommands(paths) {
        let options = {};
        options.placeHolder = "Select a compile_commands.json...";
        let items = [];
        for (let i = 0; i < paths.length; i++) {
            items.push({ label: paths[i], description: "", index: i });
        }
        return vscode.window.showQuickPick(items, options)
            .then(selection => (selection) ? selection.index : -1);
    }
    showWorkspaces(workspaceNames) {
        let options = {};
        options.placeHolder = "Select a Workspace...";
        let items = [];
        workspaceNames.forEach(name => items.push({ label: name.name, description: "", key: name.key }));
        return vscode.window.showQuickPick(items, options)
            .then(selection => (selection) ? selection.key : "");
    }
    showParsingCommands() {
        let options = {};
        options.placeHolder = "Select a parsing command...";
        let items;
        items = [];
        if (this.browseEngineStatusBarItem.tooltip === "Parsing paused") {
            items.push({ label: "Resume Parsing", description: "", index: 1 });
        }
        else {
            items.push({ label: "Pause Parsing", description: "", index: 0 });
        }
        return vscode.window.showQuickPick(items, options)
            .then(selection => (selection) ? selection.index : -1);
    }
    showConfigureIncludePathMessage(prompt, onSkip) {
        setTimeout(() => {
            this.showConfigurationPrompt(ConfigurationPriority.IncludePath, prompt, onSkip);
        }, 10000);
    }
    showConfigureCompileCommandsMessage(prompt, onSkip) {
        setTimeout(() => {
            this.showConfigurationPrompt(ConfigurationPriority.CompileCommands, prompt, onSkip);
        }, 5000);
    }
    showConfigureCustomProviderMessage(prompt, onSkip) {
        this.showConfigurationPrompt(ConfigurationPriority.CustomProvider, prompt, onSkip);
    }
    showConfigurationPrompt(priority, prompt, onSkip) {
        let showPrompt = () => __awaiter(this, void 0, void 0, function* () {
            let configured = yield prompt();
            return Promise.resolve({
                priority: priority,
                configured: configured
            });
        });
        if (this.configurationUIPromise) {
            this.configurationUIPromise = this.configurationUIPromise.then(result => {
                if (priority > result.priority) {
                    return showPrompt();
                }
                else if (!result.configured) {
                    return showPrompt();
                }
                onSkip();
                return Promise.resolve({
                    priority: result.priority,
                    configured: true
                });
            });
        }
        else {
            this.configurationUIPromise = showPrompt();
        }
    }
    dispose() {
        this.configStatusBarItem.dispose();
        this.browseEngineStatusBarItem.dispose();
        this.intelliSenseStatusBarItem.dispose();
        this.navigationStatusBarItem.dispose();
    }
}
exports.UI = UI;
function getUI() {
    if (ui === undefined) {
        ui = new UI();
    }
    return ui;
}
exports.getUI = getUI;
//# sourceMappingURL=ui.js.map