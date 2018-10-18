'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// (c) 2016-2017 Ecmel Ercan
const vsc = require("vscode");
const lst = require("vscode-languageserver-types");
const css = require("vscode-css-languageservice");
const fs = require("fs");
const path = require("path");
const request = require('request');
let service = css.getCSSLanguageService();
let map = {};
let regex = /[\.\#]([\w-]+)/g;
let dot = vsc.CompletionItemKind.Class;
let hash = vsc.CompletionItemKind.Reference;
class Snippet {
    constructor(content, character) {
        this._document = lst.TextDocument.create('', 'css', 1, content);
        this._stylesheet = service.parseStylesheet(this._document);
        this._position = new vsc.Position(this._document.lineCount - 1, character ? character : 0);
    }
    get document() {
        return this._document;
    }
    get stylesheet() {
        return this._stylesheet;
    }
    get position() {
        return this._position;
    }
}
class ClassServer {
    constructor() {
        this.regex = [
            /(class|id|className)=["|']([^"^']*$)/i,
            /(\.|\#)[^\s]*$/i,
            /<style[\s\S]*>([\s\S]*)<\/style>/ig
        ];
    }
    provideCompletionItems(document, position, token) {
        let start = new vsc.Position(0, 0);
        let range = new vsc.Range(start, position);
        let text = document.getText(range);
        let tag = this.regex[0].exec(text);
        if (!tag) {
            const textList = text.split('\n');
            const finalLineText = textList.length > 0 ? textList[textList.length - 1] : false;
            if (finalLineText) {
                tag = this.regex[1].exec(finalLineText);
            }
        }
        if (tag) {
            let internal = [];
            let style;
            while (style = this.regex[2].exec(document.getText())) {
                let snippet = new Snippet(style[1]);
                let symbols = service.findDocumentSymbols(snippet.document, snippet.stylesheet);
                for (let symbol of symbols) {
                    internal.push(symbol);
                }
            }
            pushSymbols('style', internal);
            let items = {};
            for (let key in map) {
                for (let item of map[key]) {
                    items[item.label] = item;
                }
            }
            let id = tag[0].startsWith('id') || tag[0].startsWith('#');
            let ci = [];
            for (let item in items) {
                if ((id && items[item].kind === hash) || !id && items[item].kind === dot) {
                    ci.push(items[item]);
                }
            }
            return new vsc.CompletionList(ci);
        }
        return null;
    }
    resolveCompletionItem(item, token) {
        return null;
    }
}
function pushSymbols(key, symbols) {
    let ci = [];
    for (let i = 0; i < symbols.length; i++) {
        if (symbols[i].kind !== 5) {
            continue;
        }
        let symbol;
        while (symbol = regex.exec(symbols[i].name)) {
            let item = new vsc.CompletionItem(symbol[1]);
            item.kind = symbol[0].startsWith('.') ? dot : hash;
            item.detail = path.basename(key);
            ci.push(item);
        }
    }
    map[key] = ci;
}
function parse(uri) {
    fs.readFile(uri.fsPath, 'utf8', function (err, data) {
        if (err) {
            delete map[uri.fsPath];
        }
        else {
            let doc = lst.TextDocument.create(uri.fsPath, 'css', 1, data);
            let symbols = service.findDocumentSymbols(doc, service.parseStylesheet(doc));
            pushSymbols(uri.fsPath, symbols);
        }
    });
}
function parseRemote(url) {
    request(url, (err, response, body) => {
        if (body.length > 0) {
            let doc = lst.TextDocument.create(url, 'css', 1, body);
            let symbols = service.findDocumentSymbols(doc, service.parseStylesheet(doc));
            pushSymbols(url, symbols);
        }
    });
}
function parseRemoteConfig() {
    let remoteCssConfig = vsc.workspace.getConfiguration('css');
    let urls = remoteCssConfig.get('remoteStyleSheets');
    urls.forEach((url) => parseRemote(url));
}
function activate(context) {
    if (vsc.workspace.workspaceFolders) {
        const remoteCssConfig = vsc.workspace.getConfiguration('css');
        const extensions = remoteCssConfig.get('fileExtensions');
        extensions.forEach(ext => {
            const glob = `**/*.${ext}`;
            vsc.workspace.findFiles(glob, '').then(function (uris) {
                for (let i = 0; i < uris.length; i++) {
                    parse(uris[i]);
                }
            });
            let watcher = vsc.workspace.createFileSystemWatcher(glob);
            watcher.onDidCreate(function (uri) {
                parse(uri);
            });
            watcher.onDidChange(function (uri) {
                parse(uri);
            });
            watcher.onDidDelete(function (uri) {
                delete map[uri.fsPath];
            });
            context.subscriptions.push(watcher);
        });
        parseRemoteConfig();
    }
    ;
    let classServer = new ClassServer();
    context.subscriptions.push(vsc.languages.registerCompletionItemProvider([
        'html',
        'laravel-blade',
        'razor',
        'vue',
        'blade',
        'pug',
        'jade',
        'handlebars',
        'php',
        'twig',
        'md',
        'nunjucks',
        'javascript',
        'javascriptreact',
        'erb'
    ], classServer));
    let wp = /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\.\"\,\<\>\/\?\s]+)/g;
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('laravel-blade', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('razor', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('vue', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('blade', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('pug', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('jade', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('handlebars', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('php', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('twig', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('md', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('nunjucks', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('javascript', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('javascriptreact', { wordPattern: wp }));
    context.subscriptions.push(vsc.languages.setLanguageConfiguration('erb', { wordPattern: wp }));
    context.subscriptions.push(vsc.workspace.onDidChangeConfiguration((e) => parseRemoteConfig()));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map