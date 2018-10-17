/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const os = require("os");
const fs = require("fs");
const testUtils_1 = require("./testUtils");
const rl = require("readline");
let gutters;
let coverageFiles = {};
function clearCoverage() {
    applyCoverage(true);
    coverageFiles = {};
}
function setCoverageFile(filename, data) {
    if (filename.startsWith('_')) {
        filename = filename.substr(1);
    }
    if (process.platform === 'win32') {
        const parts = filename.split('/');
        if (parts.length) {
            filename = parts.join(path.sep);
        }
    }
    coverageFiles[filename] = data;
}
function initGoCover(ctx) {
    gutters = {
        blockred: ctx.asAbsolutePath('images/gutter-blockred.svg'),
        blockgreen: ctx.asAbsolutePath('images/gutter-blockgreen.svg'),
        blockblue: ctx.asAbsolutePath('images/gutter-blockblue.svg'),
        blockyellow: ctx.asAbsolutePath('images/gutter-blockyellow.svg'),
        slashred: ctx.asAbsolutePath('images/gutter-slashred.svg'),
        slashgreen: ctx.asAbsolutePath('images/gutter-slashgreen.svg'),
        slashblue: ctx.asAbsolutePath('images/gutter-slashblue.svg'),
        slashyellow: ctx.asAbsolutePath('images/gutter-slashyellow.svg'),
        verticalred: ctx.asAbsolutePath('images/gutter-vertred.svg'),
        verticalgreen: ctx.asAbsolutePath('images/gutter-vertgreen.svg'),
        verticalblue: ctx.asAbsolutePath('images/gutter-vertblue.svg'),
        verticalyellow: ctx.asAbsolutePath('images/gutter-vertyellow.svg')
    };
    const goConfig = vscode.workspace.getConfiguration('go');
    const inspectResult = goConfig.inspect('coverageDecorator');
    if (typeof inspectResult.globalValue === 'string') {
        goConfig.update('coverageDecorator', { type: inspectResult.globalValue }, vscode.ConfigurationTarget.Global);
    }
    if (typeof inspectResult.workspaceValue === 'string') {
        goConfig.update('coverageDecorator', { type: inspectResult.workspaceValue }, vscode.ConfigurationTarget.Workspace);
    }
}
exports.initGoCover = initGoCover;
function removeCodeCoverage(e) {
    let editor = vscode.window.visibleTextEditors.find((value, index, obj) => {
        return value.document === e.document;
    });
    if (!editor) {
        return;
    }
    for (let filename in coverageFiles) {
        let found = editor.document.uri.fsPath.endsWith(filename);
        if (found) {
            highlightCoverage(editor, coverageFiles[filename], true);
            delete coverageFiles[filename];
        }
    }
}
exports.removeCodeCoverage = removeCodeCoverage;
function toggleCoverageCurrentPackage() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    // If current file has highlights, then remove coverage, else add coverage
    for (let filename in coverageFiles) {
        let found = editor.document.uri.fsPath.endsWith(filename);
        if (found) {
            clearCoverage();
            return;
        }
    }
    let goConfig = vscode.workspace.getConfiguration('go', editor.document.uri);
    let cwd = path.dirname(editor.document.uri.fsPath);
    let buildFlags = goConfig['testFlags'] || goConfig['buildFlags'] || [];
    let tmpCoverPath = path.normalize(path.join(os.tmpdir(), 'go-code-cover'));
    let args = ['-coverprofile=' + tmpCoverPath, ...buildFlags];
    return testUtils_1.goTest({
        goConfig: goConfig,
        dir: cwd,
        flags: args,
        background: true
    }).then(success => {
        if (!success) {
            testUtils_1.showTestOutput();
            return [];
        }
        return getCoverage(tmpCoverPath, true);
    });
}
exports.toggleCoverageCurrentPackage = toggleCoverageCurrentPackage;
function getCodeCoverage(editor) {
    if (!editor) {
        return;
    }
    for (let filename in coverageFiles) {
        if (editor.document.uri.fsPath.endsWith(filename)) {
            highlightCoverage(editor, coverageFiles[filename], false);
        }
    }
}
exports.getCodeCoverage = getCodeCoverage;
function applyCoverage(remove = false) {
    Object.keys(coverageFiles).forEach(filename => {
        let file = coverageFiles[filename];
        // Highlight lines in current editor.
        vscode.window.visibleTextEditors.forEach((value, index, obj) => {
            let found = value.document.fileName.endsWith(filename);
            if (found) {
                highlightCoverage(value, file, remove);
            }
            return found;
        });
    });
}
let decorators;
// updateCoverageDecorator fetches the value of the go.coverageDecorator
// setting; historical values may be simply the string 'highlight' or
// 'gutter' so we want to have sensible defaults for those (and if it's a
// string but not one of those strings we just return the highlight default)
//
// However, modern versions should have an object with appropriate fields,
// so if it's not a string we just make sure we have all the fields we need.
function updateCoverageDecorator(cfg) {
    // These defaults are chosen to be distinguishable
    // in nearly any color scheme (even Red) as well as by people
    // who have difficulties with color perception. There are also
    // enough options that everyone (we hope) should be able to
    // find a choice that pleases them.
    let defaults = {
        type: 'highlight',
        coveredHighlightColor: 'rgba(64,128,128,0.5)',
        uncoveredHighlightColor: 'rgba(128,64,64,0.25)',
        coveredGutterStyle: 'blockblue',
        uncoveredGutterStyle: 'slashyellow'
    };
    let coverageDecorator = cfg['coverageDecorator'];
    if (typeof (coverageDecorator) === 'string') {
        defaults.type = coverageDecorator;
    }
    else {
        // look at all the values in coverageDecorator and overwrite the
        // equivalent in defaults (this way coverageDecorator overrides
        // every default but the result will still have all required fields).
        for (let k in coverageDecorator) {
            defaults[k] = coverageDecorator[k];
        }
    }
    if (decorators) {
        decorators.coveredGutterDecorator.dispose();
        decorators.uncoveredGutterDecorator.dispose();
        decorators.coveredHighlightDecorator.dispose();
        decorators.uncoveredHighlightDecorator.dispose();
    }
    // before we're done, we need to turn these names into actual decorations
    decorators = {
        type: defaults.type,
        coveredGutterDecorator: vscode.window.createTextEditorDecorationType({ gutterIconPath: gutters[defaults.coveredGutterStyle] }),
        uncoveredGutterDecorator: vscode.window.createTextEditorDecorationType({ gutterIconPath: gutters[defaults.uncoveredGutterStyle] }),
        coveredHighlightDecorator: vscode.window.createTextEditorDecorationType({ backgroundColor: defaults.coveredHighlightColor }),
        uncoveredHighlightDecorator: vscode.window.createTextEditorDecorationType({ backgroundColor: defaults.uncoveredHighlightColor })
    };
}
function highlightCoverage(editor, file, remove) {
    let cfg = vscode.workspace.getConfiguration('go', editor.document.uri);
    let coverageOptions = cfg['coverageOptions'];
    updateCoverageDecorator(cfg);
    if (remove) {
        return;
    }
    if (coverageOptions === 'showCoveredCodeOnly' || coverageOptions === 'showBothCoveredAndUncoveredCode') {
        editor.setDecorations(decorators.type === 'gutter' ? decorators.coveredGutterDecorator : decorators.coveredHighlightDecorator, file.coveredRange);
    }
    if (coverageOptions === 'showUncoveredCodeOnly' || coverageOptions === 'showBothCoveredAndUncoveredCode') {
        editor.setDecorations(decorators.type === 'gutter' ? decorators.uncoveredGutterDecorator : decorators.uncoveredHighlightDecorator, file.uncoveredRange);
    }
}
function getCoverage(coverProfilePath, showErrOutput = false) {
    return new Promise((resolve, reject) => {
        try {
            // Clear existing coverage files
            clearCoverage();
            let lines = rl.createInterface({
                input: fs.createReadStream(coverProfilePath),
                output: undefined
            });
            lines.on('line', function (data) {
                // go test coverageprofile generates output:
                //    filename:StartLine.StartColumn,EndLine.EndColumn Hits CoverCount
                // The first line will be "mode: set" which will be ignored
                let fileRange = data.match(/([^:]+)\:([\d]+)\.([\d]+)\,([\d]+)\.([\d]+)\s([\d]+)\s([\d]+)/);
                if (!fileRange)
                    return;
                let coverage = coverageFiles[fileRange[1]] || { coveredRange: [], uncoveredRange: [] };
                let range = new vscode.Range(
                // Start Line converted to zero based
                parseInt(fileRange[2]) - 1, 
                // Start Column converted to zero based
                parseInt(fileRange[3]) - 1, 
                // End Line converted to zero based
                parseInt(fileRange[4]) - 1, 
                // End Column converted to zero based
                parseInt(fileRange[5]) - 1);
                // If is Covered (CoverCount > 0)
                if (parseInt(fileRange[7]) > 0) {
                    coverage.coveredRange.push({ range });
                }
                // Not Covered
                else {
                    coverage.uncoveredRange.push({ range });
                }
                setCoverageFile(fileRange[1], coverage);
            });
            lines.on('close', function (data) {
                applyCoverage();
                resolve([]);
            });
        }
        catch (e) {
            vscode.window.showInformationMessage(e.msg);
            reject(e);
        }
    });
}
exports.getCoverage = getCoverage;
//# sourceMappingURL=goCover.js.map