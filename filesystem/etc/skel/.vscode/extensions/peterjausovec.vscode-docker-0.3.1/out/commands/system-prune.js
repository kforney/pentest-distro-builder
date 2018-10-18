"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const semver = require("semver");
const vscode = require("vscode");
const extensionVariables_1 = require("../extensionVariables");
const telemetry_1 = require("../telemetry/telemetry");
const docker_endpoint_1 = require("./utils/docker-endpoint");
const teleCmdId = 'vscode-docker.system.prune';
async function systemPrune() {
    const configOptions = vscode.workspace.getConfiguration('docker');
    const terminal = extensionVariables_1.ext.terminalProvider.createTerminal("docker system prune");
    try {
        if (configOptions.get('promptOnSystemPrune', true)) {
            let res = await vscode.window.showWarningMessage('Remove all unused containers, volumes, networks and images (both dangling and unreferenced)?', { title: 'Yes' }, { title: 'Cancel', isCloseAffordance: true });
            if (!res || res.isCloseAffordance) {
                return;
            }
        }
        // EngineInfo in dockerode is incomplete
        const info = await docker_endpoint_1.docker.getEngineInfo();
        // in docker 17.06.1 and higher you must specify the --volumes flag
        if (semver.gte(info.ServerVersion, '17.6.1', true)) {
            terminal.sendText(`docker system prune --volumes -f`);
        }
        else {
            terminal.sendText(`docker system prune -f`);
        }
        terminal.show();
    }
    catch (error) {
        vscode.window.showErrorMessage('Unable to connect to Docker, is the Docker daemon running?');
        console.log(error);
    }
    if (telemetry_1.reporter) {
        /* __GDPR__
           "command" : {
              "command" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
           }
         */
        telemetry_1.reporter.sendTelemetryEvent('command', {
            command: teleCmdId
        });
    }
}
exports.systemPrune = systemPrune;
//# sourceMappingURL=system-prune.js.map