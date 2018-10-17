/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const os = require("os");
const goCover_1 = require("./goCover");
const goStatus_1 = require("./goStatus");
const testUtils_1 = require("./testUtils");
const util_1 = require("./util");
const goLint_1 = require("./goLint");
const goVet_1 = require("./goVet");
const goBuild_1 = require("./goBuild");
let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
statusBarItem.command = 'go.test.showOutput';
const neverAgain = { title: 'Don\'t Show Again' };
function removeTestStatus(e) {
    if (e.document.isUntitled) {
        return;
    }
    statusBarItem.hide();
    statusBarItem.text = '';
}
exports.removeTestStatus = removeTestStatus;
function notifyIfGeneratedFile(e) {
    let ctx = this;
    if (e.document.isUntitled || e.document.languageId !== 'go') {
        return;
    }
    let documentUri = e ? e.document.uri : null;
    let goConfig = vscode.workspace.getConfiguration('go', documentUri);
    if ((ctx.globalState.get('ignoreGeneratedCodeWarning') !== true) && e.document.lineAt(0).text.match(/^\/\/ Code generated .* DO NOT EDIT\.$/)) {
        vscode.window.showWarningMessage('This file seems to be generated. DO NOT EDIT.', neverAgain).then(result => {
            if (result === neverAgain) {
                ctx.globalState.update('ignoreGeneratedCodeWarning', true);
            }
        });
    }
}
exports.notifyIfGeneratedFile = notifyIfGeneratedFile;
function check(fileUri, goConfig) {
    goStatus_1.diagnosticsStatusBarItem.hide();
    goStatus_1.outputChannel.clear();
    let runningToolsPromises = [];
    let cwd = path.dirname(fileUri.fsPath);
    let goRuntimePath = util_1.getBinPath('go');
    if (!goRuntimePath) {
        vscode.window.showInformationMessage('Cannot find "go" binary. Update PATH or GOROOT appropriately');
        return Promise.resolve([]);
    }
    let testPromise;
    let tmpCoverPath;
    let runTest = () => {
        if (testPromise) {
            return testPromise;
        }
        let buildFlags = goConfig['testFlags'] || goConfig['buildFlags'] || [];
        let args = [...buildFlags];
        if (goConfig['coverOnSave']) {
            tmpCoverPath = path.normalize(path.join(os.tmpdir(), 'go-code-cover'));
            args = ['-coverprofile=' + tmpCoverPath, ...buildFlags];
        }
        testPromise = testUtils_1.goTest({
            goConfig: goConfig,
            dir: cwd,
            flags: args,
            background: true
        });
        return testPromise;
    };
    if (!!goConfig['buildOnSave'] && goConfig['buildOnSave'] !== 'off') {
        runningToolsPromises.push(goBuild_1.goBuild(fileUri, goConfig, goConfig['buildOnSave'] === 'workspace'));
    }
    if (!!goConfig['testOnSave']) {
        statusBarItem.show();
        statusBarItem.text = 'Tests Running';
        runTest().then(success => {
            if (statusBarItem.text === '') {
                return;
            }
            if (success) {
                statusBarItem.text = 'Tests Passed';
            }
            else {
                statusBarItem.text = 'Tests Failed';
            }
        });
    }
    if (!!goConfig['lintOnSave'] && goConfig['lintOnSave'] !== 'off') {
        runningToolsPromises.push(goLint_1.goLint(fileUri, goConfig, goConfig['lintOnSave'] === 'workspace'));
    }
    if (!!goConfig['vetOnSave'] && goConfig['vetOnSave'] !== 'off') {
        runningToolsPromises.push(goVet_1.goVet(fileUri, goConfig, goConfig['vetOnSave'] === 'workspace'));
    }
    if (!!goConfig['coverOnSave']) {
        runTest().then(success => {
            if (!success) {
                return [];
            }
            // FIXME: it's not obvious that tmpCoverPath comes from runTest()
            return goCover_1.getCoverage(tmpCoverPath);
        });
    }
    return Promise.all(runningToolsPromises).then(function (resultSets) {
        return [].concat.apply([], resultSets);
    });
}
exports.check = check;
//# sourceMappingURL=goCheck.js.map