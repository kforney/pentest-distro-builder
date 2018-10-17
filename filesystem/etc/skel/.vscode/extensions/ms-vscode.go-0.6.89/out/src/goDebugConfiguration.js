'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util_1 = require("./util");
class GoDebugConfigurationProvider {
    provideDebugConfigurations(folder, token) {
        return [
            {
                'name': 'Launch',
                'type': 'go',
                'request': 'launch',
                'mode': 'auto',
                'remotePath': '',
                'port': 2345,
                'host': '127.0.0.1',
                'program': '${fileDirname}',
                'env': {},
                'args': [],
                'showLog': false
            }
        ];
    }
    resolveDebugConfiguration(folder, debugConfiguration, token) {
        if (debugConfiguration) {
            /* __GDPR__
                "debugConfiguration" : {
                    "request" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "mode" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "useApiV1": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    "stopOnEntry": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            util_1.sendTelemetryEvent('debugConfiguration', {
                request: debugConfiguration.request,
                mode: debugConfiguration.mode,
                useApiV1: debugConfiguration.useApiV1,
                stopOnEntry: debugConfiguration.stopOnEntry
            });
        }
        const activeEditor = vscode.window.activeTextEditor;
        if (!debugConfiguration || !debugConfiguration.request) { // if 'request' is missing interpret this as a missing launch.json
            if (!activeEditor || activeEditor.document.languageId !== 'go') {
                return;
            }
            debugConfiguration = {
                'name': 'Launch',
                'type': 'go',
                'request': 'launch',
                'mode': 'auto',
                'program': activeEditor.document.fileName
            };
        }
        const gopath = util_1.getCurrentGoPath(folder ? folder.uri : null);
        if (!debugConfiguration['env']) {
            debugConfiguration['env'] = { 'GOPATH': gopath };
        }
        else if (!debugConfiguration['env']['GOPATH']) {
            debugConfiguration['env']['GOPATH'] = gopath;
        }
        const goConfig = vscode.workspace.getConfiguration('go', folder ? folder.uri : null);
        const goToolsEnvVars = util_1.getToolsEnvVars();
        Object.keys(goToolsEnvVars).forEach(key => {
            if (!debugConfiguration['env'].hasOwnProperty(key)) {
                debugConfiguration['env'][key] = goToolsEnvVars[key];
            }
        });
        const dlvConfig = goConfig.get('delveConfig');
        if (!debugConfiguration.hasOwnProperty('useApiV1') && dlvConfig.hasOwnProperty('useApiV1')) {
            debugConfiguration['useApiV1'] = dlvConfig['useApiV1'];
        }
        if (!debugConfiguration.hasOwnProperty('dlvLoadConfig') && dlvConfig.hasOwnProperty('dlvLoadConfig')) {
            debugConfiguration['dlvLoadConfig'] = dlvConfig['dlvLoadConfig'];
        }
        if (debugConfiguration['mode'] === 'auto') {
            debugConfiguration['mode'] = (activeEditor && activeEditor.document.fileName.endsWith('_test.go')) ? 'test' : 'debug';
        }
        return debugConfiguration;
    }
}
exports.GoDebugConfigurationProvider = GoDebugConfigurationProvider;
//# sourceMappingURL=goDebugConfiguration.js.map