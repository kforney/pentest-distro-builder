"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
class CustomViewsFeature {
    constructor() {
        this.commands = [];
        this.contentProvider = new PowerShellContentProvider();
        this.commands.push(vscode.workspace.registerTextDocumentContentProvider("powershell", this.contentProvider));
    }
    dispose() {
        this.commands.forEach((d) => d.dispose());
    }
    setLanguageClient(languageClient) {
        languageClient.onRequest(exports.NewCustomViewRequestType, (args) => {
            this.contentProvider.createView(args.id, args.title, args.viewType);
        });
        languageClient.onRequest(exports.ShowCustomViewRequestType, (args) => {
            this.contentProvider.showView(args.id, args.viewColumn);
        });
        languageClient.onRequest(exports.CloseCustomViewRequestType, (args) => {
            this.contentProvider.closeView(args.id);
        });
        languageClient.onRequest(exports.SetHtmlContentViewRequestType, (args) => {
            this.contentProvider.setHtmlContentView(args.id, args.htmlContent);
        });
        languageClient.onRequest(exports.AppendHtmlOutputViewRequestType, (args) => {
            this.contentProvider.appendHtmlOutputView(args.id, args.appendedHtmlBodyContent);
        });
        this.languageClient = languageClient;
    }
}
exports.CustomViewsFeature = CustomViewsFeature;
class PowerShellContentProvider {
    constructor() {
        this.count = 1;
        this.viewIndex = {};
        this.didChangeEvent = new vscode.EventEmitter();
        // tslint:disable-next-line:member-ordering
        this.onDidChange = this.didChangeEvent.event;
    }
    provideTextDocumentContent(uri) {
        return this.viewIndex[uri.toString()].getContent();
    }
    createView(id, title, viewType) {
        let view;
        switch (viewType) {
            case CustomViewType.HtmlContent:
                view = new HtmlContentView(id, title);
        }
        this.viewIndex[this.getUri(view.id)] = view;
    }
    showView(id, viewColumn) {
        const uriString = this.getUri(id);
        const view = this.viewIndex[uriString];
        vscode.commands.executeCommand("vscode.previewHtml", uriString, viewColumn, view.title);
    }
    closeView(id) {
        const uriString = this.getUri(id);
        const view = this.viewIndex[uriString];
        vscode.workspace.textDocuments.some((doc) => {
            if (doc.uri.toString() === uriString) {
                vscode.window
                    .showTextDocument(doc)
                    .then((editor) => vscode.commands.executeCommand("workbench.action.closeActiveEditor"));
                return true;
            }
            return false;
        });
    }
    setHtmlContentView(id, content) {
        const uriString = this.getUri(id);
        const view = this.viewIndex[uriString];
        if (view.viewType === CustomViewType.HtmlContent) {
            view.setContent(content);
            this.didChangeEvent.fire(vscode.Uri.parse(uriString));
        }
    }
    appendHtmlOutputView(id, content) {
        const uriString = this.getUri(id);
        const view = this.viewIndex[uriString];
        if (view.viewType === CustomViewType.HtmlContent) {
            view.appendContent(content);
            this.didChangeEvent.fire(vscode.Uri.parse(uriString));
        }
    }
    getUri(id) {
        return `powershell://views/${id}`;
    }
}
class CustomView {
    constructor(id, title, viewType) {
        this.id = id;
        this.title = title;
        this.viewType = viewType;
    }
}
class HtmlContentView extends CustomView {
    constructor(id, title) {
        super(id, title, CustomViewType.HtmlContent);
        this.htmlContent = {
            bodyContent: "",
            javaScriptPaths: [],
            styleSheetPaths: [],
        };
    }
    setContent(htmlContent) {
        this.htmlContent = htmlContent;
    }
    appendContent(content) {
        this.htmlContent.bodyContent += content;
    }
    getContent() {
        let styleSrc = "none";
        let styleTags = "";
        function getNonce() {
            return Math.floor(Math.random() * 100000) + 100000;
        }
        if (this.htmlContent.styleSheetPaths &&
            this.htmlContent.styleSheetPaths.length > 0) {
            styleSrc = "";
            this.htmlContent.styleSheetPaths.forEach((p) => {
                const nonce = getNonce();
                styleSrc += `'nonce-${nonce}' `;
                styleTags += `<link nonce="${nonce}" href="${p}" rel="stylesheet" type="text/css" />\n`;
            });
        }
        let scriptSrc = "none";
        let scriptTags = "";
        if (this.htmlContent.javaScriptPaths &&
            this.htmlContent.javaScriptPaths.length > 0) {
            scriptSrc = "";
            this.htmlContent.javaScriptPaths.forEach((p) => {
                const nonce = getNonce();
                scriptSrc += `'nonce-${nonce}' `;
                scriptTags += `<script nonce="${nonce}" src="${p}"></script>\n`;
            });
        }
        // Return an HTML page with the specified content
        return `<html><head><meta http-equiv="Content-Security-Policy" ` +
            `content="default-src 'none'; img-src *; style-src ${styleSrc}; script-src ${scriptSrc};">` +
            `${styleTags}</head><body>\n${this.htmlContent.bodyContent}\n${scriptTags}</body></html>`;
    }
}
var CustomViewType;
(function (CustomViewType) {
    CustomViewType[CustomViewType["HtmlContent"] = 1] = "HtmlContent";
})(CustomViewType || (CustomViewType = {}));
exports.NewCustomViewRequestType = new vscode_languageclient_1.RequestType("powerShell/newCustomView");
exports.ShowCustomViewRequestType = new vscode_languageclient_1.RequestType("powerShell/showCustomView");
exports.CloseCustomViewRequestType = new vscode_languageclient_1.RequestType("powerShell/closeCustomView");
exports.SetHtmlContentViewRequestType = new vscode_languageclient_1.RequestType("powerShell/setHtmlViewContent");
exports.AppendHtmlOutputViewRequestType = new vscode_languageclient_1.RequestType("powerShell/appendHtmlViewContent");
//# sourceMappingURL=CustomViews.js.map