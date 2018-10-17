Object.defineProperty(exports, "__esModule", { value: true });
const debugUtils = require("./utils");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const configurations_1 = require("./configurations");
const jsonc_parser_1 = require("jsonc-parser");
class CppConfigurationProvider {
    constructor(provider, type) {
        this.provider = provider;
        this.type = type;
    }
    provideDebugConfigurations(folder, token) {
        return this.provider.getInitialConfigurations(this.type);
    }
    resolveDebugConfiguration(folder, config, token) {
        if (config.type === 'cppvsdbg' && os.platform() !== 'win32') {
            vscode.window.showErrorMessage("Debugger of type: 'cppvsdbg' is only available on Windows. Use type: 'cppdbg' on the current OS platform.");
            return undefined;
        }
        if (os.platform() === 'win32' &&
            config.pipeTransport &&
            config.pipeTransport.pipeProgram) {
            let replacedPipeProgram = null;
            const pipeProgramStr = config.pipeTransport.pipeProgram.toLowerCase().trim();
            replacedPipeProgram = debugUtils.ArchitectureReplacer.checkAndReplaceWSLPipeProgram(pipeProgramStr, debugUtils.ArchType.ia32);
            if (!replacedPipeProgram && !path.isAbsolute(pipeProgramStr) && config.pipeTransport.pipeCwd) {
                const pipeCwdStr = config.pipeTransport.pipeCwd.toLowerCase().trim();
                const newPipeProgramStr = path.join(pipeCwdStr, pipeProgramStr);
                replacedPipeProgram = debugUtils.ArchitectureReplacer.checkAndReplaceWSLPipeProgram(newPipeProgramStr, debugUtils.ArchType.ia32);
            }
            if (replacedPipeProgram) {
                config.pipeTransport.pipeProgram = replacedPipeProgram;
            }
        }
        return config;
    }
}
class CppVsDbgConfigurationProvider extends CppConfigurationProvider {
    constructor(provider) {
        super(provider, configurations_1.DebuggerType.cppvsdbg);
    }
}
exports.CppVsDbgConfigurationProvider = CppVsDbgConfigurationProvider;
class CppDbgConfigurationProvider extends CppConfigurationProvider {
    constructor(provider) {
        super(provider, configurations_1.DebuggerType.cppdbg);
    }
}
exports.CppDbgConfigurationProvider = CppDbgConfigurationProvider;
class ConfigurationAssetProviderFactory {
    static getConfigurationProvider() {
        switch (os.platform()) {
            case 'win32':
                return new WindowsConfigurationProvider();
            case 'darwin':
                return new OSXConfigurationProvider();
            case 'linux':
                return new LinuxConfigurationProvider();
            default:
                throw new Error("Unexpected OS type");
        }
    }
}
exports.ConfigurationAssetProviderFactory = ConfigurationAssetProviderFactory;
class DefaultConfigurationProvider {
    getInitialConfigurations(debuggerType) {
        let configurationSnippet = [];
        this.configurations.forEach(configuration => {
            configurationSnippet.push(configuration.GetLaunchConfiguration());
        });
        let initialConfigurations = configurationSnippet.filter(snippet => snippet.debuggerType === debuggerType && snippet.isInitialConfiguration)
            .map(snippet => JSON.parse(snippet.bodyText));
        return initialConfigurations;
    }
    getConfigurationSnippets() {
        let completionItems = [];
        this.configurations.forEach(configuration => {
            completionItems.push(convertConfigurationSnippetToCompetionItem(configuration.GetLaunchConfiguration()));
            completionItems.push(convertConfigurationSnippetToCompetionItem(configuration.GetAttachConfiguration()));
        });
        return completionItems;
    }
}
class WindowsConfigurationProvider extends DefaultConfigurationProvider {
    constructor() {
        super();
        this.executable = "a.exe";
        this.pipeProgram = "<full path to pipe program such as plink.exe>";
        this.MIMode = 'gdb';
        this.setupCommandsBlock = `"setupCommands": [
    {
        "description": "Enable pretty-printing for gdb",
        "text": "-enable-pretty-printing",
        "ignoreFailures": true
    }
]`;
        this.configurations = [
            new configurations_1.MIConfigurations(this.MIMode, this.executable, this.pipeProgram, this.setupCommandsBlock),
            new configurations_1.PipeTransportConfigurations(this.MIMode, this.executable, this.pipeProgram, this.setupCommandsBlock),
            new configurations_1.WindowsConfigurations(this.MIMode, this.executable, this.pipeProgram, this.setupCommandsBlock),
            new configurations_1.WSLConfigurations(this.MIMode, this.executable, this.pipeProgram, this.setupCommandsBlock),
        ];
    }
}
class OSXConfigurationProvider extends DefaultConfigurationProvider {
    constructor() {
        super();
        this.MIMode = 'lldb';
        this.executable = "a.out";
        this.pipeProgram = "/usr/bin/ssh";
        this.configurations = [
            new configurations_1.MIConfigurations(this.MIMode, this.executable, this.pipeProgram),
        ];
    }
}
class LinuxConfigurationProvider extends DefaultConfigurationProvider {
    constructor() {
        super();
        this.MIMode = 'gdb';
        this.setupCommandsBlock = `"setupCommands": [
    {
        "description": "Enable pretty-printing for gdb",
        "text": "-enable-pretty-printing",
        "ignoreFailures": true
    }
]`;
        this.executable = "a.out";
        this.pipeProgram = "/usr/bin/ssh";
        this.configurations = [
            new configurations_1.MIConfigurations(this.MIMode, this.executable, this.pipeProgram, this.setupCommandsBlock),
            new configurations_1.PipeTransportConfigurations(this.MIMode, this.executable, this.pipeProgram, this.setupCommandsBlock)
        ];
    }
}
function convertConfigurationSnippetToCompetionItem(snippet) {
    let item = new vscode.CompletionItem(snippet.label, vscode.CompletionItemKind.Snippet);
    item.insertText = snippet.bodyText;
    return item;
}
class ConfigurationSnippetProvider {
    constructor(provider) {
        this.provider = provider;
        this.snippets = this.provider.getConfigurationSnippets();
    }
    resolveCompletionItem(item, token) {
        return Promise.resolve(item);
    }
    provideCompletionItems(document, position, token, context) {
        let items = this.snippets;
        const launch = jsonc_parser_1.parse(document.getText());
        if (launch.configurations.length !== 0) {
            items = [];
            this.snippets.forEach((item) => items.push(Object.assign({}, item)));
            items.map((item) => {
                item.insertText = item.insertText + ',';
            });
        }
        return Promise.resolve(new vscode.CompletionList(items, true));
    }
}
exports.ConfigurationSnippetProvider = ConfigurationSnippetProvider;
//# sourceMappingURL=configurationProvider.js.map