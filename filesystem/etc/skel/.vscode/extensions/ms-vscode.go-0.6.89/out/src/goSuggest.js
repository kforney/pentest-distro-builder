/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const cp = require("child_process");
const util_1 = require("./util");
const goPath_1 = require("./goPath");
const goInstallTools_1 = require("./goInstallTools");
const goImport_1 = require("./goImport");
const goPackages_1 = require("./goPackages");
function vscodeKindFromGoCodeClass(kind) {
    switch (kind) {
        case 'const':
            return vscode.CompletionItemKind.Constant;
        case 'package':
            return vscode.CompletionItemKind.Module;
        case 'type':
            return vscode.CompletionItemKind.Class;
        case 'func':
            return vscode.CompletionItemKind.Function;
        case 'var':
            return vscode.CompletionItemKind.Variable;
        case 'import':
            return vscode.CompletionItemKind.Module;
    }
    return vscode.CompletionItemKind.Property; // TODO@EG additional mappings needed?
}
const lineCommentRegex = /^\s*\/\/\s+/;
const exportedMemberRegex = /(const|func|type|var)(\s+\(.*\))?\s+([A-Z]\w*)/;
const gocodeNoSupportForgbMsgKey = 'dontshowNoSupportForgb';
class GoCompletionItemProvider {
    constructor(globalState) {
        this.pkgsList = new Map();
        this.killMsgShown = false;
        this.setGocodeOptions = true;
        this.globalState = globalState;
    }
    provideCompletionItems(document, position, token) {
        return this.provideCompletionItemsInternal(document, position, token, vscode.workspace.getConfiguration('go', document.uri));
    }
    provideCompletionItemsInternal(document, position, token, config) {
        return this.ensureGoCodeConfigured().then(() => {
            return new Promise((resolve, reject) => {
                let filename = document.fileName;
                let lineText = document.lineAt(position.line).text;
                let lineTillCurrentPosition = lineText.substr(0, position.character);
                let autocompleteUnimportedPackages = config['autocompleteUnimportedPackages'] === true && !lineText.match(/^(\s)*(import|package)(\s)+/);
                // triggering completions in comments on exported members
                if (lineCommentRegex.test(lineTillCurrentPosition) && position.line + 1 < document.lineCount) {
                    let nextLine = document.lineAt(position.line + 1).text.trim();
                    let memberType = nextLine.match(exportedMemberRegex);
                    let suggestionItem;
                    if (memberType && memberType.length === 4) {
                        suggestionItem = new vscode.CompletionItem(memberType[3], vscodeKindFromGoCodeClass(memberType[1]));
                    }
                    return resolve(suggestionItem ? [suggestionItem] : []);
                }
                // prevent completion when typing in a line comment that doesnt start from the beginning of the line
                const commentIndex = lineText.indexOf('//');
                if (commentIndex >= 0 && position.character > commentIndex) {
                    return resolve([]);
                }
                let inString = util_1.isPositionInString(document, position);
                if (!inString && lineTillCurrentPosition.endsWith('\"')) {
                    return resolve([]);
                }
                // get current word
                let wordAtPosition = document.getWordRangeAtPosition(position);
                let currentWord = '';
                if (wordAtPosition && wordAtPosition.start.character < position.character) {
                    let word = document.getText(wordAtPosition);
                    currentWord = word.substr(0, position.character - wordAtPosition.start.character);
                }
                if (currentWord.match(/^\d+$/)) {
                    return resolve([]);
                }
                let offset = util_1.byteOffsetAt(document, position);
                let inputText = document.getText();
                let includeUnimportedPkgs = autocompleteUnimportedPackages && !inString;
                return this.runGoCode(document, filename, inputText, offset, inString, position, lineText, currentWord, includeUnimportedPkgs, config).then(suggestions => {
                    // gocode does not suggest keywords, so we have to do it
                    if (currentWord.length > 0) {
                        util_1.goKeywords.forEach(keyword => {
                            if (keyword.startsWith(currentWord)) {
                                suggestions.push(new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword));
                            }
                        });
                    }
                    // If no suggestions and cursor is at a dot, then check if preceeding word is a package name
                    // If yes, then import the package in the inputText and run gocode again to get suggestions
                    if (suggestions.length === 0 && lineTillCurrentPosition.endsWith('.')) {
                        let pkgPath = this.getPackagePathFromLine(lineTillCurrentPosition);
                        if (pkgPath) {
                            // Now that we have the package path, import it right after the "package" statement
                            let { imports, pkg } = util_1.parseFilePrelude(vscode.window.activeTextEditor.document.getText());
                            let posToAddImport = document.offsetAt(new vscode.Position(pkg.start + 1, 0));
                            let textToAdd = `import "${pkgPath}"\n`;
                            inputText = inputText.substr(0, posToAddImport) + textToAdd + inputText.substr(posToAddImport);
                            offset += textToAdd.length;
                            // Now that we have the package imported in the inputText, run gocode again
                            return this.runGoCode(document, filename, inputText, offset, inString, position, lineText, currentWord, false, config).then(newsuggestions => {
                                // Since the new suggestions are due to the package that we imported,
                                // add additionalTextEdits to do the same in the actual document in the editor
                                // We use additionalTextEdits instead of command so that 'useCodeSnippetsOnFunctionSuggest' feature continues to work
                                newsuggestions.forEach(item => {
                                    item.additionalTextEdits = goImport_1.getTextEditForAddImport(pkgPath);
                                });
                                resolve(newsuggestions);
                            }, reject);
                        }
                    }
                    resolve(suggestions);
                }, reject);
            });
        });
    }
    runGoCode(document, filename, inputText, offset, inString, position, lineText, currentWord, includeUnimportedPkgs, config) {
        return new Promise((resolve, reject) => {
            let gocode = util_1.getBinPath('gocode');
            if (!path.isAbsolute(gocode)) {
                goInstallTools_1.promptForMissingTool(gocode);
                return reject();
            }
            // Unset GOOS and GOARCH for the `gocode` process to ensure that GOHOSTOS and GOHOSTARCH
            // are used as the target operating system and architecture. `gocode` is unable to provide
            // autocompletion when the Go environment is configured for cross compilation.
            let env = Object.assign({}, util_1.getToolsEnvVars(), { GOOS: '', GOARCH: '' });
            let stdout = '';
            let stderr = '';
            let goCodeFlags = ['-f=json'];
            if (!this.setGocodeOptions) {
                goCodeFlags.push('-builtin');
            }
            // Spawn `gocode` process
            let p = cp.spawn(gocode, [...goCodeFlags, 'autocomplete', filename, '' + offset], { env });
            p.stdout.on('data', data => stdout += data);
            p.stderr.on('data', data => stderr += data);
            p.on('error', err => {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('gocode');
                    return reject();
                }
                return reject(err);
            });
            p.on('close', code => {
                try {
                    if (code !== 0) {
                        if (stderr.indexOf('rpc: can\'t find service Server.AutoComplete') > -1 && !this.killMsgShown) {
                            vscode.window.showErrorMessage('Auto-completion feature failed as an older gocode process is still running. Please kill the running process for gocode and try again.');
                            this.killMsgShown = true;
                        }
                        if (stderr.startsWith('flag provided but not defined:')) {
                            goInstallTools_1.promptForUpdatingTool('gocode');
                        }
                        return reject();
                    }
                    let results = JSON.parse(stdout.toString());
                    let suggestions = [];
                    let suggestionSet = new Set();
                    let wordAtPosition = document.getWordRangeAtPosition(position);
                    if (results && results[1]) {
                        for (let suggest of results[1]) {
                            if (inString && suggest.class !== 'import')
                                continue;
                            let item = new vscode.CompletionItem(suggest.name);
                            item.kind = vscodeKindFromGoCodeClass(suggest.class);
                            item.detail = suggest.type;
                            if (inString && suggest.class === 'import') {
                                item.textEdit = new vscode.TextEdit(new vscode.Range(position.line, lineText.substring(0, position.character).lastIndexOf('"') + 1, position.line, position.character), suggest.name);
                            }
                            if ((config['useCodeSnippetsOnFunctionSuggest'] || config['useCodeSnippetsOnFunctionSuggestWithoutType'])
                                && ((suggest.class === 'func' && lineText.substr(position.character, 2) !== '()') // Avoids met() -> method()()
                                    || (suggest.class === 'var'
                                        && suggest.type.startsWith('func(')
                                        && lineText.substr(position.character, 1) !== ')' // Avoids snippets when typing params in a func call
                                        && lineText.substr(position.character, 1) !== ',' // Avoids snippets when typing params in a func call
                                    ))) {
                                let { params, returnType } = util_1.getParametersAndReturnType(suggest.type.substring(4));
                                let paramSnippets = [];
                                for (let i = 0; i < params.length; i++) {
                                    let param = params[i].trim();
                                    if (param) {
                                        param = param.replace('${', '\\${').replace('}', '\\}');
                                        if (config['useCodeSnippetsOnFunctionSuggestWithoutType']) {
                                            if (param.includes(' ')) {
                                                // Separate the variable name from the type
                                                param = param.substr(0, param.indexOf(' '));
                                            }
                                        }
                                        paramSnippets.push('${' + (i + 1) + ':' + param + '}');
                                    }
                                }
                                item.insertText = new vscode.SnippetString(suggest.name + '(' + paramSnippets.join(', ') + ')');
                            }
                            if (config['useCodeSnippetsOnFunctionSuggest'] && suggest.class === 'type' && suggest.type.startsWith('func(')) {
                                let { params, returnType } = util_1.getParametersAndReturnType(suggest.type.substring(4));
                                let paramSnippets = [];
                                for (let i = 0; i < params.length; i++) {
                                    let param = params[i].trim();
                                    if (param) {
                                        param = param.replace('${', '\\${').replace('}', '\\}');
                                        if (!param.includes(' ')) {
                                            // If we don't have an argument name, we need to create one
                                            param = 'arg' + (i + 1) + ' ' + param;
                                        }
                                        let arg = param.substr(0, param.indexOf(' '));
                                        paramSnippets.push('${' + (i + 1) + ':' + arg + '}' + param.substr(param.indexOf(' '), param.length));
                                    }
                                }
                                item.insertText = new vscode.SnippetString(suggest.name + '(func(' + paramSnippets.join(', ') + ') {\n	$' + (params.length + 1) + '\n})' + returnType);
                            }
                            if (wordAtPosition && wordAtPosition.start.character === 0 &&
                                suggest.class === 'type' && !util_1.goBuiltinTypes.has(suggest.name)) {
                                let auxItem = new vscode.CompletionItem(suggest.name + ' method', vscode.CompletionItemKind.Snippet);
                                auxItem.label = 'func (*' + suggest.name + ')';
                                auxItem.filterText = suggest.name;
                                auxItem.detail = 'Method snippet';
                                auxItem.sortText = 'b';
                                let prefix = 'func (' + suggest.name[0].toLowerCase() + ' *' + suggest.name + ')';
                                let snippet = prefix + ' ${1:methodName}(${2}) ${3} \{\n\t$0\n\}';
                                auxItem.insertText = new vscode.SnippetString(snippet);
                                suggestions.push(auxItem);
                            }
                            // Add same sortText to all suggestions from gocode so that they appear before the unimported packages
                            item.sortText = 'a';
                            suggestions.push(item);
                            suggestionSet.add(item.label);
                        }
                        ;
                    }
                    // Add importable packages matching currentword to suggestions
                    let importablePkgs = includeUnimportedPkgs ? this.getMatchingPackages(document, currentWord, suggestionSet) : [];
                    suggestions = suggestions.concat(importablePkgs);
                    // 'Smart Snippet' for package clause
                    // TODO: Factor this out into a general mechanism
                    if (!inputText.match(/package\s+(\w+)/)) {
                        return util_1.guessPackageNameFromFile(filename).then((pkgNames) => {
                            pkgNames.forEach(pkgName => {
                                let packageItem = new vscode.CompletionItem('package ' + pkgName);
                                packageItem.kind = vscode.CompletionItemKind.Snippet;
                                packageItem.insertText = 'package ' + pkgName + '\r\n\r\n';
                                suggestions.push(packageItem);
                            });
                            resolve(suggestions);
                        }, () => resolve(suggestions));
                    }
                    resolve(suggestions);
                }
                catch (e) {
                    reject(e);
                }
            });
            if (p.pid) {
                p.stdin.end(inputText);
            }
        });
    }
    // TODO: Shouldn't lib-path also be set?
    ensureGoCodeConfigured() {
        let setPkgsList = goPackages_1.getImportablePackages(vscode.window.activeTextEditor.document.fileName, true).then(pkgMap => { this.pkgsList = pkgMap; });
        if (!this.setGocodeOptions) {
            return setPkgsList;
        }
        let setGocodeProps = new Promise((resolve, reject) => {
            let gocode = util_1.getBinPath('gocode');
            let goConfig = vscode.workspace.getConfiguration('go', vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : null);
            let env = util_1.getToolsEnvVars();
            cp.execFile(gocode, ['set'], { env }, (err, stdout, stderr) => {
                if (err && stdout.startsWith('gocode: unknown subcommand:')) {
                    if (goConfig['gocodePackageLookupMode'] === 'gb' && this.globalState && !this.globalState.get(gocodeNoSupportForgbMsgKey)) {
                        vscode.window.showInformationMessage('The go.gocodePackageLookupMode setting for gb will not be honored as github.com/mdempskey/gocode doesnt support it yet.', 'Don\'t show again').then(selected => {
                            if (selected === 'Don\'t show again') {
                                this.globalState.update(gocodeNoSupportForgbMsgKey, true);
                            }
                        });
                    }
                    this.setGocodeOptions = false;
                    return resolve();
                }
                const existingOptions = stdout.split(/\r\n|\n/);
                const optionsToSet = [];
                const setOption = () => {
                    const [name, value] = optionsToSet.pop();
                    cp.execFile(gocode, ['set', name, value], { env }, (err, stdout, stderr) => {
                        if (optionsToSet.length) {
                            setOption();
                        }
                        else {
                            resolve();
                        }
                    });
                };
                if (existingOptions.indexOf('propose-builtins true') === -1) {
                    optionsToSet.push(['propose-builtins', 'true']);
                }
                if (existingOptions.indexOf(`autobuild ${goConfig['gocodeAutoBuild']}`) === -1) {
                    optionsToSet.push(['autobuild', goConfig['gocodeAutoBuild']]);
                }
                if (existingOptions.indexOf(`package-lookup-mode ${goConfig['gocodePackageLookupMode']}`) === -1) {
                    optionsToSet.push(['package-lookup-mode', goConfig['gocodePackageLookupMode']]);
                }
                if (!optionsToSet.length) {
                    return resolve();
                }
                setOption();
            });
        });
        return Promise.all([setPkgsList, setGocodeProps]).then(() => {
            return;
        });
    }
    // Return importable packages that match given word as Completion Items
    getMatchingPackages(document, word, suggestionSet) {
        if (!word)
            return [];
        const cwd = path.dirname(document.fileName);
        const goWorkSpace = goPath_1.getCurrentGoWorkspaceFromGOPATH(util_1.getCurrentGoPath(), cwd);
        const workSpaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        const currentPkgRootPath = (workSpaceFolder ? workSpaceFolder.uri.path : cwd).slice(goWorkSpace.length + 1);
        let completionItems = [];
        this.pkgsList.forEach((pkgName, pkgPath) => {
            if (pkgName.startsWith(word) && !suggestionSet.has(pkgName)) {
                let item = new vscode.CompletionItem(pkgName, vscode.CompletionItemKind.Keyword);
                item.detail = pkgPath;
                item.documentation = 'Imports the package';
                item.insertText = pkgName;
                item.command = {
                    title: 'Import Package',
                    command: 'go.import.add',
                    arguments: [pkgPath]
                };
                item.kind = vscode.CompletionItemKind.Module;
                // Unimported packages should appear after the suggestions from gocode
                const isStandardPackage = !item.detail.includes('.');
                item.sortText = isStandardPackage ? 'za' : pkgPath.startsWith(currentPkgRootPath) ? 'zb' : 'zc';
                completionItems.push(item);
            }
        });
        return completionItems;
    }
    // Given a line ending with dot, return the word preceeding the dot if it is a package name that can be imported
    getPackagePathFromLine(line) {
        let pattern = /(\w+)\.$/g;
        let wordmatches = pattern.exec(line);
        if (!wordmatches) {
            return;
        }
        let [_, pkgNameFromWord] = wordmatches;
        // Word is isolated. Now check pkgsList for a match
        let matchingPackages = [];
        this.pkgsList.forEach((pkgName, pkgPath) => {
            if (pkgNameFromWord === pkgName) {
                matchingPackages.push(pkgPath);
            }
        });
        if (matchingPackages && matchingPackages.length === 1) {
            return matchingPackages[0];
        }
    }
}
exports.GoCompletionItemProvider = GoCompletionItemProvider;
//# sourceMappingURL=goSuggest.js.map