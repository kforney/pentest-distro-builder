"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const opn = require("opn");
const path = require("path");
const request = require("request-promise-native");
const vscode = require("vscode");
const vscode_azureextensionui_1 = require("vscode-azureextensionui");
const main_1 = require("vscode-languageclient/lib/main");
const create_registry_1 = require("./commands/azureCommands/create-registry");
const delete_image_1 = require("./commands/azureCommands/delete-image");
const delete_registry_1 = require("./commands/azureCommands/delete-registry");
const delete_repository_1 = require("./commands/azureCommands/delete-repository");
const build_image_1 = require("./commands/build-image");
const docker_compose_1 = require("./commands/docker-compose");
const inspect_image_1 = require("./commands/inspect-image");
const open_shell_container_1 = require("./commands/open-shell-container");
const push_image_1 = require("./commands/push-image");
const registrySettings_1 = require("./commands/registrySettings");
const remove_container_1 = require("./commands/remove-container");
const remove_image_1 = require("./commands/remove-image");
const restart_container_1 = require("./commands/restart-container");
const showlogs_container_1 = require("./commands/showlogs-container");
const start_container_1 = require("./commands/start-container");
const stop_container_1 = require("./commands/stop-container");
const system_prune_1 = require("./commands/system-prune");
const tag_image_1 = require("./commands/tag-image");
const docker_endpoint_1 = require("./commands/utils/docker-endpoint");
const TerminalProvider_1 = require("./commands/utils/TerminalProvider");
const configDebugProvider_1 = require("./configureWorkspace/configDebugProvider");
const configure_1 = require("./configureWorkspace/configure");
const dockerComposeCompletionItemProvider_1 = require("./dockerCompose/dockerComposeCompletionItemProvider");
const dockerComposeHoverProvider_1 = require("./dockerCompose/dockerComposeHoverProvider");
const dockerComposeKeyInfo_1 = require("./dockerCompose/dockerComposeKeyInfo");
const dockerComposeParser_1 = require("./dockerCompose/dockerComposeParser");
const dockerfileCompletionItemProvider_1 = require("./dockerfile/dockerfileCompletionItemProvider");
const dockerInspect_1 = require("./documentContentProviders/dockerInspect");
const azureAccountWrapper_1 = require("./explorer/deploy/azureAccountWrapper");
const util = require("./explorer/deploy/util");
const webAppCreator_1 = require("./explorer/deploy/webAppCreator");
const dockerExplorer_1 = require("./explorer/dockerExplorer");
const customRegistries_1 = require("./explorer/models/customRegistries");
const nodeBase_1 = require("./explorer/models/nodeBase");
const browseAzurePortal_1 = require("./explorer/utils/browseAzurePortal");
const dockerHubUtils_1 = require("./explorer/utils/dockerHubUtils");
const extensionVariables_1 = require("./extensionVariables");
const telemetry_1 = require("./telemetry/telemetry");
const addUserAgent_1 = require("./utils/addUserAgent");
const common_1 = require("./utils/Azure/common");
const azureUtilityManager_1 = require("./utils/azureUtilityManager");
const keytar_1 = require("./utils/keytar");
exports.FROM_DIRECTIVE_PATTERN = /^\s*FROM\s*([\w-\/:]*)(\s*AS\s*[a-z][a-z0-9-_\\.]*)?$/i;
exports.COMPOSE_FILE_GLOB_PATTERN = '**/[dD]ocker-[cC]ompose*.{yaml,yml}';
exports.DOCKERFILE_GLOB_PATTERN = '**/{*.dockerfile,[dD]ocker[fF]ile}';
let client;
const DOCUMENT_SELECTOR = [
    { language: 'dockerfile', scheme: 'file' }
];
function initializeExtensionVariables(ctx) {
    vscode_azureextensionui_1.registerUIExtensionVariables(extensionVariables_1.ext);
    if (!extensionVariables_1.ext.ui) {
        // This allows for standard interactions with the end user (as opposed to test input)
        extensionVariables_1.ext.ui = new vscode_azureextensionui_1.AzureUserInput(ctx.globalState);
    }
    extensionVariables_1.ext.context = ctx;
    extensionVariables_1.ext.outputChannel = util.getOutputChannel();
    if (!extensionVariables_1.ext.terminalProvider) {
        extensionVariables_1.ext.terminalProvider = new TerminalProvider_1.DefaultTerminalProvider();
    }
    telemetry_1.initializeTelemetryReporter(vscode_azureextensionui_1.createTelemetryReporter(ctx));
    extensionVariables_1.ext.reporter = telemetry_1.reporter;
    if (!extensionVariables_1.ext.keytar) {
        extensionVariables_1.ext.keytar = keytar_1.Keytar.tryCreate();
    }
    // Set up the user agent for all direct 'request' calls in the extension (must use ext.request)
    let defaultRequestOptions = {};
    addUserAgent_1.addUserAgent(defaultRequestOptions);
    extensionVariables_1.ext.request = request.defaults(defaultRequestOptions);
}
async function activate(ctx) {
    const installedExtensions = vscode.extensions.all;
    let azureAccount;
    initializeExtensionVariables(ctx);
    // tslint:disable-next-line:prefer-for-of // Grandfathered in
    for (let i = 0; i < installedExtensions.length; i++) {
        const extension = installedExtensions[i];
        if (extension.id === 'ms-vscode.azure-account') {
            try {
                // tslint:disable-next-line:no-unsafe-any
                azureAccount = await extension.activate();
            }
            catch (error) {
                console.log('Failed to activate the Azure Account Extension: ' + vscode_azureextensionui_1.parseError(error).message);
            }
            break;
        }
    }
    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, new dockerfileCompletionItemProvider_1.DockerfileCompletionItemProvider(), '.'));
    const YAML_MODE_ID = { language: 'yaml', scheme: 'file', pattern: exports.COMPOSE_FILE_GLOB_PATTERN };
    let yamlHoverProvider = new dockerComposeHoverProvider_1.DockerComposeHoverProvider(new dockerComposeParser_1.DockerComposeParser(), dockerComposeKeyInfo_1.default.All);
    ctx.subscriptions.push(vscode.languages.registerHoverProvider(YAML_MODE_ID, yamlHoverProvider));
    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider(YAML_MODE_ID, new dockerComposeCompletionItemProvider_1.DockerComposeCompletionItemProvider(), '.'));
    ctx.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(dockerInspect_1.SCHEME, new dockerInspect_1.default()));
    if (azureAccount) {
        azureUtilityManager_1.AzureUtilityManager.getInstance().setAccount(azureAccount);
    }
    registerDockerCommands(azureAccount);
    ctx.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('docker', new configDebugProvider_1.DockerDebugConfigProvider()));
    await registrySettings_1.consolidateDefaultRegistrySettings();
    activateLanguageClient(ctx);
}
exports.activate = activate;
async function createWebApp(context, azureAccount) {
    if (context) {
        if (azureAccount) {
            const azureAccountWrapper = new azureAccountWrapper_1.AzureAccountWrapper(extensionVariables_1.ext.context, azureAccount);
            const wizard = new webAppCreator_1.WebAppCreator(extensionVariables_1.ext.outputChannel, azureAccountWrapper, context);
            const result = await wizard.run();
            if (result.status === 'Faulted') {
                throw result.error;
            }
            else if (result.status === 'Cancelled') {
                throw new vscode_azureextensionui_1.UserCancelledError();
            }
        }
        else {
            const open = { title: "View in Marketplace" };
            const response = await vscode.window.showErrorMessage('Please install the Azure Account extension to deploy to Azure.', open);
            if (response === open) {
                // tslint:disable-next-line:no-unsafe-any
                opn('https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account');
            }
        }
    }
}
// Remove this when https://github.com/Microsoft/vscode-docker/issues/445 fixed
// tslint:disable-next-line:no-any
function registerCommand(commandId, callback) {
    return vscode_azureextensionui_1.registerCommand(commandId, 
    // tslint:disable-next-line:no-function-expression no-any
    async function (...args) {
        if (args.length) {
            let properties = this.properties;
            const contextArg = args[0];
            if (contextArg instanceof nodeBase_1.NodeBase) {
                properties.contextValue = contextArg.contextValue;
            }
            else if (contextArg instanceof vscode.Uri) {
                properties.contextValue = 'Uri';
            }
        }
        return callback.call(this, ...args);
    });
}
function registerDockerCommands(azureAccount) {
    exports.dockerExplorerProvider = new dockerExplorer_1.DockerExplorerProvider(azureAccount);
    vscode.window.registerTreeDataProvider('dockerExplorer', exports.dockerExplorerProvider);
    registerCommand('vscode-docker.explorer.refresh', () => exports.dockerExplorerProvider.refresh());
    registerCommand('vscode-docker.configure', async function () { await configure_1.configure(this, undefined); });
    registerCommand('vscode-docker.api.configure', async function (options) {
        await configure_1.configureApi(this, options);
    });
    registerCommand('vscode-docker.container.start', async function (node) { await start_container_1.startContainer(this, node); });
    registerCommand('vscode-docker.container.start.interactive', async function (node) { await start_container_1.startContainerInteractive(this, node); });
    registerCommand('vscode-docker.container.start.azurecli', async function () { await start_container_1.startAzureCLI(this); });
    registerCommand('vscode-docker.container.stop', async function (node) { await stop_container_1.stopContainer(this, node); });
    registerCommand('vscode-docker.container.restart', async function (node) { await restart_container_1.restartContainer(this, node); });
    registerCommand('vscode-docker.container.show-logs', async function (node) { await showlogs_container_1.showLogsContainer(this, node); });
    registerCommand('vscode-docker.container.open-shell', async function (node) { await open_shell_container_1.openShellContainer(this, node); });
    registerCommand('vscode-docker.container.remove', async function (node) { await remove_container_1.removeContainer(this, node); });
    registerCommand('vscode-docker.image.build', async function (item) { await build_image_1.buildImage(this, item); });
    registerCommand('vscode-docker.image.inspect', async function (node) { await inspect_image_1.default(this, node); });
    registerCommand('vscode-docker.image.remove', async function (node) { await remove_image_1.removeImage(this, node); });
    registerCommand('vscode-docker.image.push', async function (node) { await push_image_1.pushImage(this, node); });
    registerCommand('vscode-docker.image.tag', async function (node) { await tag_image_1.tagImage(this, node); });
    registerCommand('vscode-docker.compose.up', docker_compose_1.composeUp);
    registerCommand('vscode-docker.compose.down', docker_compose_1.composeDown);
    registerCommand('vscode-docker.compose.restart', docker_compose_1.composeRestart);
    registerCommand('vscode-docker.system.prune', system_prune_1.systemPrune);
    registerCommand('vscode-docker.createWebApp', async (context) => await createWebApp(context, azureAccount));
    registerCommand('vscode-docker.dockerHubLogout', dockerHubUtils_1.dockerHubLogout);
    registerCommand('vscode-docker.browseDockerHub', (context) => {
        dockerHubUtils_1.browseDockerHub(context);
    });
    registerCommand('vscode-docker.browseAzurePortal', (context) => {
        browseAzurePortal_1.browseAzurePortal(context);
    });
    registerCommand('vscode-docker.connectCustomRegistry', customRegistries_1.connectCustomRegistry);
    registerCommand('vscode-docker.disconnectCustomRegistry', customRegistries_1.disconnectCustomRegistry);
    registerCommand('vscode-docker.setRegistryAsDefault', registrySettings_1.setRegistryAsDefault);
    common_1.registerAzureCommand('vscode-docker.delete-ACR-Registry', delete_registry_1.deleteAzureRegistry);
    common_1.registerAzureCommand('vscode-docker.delete-ACR-Image', delete_image_1.deleteAzureImage);
    common_1.registerAzureCommand('vscode-docker.delete-ACR-Repository', delete_repository_1.deleteRepository);
    common_1.registerAzureCommand('vscode-docker.create-ACR-Registry', create_registry_1.createRegistry);
}
async function deactivate() {
    if (!client) {
        return undefined;
    }
    // perform cleanup
    Configuration.dispose();
    return await client.stop();
}
exports.deactivate = deactivate;
var Configuration;
(function (Configuration) {
    let configurationListener;
    function computeConfiguration(params) {
        let result = [];
        for (let item of params.items) {
            let config;
            if (item.scopeUri) {
                config = vscode.workspace.getConfiguration(item.section, client.protocol2CodeConverter.asUri(item.scopeUri));
            }
            else {
                config = vscode.workspace.getConfiguration(item.section);
            }
            result.push(config);
        }
        return result;
    }
    Configuration.computeConfiguration = computeConfiguration;
    function initialize() {
        configurationListener = vscode.workspace.onDidChangeConfiguration((e) => {
            // notify the language server that settings have change
            client.sendNotification(main_1.DidChangeConfigurationNotification.type, { settings: null });
            // Update endpoint and refresh explorer if needed
            if (e.affectsConfiguration('docker')) {
                docker_endpoint_1.docker.refreshEndpoint();
                vscode.commands.executeCommand("vscode-docker.explorer.refresh");
            }
        });
    }
    Configuration.initialize = initialize;
    function dispose() {
        if (configurationListener) {
            // remove this listener when disposed
            configurationListener.dispose();
        }
    }
    Configuration.dispose = dispose;
})(Configuration || (Configuration = {}));
function activateLanguageClient(ctx) {
    let serverModule = ctx.asAbsolutePath(path.join("node_modules", "dockerfile-language-server-nodejs", "lib", "server.js"));
    let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };
    let serverOptions = {
        run: { module: serverModule, transport: main_1.TransportKind.ipc, args: ["--node-ipc"] },
        debug: { module: serverModule, transport: main_1.TransportKind.ipc, options: debugOptions }
    };
    let middleware = {
        workspace: {
            configuration: Configuration.computeConfiguration
        }
    };
    let clientOptions = {
        documentSelector: DOCUMENT_SELECTOR,
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
        },
        middleware: middleware
    };
    client = new main_1.LanguageClient("dockerfile-langserver", "Dockerfile Language Server", serverOptions, clientOptions);
    // tslint:disable-next-line:no-floating-promises
    client.onReady().then(() => {
        // attach the VS Code settings listener
        Configuration.initialize();
    });
    client.start();
}
//# sourceMappingURL=dockerExtension.js.map