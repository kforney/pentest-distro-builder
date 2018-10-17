/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const os = require("os");
const testUtils_1 = require("./testUtils");
const goCover_1 = require("./goCover");
// lastTestConfig holds a reference to the last executed TestConfig which allows
// the last test to be easily re-executed.
let lastTestConfig;
/**
* Executes the unit test at the primary cursor using `go test`. Output
* is sent to the 'Go' channel.
*
* @param goConfig Configuration for the Go extension.
*/
function testAtCursor(goConfig, isBenchmark, args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('_test.go')) {
        vscode.window.showInformationMessage('No tests found. Current file is not a test file.');
        return;
    }
    const getFunctions = isBenchmark ? testUtils_1.getBenchmarkFunctions : testUtils_1.getTestFunctions;
    const { tmpCoverPath, testFlags } = makeCoverData(goConfig, 'coverOnSingleTest', args);
    editor.document.save().then(() => {
        return getFunctions(editor.document, null).then(testFunctions => {
            let testFunctionName;
            // We use functionName if it was provided as argument
            // Otherwise find any test function containing the cursor.
            if (args && args.functionName) {
                testFunctionName = args.functionName;
            }
            else {
                for (let func of testFunctions) {
                    let selection = editor.selection;
                    if (selection && func.location.range.contains(selection.start)) {
                        testFunctionName = func.name;
                        break;
                    }
                }
                ;
            }
            if (!testFunctionName) {
                vscode.window.showInformationMessage('No test function found at cursor.');
                return;
            }
            let testConfigFns = [testFunctionName];
            if (!isBenchmark && testUtils_1.extractInstanceTestName(testFunctionName)) {
                // find test function with corresponding suite.Run
                const testFns = testUtils_1.findAllTestSuiteRuns(editor.document, testFunctions);
                if (testFns) {
                    testConfigFns = testConfigFns.concat(testFns.map(t => t.name));
                }
            }
            const testConfig = {
                goConfig: goConfig,
                dir: path.dirname(editor.document.fileName),
                flags: testFlags,
                functions: testConfigFns,
                isBenchmark: isBenchmark,
            };
            // Remember this config as the last executed test.
            lastTestConfig = testConfig;
            return testUtils_1.goTest(testConfig);
        });
    }).then(success => {
        if (success && tmpCoverPath) {
            return goCover_1.getCoverage(tmpCoverPath);
        }
    }, err => {
        console.error(err);
    });
}
exports.testAtCursor = testAtCursor;
/**
 * Runs all tests in the package of the source of the active editor.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testCurrentPackage(goConfig, args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    const { tmpCoverPath, testFlags } = makeCoverData(goConfig, 'coverOnTestPackage', args);
    const testConfig = {
        goConfig: goConfig,
        dir: path.dirname(editor.document.fileName),
        flags: testFlags,
    };
    // Remember this config as the last executed test.
    lastTestConfig = testConfig;
    testUtils_1.goTest(testConfig).then(success => {
        if (success && tmpCoverPath) {
            return goCover_1.getCoverage(tmpCoverPath);
        }
    }, err => {
        console.log(err);
    });
}
exports.testCurrentPackage = testCurrentPackage;
/**
 * Runs all tests from all directories in the workspace.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testWorkspace(goConfig, args) {
    let dir = vscode.workspace.rootPath;
    if (vscode.window.activeTextEditor && vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)) {
        dir = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri.fsPath;
    }
    if (!dir) {
        vscode.window.showInformationMessage('No workspace is open to run tests.');
        return;
    }
    const testConfig = {
        goConfig: goConfig,
        dir: dir,
        flags: testUtils_1.getTestFlags(goConfig, args),
        includeSubDirectories: true
    };
    // Remember this config as the last executed test.
    lastTestConfig = testConfig;
    testUtils_1.goTest(testConfig).then(null, err => {
        console.error(err);
    });
}
exports.testWorkspace = testWorkspace;
/**
 * Runs all tests in the source of the active editor.
 *
 * @param goConfig Configuration for the Go extension.
 */
function testCurrentFile(goConfig, args) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('_test.go')) {
        vscode.window.showInformationMessage('No tests found. Current file is not a test file.');
        return;
    }
    return editor.document.save().then(() => {
        return testUtils_1.getTestFunctions(editor.document, null).then(testFunctions => {
            const testConfig = {
                goConfig: goConfig,
                dir: path.dirname(editor.document.fileName),
                flags: testUtils_1.getTestFlags(goConfig, args),
                functions: testFunctions.map(sym => sym.name),
            };
            // Remember this config as the last executed test.
            lastTestConfig = testConfig;
            return testUtils_1.goTest(testConfig);
        });
    }).then(null, err => {
        console.error(err);
        return Promise.resolve(false);
    });
}
exports.testCurrentFile = testCurrentFile;
/**
 * Runs the previously executed test.
 */
function testPrevious() {
    if (!lastTestConfig) {
        vscode.window.showInformationMessage('No test has been recently executed.');
        return;
    }
    testUtils_1.goTest(lastTestConfig).then(null, err => {
        console.error(err);
    });
}
exports.testPrevious = testPrevious;
/**
 * Computes the tmp coverage path and needed flags.
 *
 * @param goConfig Configuration for the Go extension.
 */
function makeCoverData(goConfig, confFlag, args) {
    let tmpCoverPath = '';
    let testFlags = testUtils_1.getTestFlags(goConfig, args) || [];
    if (goConfig[confFlag] === true) {
        tmpCoverPath = path.normalize(path.join(os.tmpdir(), 'go-code-cover'));
        testFlags.push('-coverprofile=' + tmpCoverPath);
    }
    return { tmpCoverPath, testFlags };
}
//# sourceMappingURL=goTest.js.map