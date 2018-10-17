"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");
const vscode = require("vscode");
const goExtraInfo_1 = require("../src/goExtraInfo");
const goSuggest_1 = require("../src/goSuggest");
const goSignature_1 = require("../src/goSignature");
const goDeclaration_1 = require("../src/goDeclaration");
const goSymbol_1 = require("../src/goSymbol");
const goCheck_1 = require("../src/goCheck");
const cp = require("child_process");
const diffUtils_1 = require("../src/diffUtils");
const goTest_1 = require("../src/goTest");
const util_1 = require("../src/util");
const goOutline_1 = require("../src/goOutline");
const goImport_1 = require("../src/goImport");
const goGenerateTests_1 = require("../src/goGenerateTests");
const goPackages_1 = require("../src/goPackages");
const util_2 = require("../src/util");
const goPlayground_1 = require("../src/goPlayground");
const goFillStruct_1 = require("../src/goFillStruct");
suite('Go Extension Tests', () => {
    let gopath = process.env['GOPATH'];
    if (!gopath) {
        assert.ok(gopath, 'Cannot run tests if GOPATH is not set as environment variable');
        return;
    }
    let repoPath = path.join(gopath, 'src', 'test');
    let fixturePath = path.join(repoPath, 'testfixture');
    let fixtureSourcePath = path.join(__dirname, '..', '..', 'test', 'fixtures');
    let generateTestsSourcePath = path.join(repoPath, 'generatetests');
    let generateFunctionTestSourcePath = path.join(repoPath, 'generatefunctiontest');
    let generatePackageTestSourcePath = path.join(repoPath, 'generatePackagetest');
    let testPath = path.join(__dirname, 'tests');
    suiteSetup(() => {
        fs.removeSync(repoPath);
        fs.removeSync(testPath);
        fs.copySync(path.join(fixtureSourcePath, 'test.go'), path.join(fixturePath, 'test.go'));
        fs.copySync(path.join(fixtureSourcePath, 'errorsTest', 'errors.go'), path.join(fixturePath, 'errorsTest', 'errors.go'));
        fs.copySync(path.join(fixtureSourcePath, 'sample_test.go'), path.join(fixturePath, 'sample_test.go'));
        fs.copySync(path.join(fixtureSourcePath, 'gogetdocTestData', 'test.go'), path.join(fixturePath, 'gogetdocTestData', 'test.go'));
        fs.copySync(path.join(fixtureSourcePath, 'generatetests', 'generatetests.go'), path.join(generateTestsSourcePath, 'generatetests.go'));
        fs.copySync(path.join(fixtureSourcePath, 'generatetests', 'generatetests.go'), path.join(generateFunctionTestSourcePath, 'generatetests.go'));
        fs.copySync(path.join(fixtureSourcePath, 'generatetests', 'generatetests.go'), path.join(generatePackageTestSourcePath, 'generatetests.go'));
        fs.copySync(path.join(fixtureSourcePath, 'diffTestData', 'file1.go'), path.join(fixturePath, 'diffTest1Data', 'file1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'diffTestData', 'file2.go'), path.join(fixturePath, 'diffTest1Data', 'file2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'diffTestData', 'file1.go'), path.join(fixturePath, 'diffTest2Data', 'file1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'diffTestData', 'file2.go'), path.join(fixturePath, 'diffTest2Data', 'file2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'linterTest', 'linter_1.go'), path.join(fixturePath, 'linterTest', 'linter_1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'linterTest', 'linter_2.go'), path.join(fixturePath, 'linterTest', 'linter_2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'errorsTest', 'errors.go'), path.join(testPath, 'errorsTest', 'errors.go'));
        fs.copySync(path.join(fixtureSourcePath, 'linterTest', 'linter_1.go'), path.join(testPath, 'linterTest', 'linter_1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'linterTest', 'linter_2.go'), path.join(testPath, 'linterTest', 'linter_2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'buildTags', 'hello.go'), path.join(fixturePath, 'buildTags', 'hello.go'));
        fs.copySync(path.join(fixtureSourcePath, 'completions', 'unimportedPkgs.go'), path.join(fixturePath, 'completions', 'unimportedPkgs.go'));
        fs.copySync(path.join(fixtureSourcePath, 'completions', 'snippets.go'), path.join(fixturePath, 'completions', 'snippets.go'));
        fs.copySync(path.join(fixtureSourcePath, 'completions', 'nosnippets.go'), path.join(fixturePath, 'completions', 'nosnippets.go'));
        fs.copySync(path.join(fixtureSourcePath, 'completions', 'exportedMemberDocs.go'), path.join(fixturePath, 'completions', 'exportedMemberDocs.go'));
        fs.copySync(path.join(fixtureSourcePath, 'importTest', 'noimports.go'), path.join(fixturePath, 'importTest', 'noimports.go'));
        fs.copySync(path.join(fixtureSourcePath, 'importTest', 'groupImports.go'), path.join(fixturePath, 'importTest', 'groupImports.go'));
        fs.copySync(path.join(fixtureSourcePath, 'importTest', 'singleImports.go'), path.join(fixturePath, 'importTest', 'singleImports.go'));
        fs.copySync(path.join(fixtureSourcePath, 'fillStruct', 'input_1.go'), path.join(fixturePath, 'fillStruct', 'input_1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'fillStruct', 'golden_1.go'), path.join(fixturePath, 'fillStruct', 'golden_1.go'));
        fs.copySync(path.join(fixtureSourcePath, 'fillStruct', 'input_2.go'), path.join(fixturePath, 'fillStruct', 'input_2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'fillStruct', 'golden_2.go'), path.join(fixturePath, 'fillStruct', 'golden_2.go'));
        fs.copySync(path.join(fixtureSourcePath, 'fillStruct', 'input_2.go'), path.join(fixturePath, 'fillStruct', 'input_3.go'));
    });
    suiteTeardown(() => {
        fs.removeSync(repoPath);
        fs.removeSync(testPath);
    });
    function testDefinitionProvider(goConfig) {
        let provider = new goDeclaration_1.GoDefinitionProvider(goConfig);
        let uri = vscode.Uri.file(path.join(fixturePath, 'test.go'));
        let position = new vscode.Position(10, 3);
        return vscode.workspace.openTextDocument(uri).then((textDocument) => {
            return provider.provideDefinition(textDocument, position, null).then(definitionInfo => {
                assert.equal(definitionInfo.uri.path.toLowerCase(), uri.path.toLowerCase(), `${definitionInfo.uri.path} is not the same as ${uri.path}`);
                assert.equal(definitionInfo.range.start.line, 6);
                assert.equal(definitionInfo.range.start.character, 5);
            });
        }, (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
            return Promise.reject(err);
        });
    }
    function testSignatureHelpProvider(goConfig, testCases) {
        let provider = new goSignature_1.GoSignatureHelpProvider(goConfig);
        let uri = vscode.Uri.file(path.join(fixturePath, 'gogetdocTestData', 'test.go'));
        return vscode.workspace.openTextDocument(uri).then((textDocument) => {
            let promises = testCases.map(([position, expected, expectedDoc, expectedParams]) => provider.provideSignatureHelp(textDocument, position, null).then(sigHelp => {
                assert.equal(sigHelp.signatures.length, 1, 'unexpected number of overloads');
                assert.equal(sigHelp.signatures[0].label, expected);
                assert.equal(sigHelp.signatures[0].documentation, expectedDoc);
                assert.equal(sigHelp.signatures[0].parameters.length, expectedParams.length);
                for (let i = 0; i < expectedParams.length; i++) {
                    assert.equal(sigHelp.signatures[0].parameters[i].label, expectedParams[i]);
                }
            }));
            return Promise.all(promises);
        }, (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
            return Promise.reject(err);
        });
    }
    function testHoverProvider(goConfig, testCases) {
        let provider = new goExtraInfo_1.GoHoverProvider(goConfig);
        let uri = vscode.Uri.file(path.join(fixturePath, 'gogetdocTestData', 'test.go'));
        return vscode.workspace.openTextDocument(uri).then((textDocument) => {
            let promises = testCases.map(([position, expectedSignature, expectedDocumentation]) => provider.provideHover(textDocument, position, null).then(res => {
                // TODO: Documentation appears to currently be broken on Go 1.7, so disabling these tests for now
                // if (expectedDocumentation === null) {
                //  assert.equal(res.contents.length, 1);
                // } else {
                // 	assert.equal(res.contents.length, 2);
                // 	assert.equal(expectedDocumentation, <string>(res.contents[0]));
                // }
                if (expectedSignature === null && expectedDocumentation === null) {
                    assert.equal(res, null);
                    return;
                }
                assert.equal(expectedSignature, res.contents[0].value);
            }));
            return Promise.all(promises);
        }, (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
            return Promise.reject(err);
        });
    }
    test('Test Definition Provider using godoc', (done) => {
        let config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'godoc' }
        });
        testDefinitionProvider(config).then(() => done(), done);
    });
    test('Test Definition Provider using gogetdoc', (done) => {
        let config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'gogetdoc' }
        });
        util_1.getGoVersion().then(version => {
            if (!version || version.major > 1 || (version.major === 1 && version.minor > 5)) {
                return testDefinitionProvider(config);
            }
            return Promise.resolve();
        }).then(() => done(), done);
    });
    test('Test SignatureHelp Provider using godoc', (done) => {
        let printlnDoc = `Println formats using the default formats for its operands and writes to
standard output. Spaces are always added between operands and a newline
is appended. It returns the number of bytes written and any write error
encountered.
`;
        let testCases = [
            [new vscode.Position(19, 13), 'Println(a ...interface{}) (n int, err error)', printlnDoc, ['a ...interface{}']],
            [new vscode.Position(23, 7), 'print(txt string)', null, ['txt string']],
            [new vscode.Position(41, 19), 'Hello(s string, exclaim bool) string', null, ['s string', 'exclaim bool']]
        ];
        let config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'godoc' }
        });
        testSignatureHelpProvider(config, testCases).then(() => done(), done);
    });
    test('Test SignatureHelp Provider using gogetdoc', (done) => {
        let printlnDoc = `Println formats using the default formats for its operands and writes to standard output.
Spaces are always added between operands and a newline is appended.
It returns the number of bytes written and any write error encountered.
`;
        let testCases = [
            [new vscode.Position(19, 13), 'Println(a ...interface{}) (n int, err error)', printlnDoc, ['a ...interface{}']],
            [new vscode.Position(23, 7), 'print(txt string)', 'This is an unexported function so couldnt get this comment on hover :(\nNot anymore!! gogetdoc to the rescue\n', ['txt string']],
            [new vscode.Position(41, 19), 'Hello(s string, exclaim bool) string', 'Hello is a method on the struct ABC. Will signature help understand this correctly\n', ['s string', 'exclaim bool']]
        ];
        let config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'gogetdoc' }
        });
        util_1.getGoVersion().then(version => {
            if (!version || version.major > 1 || (version.major === 1 && version.minor > 5)) {
                return testSignatureHelpProvider(config, testCases);
            }
            return Promise.resolve();
        }).then(() => done(), done);
    });
    test('Test Hover Provider using godoc', (done) => {
        let printlnDoc = `Println formats using the default formats for its operands and writes to
standard output. Spaces are always added between operands and a newline
is appended. It returns the number of bytes written and any write error
encountered.
`;
        let testCases = [
            // [new vscode.Position(3,3), '/usr/local/go/src/fmt'],
            [new vscode.Position(0, 3), null, null],
            [new vscode.Position(23, 14), null, null],
            [new vscode.Position(20, 0), null, null],
            [new vscode.Position(28, 16), null, null],
            [new vscode.Position(22, 5), 'main func()', null],
            [new vscode.Position(40, 23), 'import (math "math")', null],
            [new vscode.Position(19, 6), 'Println func(a ...interface{}) (n int, err error)', printlnDoc],
            [new vscode.Position(23, 4), 'print func(txt string)', null]
        ];
        let config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'godoc' }
        });
        testHoverProvider(config, testCases).then(() => done(), done);
    });
    test('Test Hover Provider using gogetdoc', (done) => {
        let printlnDoc = `Println formats using the default formats for its operands and writes to standard output.
Spaces are always added between operands and a newline is appended.
It returns the number of bytes written and any write error encountered.
`;
        let testCases = [
            [new vscode.Position(0, 3), null, null],
            [new vscode.Position(23, 11), null, null],
            [new vscode.Position(20, 0), null, null],
            [new vscode.Position(28, 16), null, null],
            [new vscode.Position(22, 5), 'func main()', ''],
            [new vscode.Position(23, 4), 'func print(txt string)', 'This is an unexported function so couldnt get this comment on hover :(\nNot anymore!! gogetdoc to the rescue\n'],
            [new vscode.Position(40, 23), 'package math', 'Package math provides basic constants and mathematical functions.\n'],
            [new vscode.Position(19, 6), 'func Println(a ...interface{}) (n int, err error)', printlnDoc],
            [new vscode.Position(27, 14), 'type ABC struct {\n    a int\n    b int\n    c int\n}', 'ABC is a struct, you coudnt use Goto Definition or Hover info on this before\nNow you can due to gogetdoc\n'],
            [new vscode.Position(28, 6), 'func CIDRMask(ones, bits int) IPMask', 'CIDRMask returns an IPMask consisting of `ones\' 1 bits\nfollowed by 0s up to a total length of `bits\' bits.\nFor a mask of this form, CIDRMask is the inverse of IPMask.Size.\n']
        ];
        let config = Object.create(vscode.workspace.getConfiguration('go'), {
            'docsTool': { value: 'gogetdoc' }
        });
        util_1.getGoVersion().then(version => {
            if (!version || version.major > 1 || (version.major === 1 && version.minor > 5)) {
                return testHoverProvider(config, testCases);
            }
            return Promise.resolve();
        }).then(() => done(), done);
    });
    test('Error checking', (done) => {
        let config = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'package' },
            'vetFlags': { value: ['-all'] },
            'lintOnSave': { value: 'package' },
            'lintTool': { value: 'golint' },
            'lintFlags': { value: [] }
        });
        let expected = [
            { line: 7, severity: 'warning', msg: 'exported function Print2 should have comment or be unexported' },
            { line: 11, severity: 'error', msg: 'undefined: prin' },
        ];
        util_1.getGoVersion().then(version => {
            if (version && version.major === 1 && version.minor < 6) {
                // golint is not supported in Go 1.5, so skip the test
                return Promise.resolve();
            }
            return goCheck_1.check(vscode.Uri.file(path.join(fixturePath, 'errorsTest', 'errors.go')), config).then(diagnostics => {
                let sortedDiagnostics = diagnostics.sort((a, b) => a.line - b.line);
                assert.equal(sortedDiagnostics.length > 0, true, `Failed to get linter results`);
                let matchCount = 0;
                for (let i in expected) {
                    for (let j in sortedDiagnostics) {
                        if (expected[i].line
                            && (expected[i].line === sortedDiagnostics[j].line)
                            && (expected[i].severity === sortedDiagnostics[j].severity)
                            && (expected[i].msg === sortedDiagnostics[j].msg)) {
                            matchCount++;
                        }
                    }
                }
                assert.equal(matchCount >= expected.length, true, `Failed to match expected errors`);
            });
        }).then(() => done(), done);
    });
    test('Test Generate unit tests skeleton for file', (done) => {
        util_1.getGoVersion().then(version => {
            if (version && version.major === 1 && version.minor < 6) {
                // gotests is not supported in Go 1.5, so skip the test
                return Promise.resolve();
            }
            let uri = vscode.Uri.file(path.join(generateTestsSourcePath, 'generatetests.go'));
            return vscode.workspace.openTextDocument(uri).then(document => {
                return vscode.window.showTextDocument(document).then(editor => {
                    return goGenerateTests_1.generateTestCurrentFile().then((result) => {
                        assert.equal(result, true);
                        return Promise.resolve();
                    });
                });
            }).then(() => {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                if (fs.existsSync(path.join(generateTestsSourcePath, 'generatetests_test.go'))) {
                    return Promise.resolve();
                }
                else {
                    return Promise.reject('generatetests_test.go not found');
                }
            });
        }).then(() => done(), done);
    });
    test('Test Generate unit tests skeleton for a function', (done) => {
        util_1.getGoVersion().then(version => {
            if (version && version.major === 1 && version.minor < 6) {
                // gotests is not supported in Go 1.5, so skip the test
                return Promise.resolve();
            }
            let uri = vscode.Uri.file(path.join(generateFunctionTestSourcePath, 'generatetests.go'));
            return vscode.workspace.openTextDocument(uri).then(document => {
                return vscode.window.showTextDocument(document).then((editor) => {
                    assert(vscode.window.activeTextEditor, 'No active editor');
                    let selection = new vscode.Selection(5, 0, 6, 0);
                    editor.selection = selection;
                    return goGenerateTests_1.generateTestCurrentFunction().then((result) => {
                        assert.equal(result, true);
                        return Promise.resolve();
                    });
                });
            }).then(() => {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                if (fs.existsSync(path.join(generateTestsSourcePath, 'generatetests_test.go'))) {
                    return Promise.resolve();
                }
                else {
                    return Promise.reject('generatetests_test.go not found');
                }
            });
        }).then(() => done(), done);
    });
    test('Test Generate unit tests skeleton for package', (done) => {
        util_1.getGoVersion().then(version => {
            if (version && version.major === 1 && version.minor < 6) {
                // gotests is not supported in Go 1.5, so skip the test
                return Promise.resolve();
            }
            let uri = vscode.Uri.file(path.join(generatePackageTestSourcePath, 'generatetests.go'));
            return vscode.workspace.openTextDocument(uri).then(document => {
                return vscode.window.showTextDocument(document).then(editor => {
                    return goGenerateTests_1.generateTestCurrentPackage().then((result) => {
                        assert.equal(result, true);
                        return Promise.resolve();
                    });
                });
            }).then(() => {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                if (fs.existsSync(path.join(generateTestsSourcePath, 'generatetests_test.go'))) {
                    return Promise.resolve();
                }
                else {
                    return Promise.reject('generatetests_test.go not found');
                }
            });
        }).then(() => done(), done);
    });
    test('Gometalinter error checking', (done) => {
        util_1.getGoVersion().then(version => {
            if (version && version.major === 1 && version.minor < 6) {
                // golint in gometalinter is not supported in Go 1.5, so skip the test
                return Promise.resolve();
            }
            let config = Object.create(vscode.workspace.getConfiguration('go'), {
                'lintOnSave': { value: 'package' },
                'lintTool': { value: 'gometalinter' },
                'lintFlags': { value: ['--disable-all', '--enable=varcheck', '--enable=errcheck'] },
                'vetOnSave': { value: 'off' },
                'buildOnSave': { value: 'off' }
            });
            let expected = [
                { line: 11, severity: 'warning', msg: 'error return value not checked (undeclared name: prin) (errcheck)' },
                { line: 11, severity: 'warning', msg: 'unused variable or constant undeclared name: prin (varcheck)' },
            ];
            let errorsTestPath = path.join(fixturePath, 'errorsTest', 'errors.go');
            return goCheck_1.check(vscode.Uri.file(errorsTestPath), config).then(diagnostics => {
                let sortedDiagnostics = diagnostics.sort((a, b) => {
                    if (a.msg < b.msg)
                        return -1;
                    if (a.msg > b.msg)
                        return 1;
                    return 0;
                });
                assert.equal(sortedDiagnostics.length > 0, true, `Failed to get linter results`);
                let matchCount = 0;
                for (let i in expected) {
                    for (let j in sortedDiagnostics) {
                        if ((expected[i].line === sortedDiagnostics[j].line)
                            && (expected[i].severity === sortedDiagnostics[j].severity)
                            && (expected[i].msg === sortedDiagnostics[j].msg)) {
                            matchCount++;
                        }
                    }
                }
                assert.equal(matchCount >= expected.length, true, `Failed to match expected errors`);
                return Promise.resolve();
            });
        }).then(() => done(), done);
    });
    test('Test diffUtils.getEditsFromUnifiedDiffStr', (done) => {
        let file1path = path.join(fixturePath, 'diffTest1Data', 'file1.go');
        let file2path = path.join(fixturePath, 'diffTest1Data', 'file2.go');
        let file1uri = vscode.Uri.file(file1path);
        let file2contents = fs.readFileSync(file2path, 'utf8');
        let diffPromise = new Promise((resolve, reject) => {
            cp.exec(`diff -u ${file1path} ${file2path}`, (err, stdout, stderr) => {
                let filePatches = diffUtils_1.getEditsFromUnifiedDiffStr(stdout);
                if (!filePatches && filePatches.length !== 1) {
                    assert.fail(null, null, 'Failed to get patches for the test file', '');
                    return reject();
                }
                if (!filePatches[0].fileName) {
                    assert.fail(null, null, 'Failed to parse the file path from the diff output', '');
                    return reject();
                }
                if (!filePatches[0].edits) {
                    assert.fail(null, null, 'Failed to parse edits from the diff output', '');
                    return reject();
                }
                resolve(filePatches);
            });
        });
        diffPromise.then((filePatches) => {
            return vscode.workspace.openTextDocument(file1uri).then((textDocument) => {
                return vscode.window.showTextDocument(textDocument).then(editor => {
                    return editor.edit((editBuilder) => {
                        filePatches[0].edits.forEach(edit => {
                            edit.applyUsingTextEditorEdit(editBuilder);
                        });
                    }).then(() => {
                        assert.equal(editor.document.getText(), file2contents);
                        return Promise.resolve();
                    });
                });
            });
        }).then(() => done(), done);
    });
    test('Test diffUtils.getEdits', (done) => {
        let file1path = path.join(fixturePath, 'diffTest2Data', 'file1.go');
        let file2path = path.join(fixturePath, 'diffTest2Data', 'file2.go');
        let file1uri = vscode.Uri.file(file1path);
        let file1contents = fs.readFileSync(file1path, 'utf8');
        let file2contents = fs.readFileSync(file2path, 'utf8');
        let fileEdits = diffUtils_1.getEdits(file1path, file1contents, file2contents);
        if (!fileEdits) {
            assert.fail(null, null, 'Failed to get patches for the test file', '');
            done();
            return;
        }
        if (!fileEdits.fileName) {
            assert.fail(null, null, 'Failed to parse the file path from the diff output', '');
            done();
            return;
        }
        if (!fileEdits.edits) {
            assert.fail(null, null, 'Failed to parse edits from the diff output', '');
            done();
            return;
        }
        vscode.workspace.openTextDocument(file1uri).then((textDocument) => {
            return vscode.window.showTextDocument(textDocument).then(editor => {
                return editor.edit((editBuilder) => {
                    fileEdits.edits.forEach(edit => {
                        edit.applyUsingTextEditorEdit(editBuilder);
                    });
                }).then(() => {
                    assert.equal(editor.document.getText(), file2contents);
                    return Promise.resolve();
                });
            }).then(() => done(), done);
        });
    });
    test('Test Env Variables are passed to Tests', (done) => {
        let config = Object.create(vscode.workspace.getConfiguration('go'), {
            'testEnvVars': { value: { 'dummyEnvVar': 'dummyEnvValue', 'dummyNonString': 1 } }
        });
        let uri = vscode.Uri.file(path.join(fixturePath, 'sample_test.go'));
        vscode.workspace.openTextDocument(uri).then(document => {
            return vscode.window.showTextDocument(document).then(editor => {
                return goTest_1.testCurrentFile(config, []).then((result) => {
                    assert.equal(result, true);
                    return Promise.resolve();
                });
            });
        }).then(() => done(), done);
    });
    test('Test Outline', (done) => {
        let filePath = path.join(fixturePath, 'test.go');
        let options = { fileName: filePath };
        goOutline_1.documentSymbols(options, null).then(outlines => {
            let packageOutline = outlines[0];
            let symbols = packageOutline.children;
            let imports = symbols.filter(x => x.type === 'import');
            let functions = symbols.filter(x => x.type === 'function');
            assert.equal(packageOutline.type, 'package');
            assert.equal(packageOutline.label, 'main');
            assert.equal(imports[0].label, '"fmt"');
            assert.equal(functions[0].label, 'print');
            assert.equal(functions[1].label, 'main');
            done();
        }, done);
    });
    test('Test Outline imports only', (done) => {
        let filePath = path.join(fixturePath, 'test.go');
        let options = { fileName: filePath, importsOnly: true };
        goOutline_1.documentSymbols(options, null).then(outlines => {
            let packageOutline = outlines[0];
            let symbols = packageOutline.children;
            let imports = symbols.filter(x => x.type === 'import');
            let functions = symbols.filter(x => x.type === 'function');
            assert.equal(packageOutline.type, 'package');
            assert.equal(packageOutline.label, 'main');
            assert.equal(imports[0].label, '"fmt"');
            assert.equal(functions.length, 0);
            assert.equal(imports.length, 1);
            done();
        }, done);
    });
    test('Test listPackages', (done) => {
        let uri = vscode.Uri.file(path.join(fixturePath, 'test.go'));
        vscode.workspace.openTextDocument(uri).then(document => {
            return vscode.window.showTextDocument(document).then(editor => {
                let includeImportedPkgs = goImport_1.listPackages(false);
                let excludeImportedPkgs = goImport_1.listPackages(true);
                return Promise.all([includeImportedPkgs, excludeImportedPkgs]).then(([pkgsInclude, pkgsExclude]) => {
                    assert.equal(pkgsInclude.indexOf('fmt') > -1, true);
                    assert.equal(pkgsExclude.indexOf('fmt') > -1, false);
                });
            });
        }).then(() => done(), done);
    });
    test('Replace vendor packages with relative path', (done) => {
        // This test needs a go project that has vendor folder and vendor packages
        // Since the Go extension takes a dependency on the godef tool at github.com/rogpeppe/godef
        // which has vendor packages, we are using it here to test the "replace vendor packages with relative path" feature.
        // If the extension ever stops depending on godef tool or if godef ever stops having vendor packages, then this test
        // will fail and will have to be replaced with any other go project with vendor packages
        let vendorSupportPromise = util_1.isVendorSupported();
        let filePath = path.join(process.env['GOPATH'], 'src', 'github.com', 'rogpeppe', 'godef', 'go', 'ast', 'ast.go');
        let workDir = path.dirname(filePath);
        let vendorPkgsFullPath = [
            'github.com/rogpeppe/godef/vendor/9fans.net/go/acme',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9/client'
        ];
        let vendorPkgsRelativePath = [
            '9fans.net/go/acme',
            '9fans.net/go/plan9',
            '9fans.net/go/plan9/client'
        ];
        vendorSupportPromise.then((vendorSupport) => {
            let gopkgsPromise = goPackages_1.getAllPackages(workDir).then(pkgMap => {
                let pkgs = Array.from(pkgMap.keys());
                pkgs = pkgs.filter(p => pkgMap.get(p) !== 'main');
                if (vendorSupport) {
                    vendorPkgsFullPath.forEach(pkg => {
                        assert.equal(pkgs.indexOf(pkg) > -1, true, `Package not found by goPkgs: ${pkg}`);
                    });
                    vendorPkgsRelativePath.forEach(pkg => {
                        assert.equal(pkgs.indexOf(pkg), -1, `Relative path to vendor package ${pkg} should not be returned by gopkgs command`);
                    });
                }
                return Promise.resolve(pkgs);
            });
            let listPkgPromise = vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(document => {
                return vscode.window.showTextDocument(document).then(editor => {
                    return goImport_1.listPackages().then(pkgs => {
                        if (vendorSupport) {
                            vendorPkgsRelativePath.forEach(pkg => {
                                assert.equal(pkgs.indexOf(pkg) > -1, true, `Relative path for vendor package ${pkg} not found`);
                            });
                            vendorPkgsFullPath.forEach(pkg => {
                                assert.equal(pkgs.indexOf(pkg), -1, `Full path for vendor package ${pkg} should be shown by listPackages method`);
                            });
                        }
                        return Promise.resolve(pkgs);
                    });
                });
            });
            return Promise.all([gopkgsPromise, listPkgPromise]).then((values) => {
                if (!vendorSupport) {
                    let originalPkgs = values[0].sort();
                    let updatedPkgs = values[1].sort();
                    assert.equal(originalPkgs.length, updatedPkgs.length);
                    for (let index = 0; index < originalPkgs.length; index++) {
                        assert.equal(updatedPkgs[index], originalPkgs[index]);
                    }
                }
            });
        }).then(() => done(), done);
    });
    test('Vendor pkgs from other projects should not be allowed to import', (done) => {
        // This test needs a go project that has vendor folder and vendor packages
        // Since the Go extension takes a dependency on the godef tool at github.com/rogpeppe/godef
        // which has vendor packages, we are using it here to test the "replace vendor packages with relative path" feature.
        // If the extension ever stops depending on godef tool or if godef ever stops having vendor packages, then this test
        // will fail and will have to be replaced with any other go project with vendor packages
        let vendorSupportPromise = util_1.isVendorSupported();
        let filePath = path.join(process.env['GOPATH'], 'src', 'github.com', 'ramya-rao-a', 'go-outline', 'main.go');
        let vendorPkgs = [
            'github.com/rogpeppe/godef/vendor/9fans.net/go/acme',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9',
            'github.com/rogpeppe/godef/vendor/9fans.net/go/plan9/client'
        ];
        vendorSupportPromise.then((vendorSupport) => {
            let gopkgsPromise = new Promise((resolve, reject) => {
                let cmd = cp.spawn(util_1.getBinPath('gopkgs'), ['-format', '{{.ImportPath}}'], { env: process.env });
                let chunks = [];
                cmd.stdout.on('data', (d) => chunks.push(d));
                cmd.on('close', () => {
                    let pkgs = chunks.join('').split('\n').filter((pkg) => pkg).sort();
                    if (vendorSupport) {
                        vendorPkgs.forEach(pkg => {
                            assert.equal(pkgs.indexOf(pkg) > -1, true, `Package not found by goPkgs: ${pkg}`);
                        });
                    }
                    return resolve();
                });
            });
            let listPkgPromise = vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(document => {
                return vscode.window.showTextDocument(document).then(editor => {
                    return goImport_1.listPackages().then(pkgs => {
                        if (vendorSupport) {
                            vendorPkgs.forEach(pkg => {
                                assert.equal(pkgs.indexOf(pkg), -1, `Vendor package ${pkg} should not be shown by listPackages method`);
                            });
                        }
                        return Promise.resolve();
                    });
                });
            });
            return Promise.all([gopkgsPromise, listPkgPromise]);
        }).then(() => done(), done);
    });
    test('Workspace Symbols', () => {
        // This test needs a go project that has vendor folder and vendor packages
        // Since the Go extension takes a dependency on the godef tool at github.com/rogpeppe/godef
        // which has vendor packages, we are using it here to test the "replace vendor packages with relative path" feature.
        // If the extension ever stops depending on godef tool or if godef ever stops having vendor packages, then this test
        // will fail and will have to be replaced with any other go project with vendor packages
        let workspacePath = path.join(process.env['GOPATH'], 'src', 'github.com', 'rogpeppe', 'godef');
        let configWithoutIgnoringFolders = Object.create(vscode.workspace.getConfiguration('go'), {
            'gotoSymbol': {
                value: {
                    'ignoreFolders': []
                }
            }
        });
        let configWithIgnoringFolders = Object.create(vscode.workspace.getConfiguration('go'), {
            'gotoSymbol': {
                value: {
                    'ignoreFolders': ['vendor']
                }
            }
        });
        let configWithIncludeGoroot = Object.create(vscode.workspace.getConfiguration('go'), {
            'gotoSymbol': {
                value: {
                    'includeGoroot': true
                }
            }
        });
        let configWithoutIncludeGoroot = Object.create(vscode.workspace.getConfiguration('go'), {
            'gotoSymbol': {
                value: {
                    'includeGoroot': false
                }
            }
        });
        let withoutIgnoringFolders = goSymbol_1.getWorkspaceSymbols(workspacePath, 'WinInfo', null, configWithoutIgnoringFolders).then(results => {
            assert.equal(results[0].name, 'WinInfo');
            assert.equal(results[0].path, path.join(workspacePath, 'vendor/9fans.net/go/acme/acme.go'));
        });
        let withIgnoringFolders = goSymbol_1.getWorkspaceSymbols(workspacePath, 'WinInfo', null, configWithIgnoringFolders).then(results => {
            assert.equal(results.length, 0);
        });
        let withoutIncludingGoroot = goSymbol_1.getWorkspaceSymbols(workspacePath, 'Mutex', null, configWithoutIncludeGoroot).then(results => {
            assert.equal(results.length, 0);
        });
        let withIncludingGoroot = goSymbol_1.getWorkspaceSymbols(workspacePath, 'Mutex', null, configWithIncludeGoroot).then(results => {
            assert(results.some(result => result.name === 'Mutex'));
        });
        return Promise.all([withIgnoringFolders, withoutIgnoringFolders, withIncludingGoroot, withoutIncludingGoroot]);
    });
    test('Test Completion', (done) => {
        let provider = new goSuggest_1.GoCompletionItemProvider();
        let testCases = [
            [new vscode.Position(1, 0), []],
            [new vscode.Position(4, 1), ['main', 'print', 'fmt']],
            [new vscode.Position(7, 4), ['fmt']],
            [new vscode.Position(8, 0), ['main', 'print', 'fmt', 'txt']]
        ];
        let uri = vscode.Uri.file(path.join(fixturePath, 'test.go'));
        vscode.workspace.openTextDocument(uri).then((textDocument) => {
            return vscode.window.showTextDocument(textDocument).then(editor => {
                let promises = testCases.map(([position, expected]) => provider.provideCompletionItems(editor.document, position, null).then(items => {
                    let labels = items.map(x => x.label);
                    for (let entry of expected) {
                        if (labels.indexOf(entry) < 0) {
                            assert.fail('', entry, 'missing expected item in competion list', '');
                        }
                    }
                }));
                return Promise.all(promises);
            }).then(() => {
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                return Promise.resolve();
            });
        }, (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });
    test('Test Completion Snippets For Functions', (done) => {
        let provider = new goSuggest_1.GoCompletionItemProvider();
        let uri = vscode.Uri.file(path.join(fixturePath, 'completions', 'snippets.go'));
        let testCases = [
            [new vscode.Position(5, 6), ['Print']]
        ];
        let baseConfig = vscode.workspace.getConfiguration('go');
        vscode.workspace.openTextDocument(uri).then((textDocument) => {
            return vscode.window.showTextDocument(textDocument).then(editor => {
                let noFunctionSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(9, 6), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: false } })).then(items => {
                    let item = items.find(x => x.label === 'Print');
                    assert.equal(!item.insertText, true);
                });
                let withFunctionSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(9, 6), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items => {
                    let item = items.find(x => x.label === 'Print');
                    assert.equal(item.insertText.value, 'Print(${1:a ...interface{\\}})');
                });
                let withFunctionSnippetNotype = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(9, 6), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggestWithoutType': { value: true } })).then(items => {
                    let item = items.find(x => x.label === 'Print');
                    assert.equal(item.insertText.value, 'Print(${1:a})');
                });
                let noFunctionAsVarSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(11, 3), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: false } })).then(items => {
                    let item = items.find(x => x.label === 'funcAsVariable');
                    assert.equal(!item.insertText, true);
                });
                let withFunctionAsVarSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(11, 3), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items => {
                    let item = items.find(x => x.label === 'funcAsVariable');
                    assert.equal(item.insertText.value, 'funcAsVariable(${1:k string})');
                });
                let withFunctionAsVarSnippetNoType = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(11, 3), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggestWithoutType': { value: true } })).then(items => {
                    let item = items.find(x => x.label === 'funcAsVariable');
                    assert.equal(item.insertText.value, 'funcAsVariable(${1:k})');
                });
                let noFunctionAsTypeSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(14, 0), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: false } })).then(items => {
                    let item1 = items.find(x => x.label === 'HandlerFunc');
                    let item2 = items.find(x => x.label === 'HandlerFuncWithArgNames');
                    let item3 = items.find(x => x.label === 'HandlerFuncNoReturnType');
                    assert.equal(!item1.insertText, true);
                    assert.equal(!item2.insertText, true);
                    assert.equal(!item3.insertText, true);
                });
                let withFunctionAsTypeSnippet = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(14, 0), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items => {
                    let item1 = items.find(x => x.label === 'HandlerFunc');
                    let item2 = items.find(x => x.label === 'HandlerFuncWithArgNames');
                    let item3 = items.find(x => x.label === 'HandlerFuncNoReturnType');
                    assert.equal(item1.insertText.value, 'HandlerFunc(func(${1:arg1} string, ${2:arg2} string) {\n\t$3\n}) (string, string)');
                    assert.equal(item2.insertText.value, 'HandlerFuncWithArgNames(func(${1:w} string, ${2:r} string) {\n\t$3\n}) int');
                    assert.equal(item3.insertText.value, 'HandlerFuncNoReturnType(func(${1:arg1} string, ${2:arg2} string) {\n\t$3\n})');
                });
                return Promise.all([
                    noFunctionSnippet, withFunctionSnippet, withFunctionSnippetNotype,
                    noFunctionAsVarSnippet, withFunctionAsVarSnippet, withFunctionAsVarSnippetNoType,
                    noFunctionAsTypeSnippet, withFunctionAsTypeSnippet
                ]).then(() => vscode.commands.executeCommand('workbench.action.closeActiveEditor'));
            });
        }, (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });
    test('Test No Completion Snippets For Functions', (done) => {
        let provider = new goSuggest_1.GoCompletionItemProvider();
        let uri = vscode.Uri.file(path.join(fixturePath, 'completions', 'nosnippets.go'));
        let baseConfig = vscode.workspace.getConfiguration('go');
        vscode.workspace.openTextDocument(uri).then((textDocument) => {
            return vscode.window.showTextDocument(textDocument).then(editor => {
                let symbolFollowedByBrackets = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(5, 10), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items => {
                    let item = items.find(x => x.label === 'Print');
                    assert.equal(!item.insertText, true, 'Unexpected snippet when symbol is followed by ().');
                });
                let symbolAsLastParameter = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(7, 13), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items => {
                    let item = items.find(x => x.label === 'funcAsVariable');
                    assert.equal(!item.insertText, true, 'Unexpected snippet when symbol is a parameter inside func call');
                });
                let symbolsAsNonLastParameter = provider.provideCompletionItemsInternal(editor.document, new vscode.Position(8, 11), null, Object.create(baseConfig, { 'useCodeSnippetsOnFunctionSuggest': { value: true } })).then(items => {
                    let item = items.find(x => x.label === 'funcAsVariable');
                    assert.equal(!item.insertText, true, 'Unexpected snippet when symbol is one of the parameters inside func call.');
                });
                return Promise.all([
                    symbolFollowedByBrackets, symbolAsLastParameter, symbolsAsNonLastParameter
                ]).then(() => vscode.commands.executeCommand('workbench.action.closeActiveEditor'));
            });
        }, (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });
    test('Test Completion on unimported packages', (done) => {
        let config = Object.create(vscode.workspace.getConfiguration('go'), {
            'autocompleteUnimportedPackages': { value: true }
        });
        let provider = new goSuggest_1.GoCompletionItemProvider();
        let testCases = [
            [new vscode.Position(10, 3), ['bytes']],
            [new vscode.Position(11, 6), ['Abs', 'Acos', 'Asin']]
        ];
        let uri = vscode.Uri.file(path.join(fixturePath, 'completions', 'unimportedPkgs.go'));
        vscode.workspace.openTextDocument(uri).then((textDocument) => {
            return vscode.window.showTextDocument(textDocument).then(editor => {
                let promises = testCases.map(([position, expected]) => provider.provideCompletionItemsInternal(editor.document, position, null, config).then(items => {
                    let labels = items.map(x => x.label);
                    for (let entry of expected) {
                        assert.equal(labels.indexOf(entry) > -1, true, `missing expected item in completion list: ${entry} Actual: ${labels}`);
                    }
                }));
                return Promise.all(promises).then(() => vscode.commands.executeCommand('workbench.action.closeActiveEditor'));
            });
        }, (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });
    test('Test Completion on Comments for Exported Members', (done) => {
        let provider = new goSuggest_1.GoCompletionItemProvider();
        let testCases = [
            [new vscode.Position(6, 4), ['Language']],
            [new vscode.Position(9, 4), ['GreetingText']],
            // checking for comment completions with begining of comment without space
            [new vscode.Position(12, 2), []],
            // cursor between /$/ this should not trigger any completion
            [new vscode.Position(12, 1), []],
            [new vscode.Position(12, 4), ['SayHello']],
            [new vscode.Position(17, 5), ['HelloParams']],
            [new vscode.Position(26, 5), ['Abs']],
        ];
        let uri = vscode.Uri.file(path.join(fixturePath, 'completions', 'exportedMemberDocs.go'));
        vscode.workspace.openTextDocument(uri).then((textDocument) => {
            return vscode.window.showTextDocument(textDocument).then(editor => {
                let promises = testCases.map(([position, expected]) => provider.provideCompletionItems(editor.document, position, null).then(items => {
                    let labels = items.map(x => x.label);
                    assert.equal(expected.length, labels.length, `expected number of completions: ${expected.length} Actual: ${labels.length} at position(${position.line},${position.character}) ${labels}`);
                    expected.forEach((entry, index) => {
                        assert.equal(entry, labels[index], `mismatch in comment completion list Expected: ${entry} Actual: ${labels[index]}`);
                    });
                }));
                return Promise.all(promises).then(() => vscode.commands.executeCommand('workbench.action.closeActiveEditor'));
            });
        }, (err) => {
            assert.ok(false, `error in OpenTextDocument ${err}`);
        }).then(() => done(), done);
    });
    test('getImportPath()', () => {
        let testCases = [
            ['import "github.com/sirupsen/logrus"', 'github.com/sirupsen/logrus'],
            ['import "net/http"', 'net/http'],
            ['"github.com/sirupsen/logrus"', 'github.com/sirupsen/logrus'],
            ['', ''],
            ['func foo(bar int) (int, error) {', ''],
            ['// This is a comment, complete with punctuation.', '']
        ];
        testCases.forEach(run => {
            assert.equal(run[1], util_2.getImportPath(run[0]));
        });
    });
    test('goPlay - success run', (done) => {
        const validCode = `
			package main
			import (
				"fmt"
			)
			func main() {
				for i := 1; i < 4; i++ {
					fmt.Printf("%v ", i)
				}
				fmt.Print("Go!")
			}`;
        const goConfig = Object.create(vscode.workspace.getConfiguration('go'), {
            'playground': { value: { run: true, openbrowser: false, share: false } }
        });
        goPlayground_1.goPlay(validCode, goConfig['playground']).then(result => {
            assert(result.includes('1 2 3 Go!'));
        }, (e) => {
            assert.ifError(e);
        }).then(() => done(), done);
    });
    test('goPlay - success run & share', (done) => {
        const validCode = `
			package main
			import (
				"fmt"
			)
			func main() {
				for i := 1; i < 4; i++ {
					fmt.Printf("%v ", i)
				}
				fmt.Print("Go!")
			}`;
        const goConfig = Object.create(vscode.workspace.getConfiguration('go'), {
            'playground': { value: { run: true, openbrowser: false, share: true } }
        });
        goPlayground_1.goPlay(validCode, goConfig['playground']).then(result => {
            assert(result.includes('1 2 3 Go!'));
            assert(result.includes('https://play.golang.org/'));
        }, (e) => {
            assert.ifError(e);
        }).then(() => done(), done);
    });
    test('goPlay - fail', (done) => {
        const invalidCode = `
			package main
			import (
				"fmt"
			)
			func fantasy() {
				fmt.Print("not a main package, sorry")
			}`;
        const goConfig = Object.create(vscode.workspace.getConfiguration('go'), {
            'playground': { value: { run: true, openbrowser: false, share: false } }
        });
        goPlayground_1.goPlay(invalidCode, goConfig['playground']).then(result => {
            assert.ifError(result);
        }, (e) => {
            assert.ok(e);
        }).then(() => done(), done);
    });
    test('Build Tags checking', (done) => {
        const config1 = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'off' },
            'lintOnSave': { value: 'off' },
            'buildOnSave': { value: 'package' },
            'buildTags': { value: 'randomtag' }
        });
        const checkWithTags = goCheck_1.check(vscode.Uri.file(path.join(fixturePath, 'buildTags', 'hello.go')), config1).then(diagnostics => {
            assert.equal(1, diagnostics.length, 'check with buildtag failed. Unexpected errors found');
            assert.equal(diagnostics[0].msg, 'undefined: fmt.Prinln');
        });
        const config2 = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'off' },
            'lintOnSave': { value: 'off' },
            'buildOnSave': { value: 'package' },
            'buildTags': { value: 'randomtag othertag' }
        });
        const checkWithMultipleTags = goCheck_1.check(vscode.Uri.file(path.join(fixturePath, 'buildTags', 'hello.go')), config2).then(diagnostics => {
            assert.equal(1, diagnostics.length, 'check with multiple buildtags failed. Unexpected errors found');
            assert.equal(diagnostics[0].msg, 'undefined: fmt.Prinln');
        });
        const config3 = Object.create(vscode.workspace.getConfiguration('go'), {
            'vetOnSave': { value: 'off' },
            'lintOnSave': { value: 'off' },
            'buildOnSave': { value: 'package' },
            'buildTags': { value: '' }
        });
        const checkWithoutTags = goCheck_1.check(vscode.Uri.file(path.join(fixturePath, 'buildTags', 'hello.go')), config3).then(diagnostics => {
            assert.equal(1, diagnostics.length, 'check without buildtags failed. Unexpected errors found');
            assert.equal(diagnostics[0].msg.indexOf('can\'t load package: package test/testfixture/buildTags') > -1, true, `check without buildtags failed. Go files not excluded. ${diagnostics[0].msg}`);
        });
        Promise.all([checkWithTags, checkWithMultipleTags, checkWithoutTags]).then(() => done(), done);
    });
    test('Add imports when no imports', (done) => {
        let uri = vscode.Uri.file(path.join(fixturePath, 'importTest', 'noimports.go'));
        vscode.workspace.openTextDocument(uri).then(document => {
            return vscode.window.showTextDocument(document).then(editor => {
                const expectedText = document.getText() + '\n' + 'import (\n\t"bytes"\n)\n';
                const edits = goImport_1.getTextEditForAddImport('bytes');
                const edit = new vscode.WorkspaceEdit();
                edit.set(document.uri, edits);
                return vscode.workspace.applyEdit(edit).then(() => {
                    assert.equal(vscode.window.activeTextEditor.document.getText(), expectedText);
                    return Promise.resolve();
                });
            });
        }).then(() => done(), done);
    });
    test('Add imports to an import block', (done) => {
        let uri = vscode.Uri.file(path.join(fixturePath, 'importTest', 'groupImports.go'));
        vscode.workspace.openTextDocument(uri).then(document => {
            return vscode.window.showTextDocument(document).then(editor => {
                const expectedText = document.getText().replace('\t"fmt"\n\t"math"', '\t"bytes"\n\t"fmt"\n\t"math"');
                const edits = goImport_1.getTextEditForAddImport('bytes');
                const edit = new vscode.WorkspaceEdit();
                edit.set(document.uri, edits);
                return vscode.workspace.applyEdit(edit).then(() => {
                    assert.equal(vscode.window.activeTextEditor.document.getText(), expectedText);
                    return Promise.resolve();
                });
            });
        }).then(() => done(), done);
    });
    test('Add imports and collapse single imports to an import block', (done) => {
        let uri = vscode.Uri.file(path.join(fixturePath, 'importTest', 'singleImports.go'));
        vscode.workspace.openTextDocument(uri).then(document => {
            return vscode.window.showTextDocument(document).then(editor => {
                const expectedText = document.getText().replace('import "fmt"\nimport . "math" // comment', 'import (\n\t"bytes"\n\t"fmt"\n\t. "math" // comment\n)');
                const edits = goImport_1.getTextEditForAddImport('bytes');
                const edit = new vscode.WorkspaceEdit();
                edit.set(document.uri, edits);
                return vscode.workspace.applyEdit(edit).then(() => {
                    assert.equal(vscode.window.activeTextEditor.document.getText(), expectedText);
                    return Promise.resolve();
                });
            });
        }).then(() => done(), done);
    });
    test('Fill struct', (done) => {
        let uri = vscode.Uri.file(path.join(fixturePath, 'fillStruct', 'input_1.go'));
        let golden = fs.readFileSync(path.join(fixturePath, 'fillStruct', 'golden_1.go'), 'utf-8');
        vscode.workspace.openTextDocument(uri).then((textDocument) => {
            return vscode.window.showTextDocument(textDocument).then(editor => {
                let selection = new vscode.Selection(12, 15, 12, 15);
                editor.selection = selection;
                return goFillStruct_1.runFillStruct(editor).then(() => {
                    assert.equal(vscode.window.activeTextEditor.document.getText(), golden);
                    return Promise.resolve();
                });
            });
        }).then(() => done(), done);
    });
    test('Fill struct - select line', (done) => {
        let uri = vscode.Uri.file(path.join(fixturePath, 'fillStruct', 'input_2.go'));
        let golden = fs.readFileSync(path.join(fixturePath, 'fillStruct', 'golden_2.go'), 'utf-8');
        vscode.workspace.openTextDocument(uri).then((textDocument) => {
            return vscode.window.showTextDocument(textDocument).then(editor => {
                let selection = new vscode.Selection(7, 0, 7, 10);
                editor.selection = selection;
                return goFillStruct_1.runFillStruct(editor).then(() => {
                    assert.equal(vscode.window.activeTextEditor.document.getText(), golden);
                    return Promise.resolve();
                });
            });
        }).then(() => done(), done);
    });
});
//# sourceMappingURL=go.test.js.map