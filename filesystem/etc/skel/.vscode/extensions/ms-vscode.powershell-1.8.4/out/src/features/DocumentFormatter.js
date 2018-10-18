"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
var Window = vscode.window;
const AnimatedStatusBar = require("../controls/animatedStatusBar");
exports.ScriptRegionRequestType = new vscode_languageclient_1.RequestType("powerShell/getScriptRegion");
function toRange(scriptRegion) {
    return new vscode.Range(scriptRegion.startLineNumber - 1, scriptRegion.startColumnNumber - 1, scriptRegion.endLineNumber - 1, scriptRegion.endColumnNumber - 1);
}
function toOneBasedPosition(position) {
    return position.translate({ lineDelta: 1, characterDelta: 1 });
}
class DocumentLocker {
    constructor() {
        this.lockedDocuments = new Object();
    }
    isLocked(document) {
        return this.isLockedInternal(this.getKey(document));
    }
    lock(document, unlockWhenDone) {
        this.lockInternal(this.getKey(document), unlockWhenDone);
    }
    unlock(document) {
        this.unlockInternal(this.getKey(document));
    }
    unlockAll() {
        Object.keys(this.lockedDocuments).slice().forEach((documentKey) => this.unlockInternal(documentKey));
    }
    getKey(document) {
        return document.uri.toString();
    }
    lockInternal(documentKey, unlockWhenDone) {
        if (!this.isLockedInternal(documentKey)) {
            this.lockedDocuments[documentKey] = true;
        }
        if (unlockWhenDone !== undefined) {
            unlockWhenDone.then(() => this.unlockInternal(documentKey));
        }
    }
    unlockInternal(documentKey) {
        if (this.isLockedInternal(documentKey)) {
            delete this.lockedDocuments[documentKey];
        }
    }
    isLockedInternal(documentKey) {
        return this.lockedDocuments.hasOwnProperty(documentKey);
    }
}
class PSDocumentFormattingEditProvider {
    constructor(logger) {
        this.logger = logger;
    }
    static showStatusBar(document, hideWhenDone) {
        const statusBar = AnimatedStatusBar.showAnimatedStatusBarMessage("Formatting PowerShell document", hideWhenDone);
        this.statusBarTracker[document.uri.toString()] = statusBar;
        hideWhenDone.then(() => {
            this.disposeStatusBar(document.uri.toString());
        });
    }
    static disposeStatusBar(documentUri) {
        if (this.statusBarTracker.hasOwnProperty(documentUri)) {
            this.statusBarTracker[documentUri].dispose();
            delete this.statusBarTracker[documentUri];
        }
    }
    static disposeAllStatusBars() {
        Object.keys(this.statusBarTracker).slice().forEach((key) => this.disposeStatusBar(key));
    }
    get emptyPromise() {
        return Promise.resolve(vscode_1.TextEdit[0]);
    }
    setLanguageClient(languageClient) {
        this.languageClient = languageClient;
        // setLanguageClient is called while restarting a session,
        // so this makes sure we clean up the document locker and
        // any residual status bars
        PSDocumentFormattingEditProvider.documentLocker.unlockAll();
        PSDocumentFormattingEditProvider.disposeAllStatusBars();
    }
    provideDocumentFormattingEdits(document, options, token) {
        this.logger.writeVerbose(`Formatting entire document - ${document.uri}...`);
        return this.sendDocumentFormatRequest(document, null, options, token);
    }
    provideDocumentRangeFormattingEdits(document, range, options, token) {
        this.logger.writeVerbose(`Formatting document range ${JSON.stringify(range)} - ${document.uri}...`);
        return this.sendDocumentFormatRequest(document, range, options, token);
    }
    provideOnTypeFormattingEdits(document, position, ch, options, token) {
        this.logger.writeVerbose(`Formatting on type at position ${JSON.stringify(position)} - ${document.uri}...`);
        return this.getScriptRegion(document, position, ch).then((scriptRegion) => {
            if (scriptRegion === null) {
                this.logger.writeVerbose("No formattable range returned.");
                return this.emptyPromise;
            }
            return this.sendDocumentFormatRequest(document, toRange(scriptRegion), options, token);
        }, (err) => {
            this.logger.writeVerbose(`Error while requesting script region for formatting: ${err}`);
        });
    }
    sendDocumentFormatRequest(document, range, options, token) {
        const editor = this.getEditor(document);
        if (editor === undefined) {
            return this.emptyPromise;
        }
        // Check if the document is already being formatted.
        // If so, then ignore the formatting request.
        if (this.isDocumentLocked(document)) {
            return this.emptyPromise;
        }
        // somehow range object gets serialized to an array of Position objects,
        // so we need to use the object literal syntax to initialize it.
        let rangeParam = null;
        if (range != null) {
            rangeParam = {
                start: {
                    line: range.start.line,
                    character: range.start.character,
                },
                end: {
                    line: range.end.line,
                    character: range.end.character,
                },
            };
        }
        const requestParams = {
            textDocument: vscode_languageserver_types_1.TextDocumentIdentifier.create(document.uri.toString()),
            range: rangeParam,
            options: this.getEditorSettings(),
        };
        const formattingStartTime = new Date().valueOf();
        function getFormattingDuration() {
            return ((new Date().valueOf()) - formattingStartTime) / 1000;
        }
        const textEdits = this.languageClient.sendRequest(vscode_languageclient_1.DocumentRangeFormattingRequest.type, requestParams);
        this.lockDocument(document, textEdits);
        PSDocumentFormattingEditProvider.showStatusBar(document, textEdits);
        return this.logAndReturnTextEdits(textEdits, getFormattingDuration);
    }
    // There is something about having this code in the calling method that causes a TS compile error.
    // It causes the following error:
    // Type 'import("C:/Users/Keith/GitHub/rkeithhill/vscode-powershell/node_modules/vscode-languageserver-typ...'
    // is not assignable to type ''vscode'.TextEdit'. Property 'newEol' is missing in type 'TextEdit'.
    logAndReturnTextEdits(textEdits, getFormattingDuration) {
        return textEdits.then((edits) => {
            this.logger.writeVerbose(`Document formatting finished in ${getFormattingDuration()}s`);
            return edits;
        }, (err) => {
            this.logger.writeVerbose(`Document formatting failed in ${getFormattingDuration()}: ${err}`);
        });
    }
    getScriptRegion(document, position, ch) {
        const oneBasedPosition = toOneBasedPosition(position);
        return this.languageClient.sendRequest(exports.ScriptRegionRequestType, {
            fileUri: document.uri.toString(),
            character: ch,
            line: oneBasedPosition.line,
            column: oneBasedPosition.character,
        }).then((result) => {
            if (result === null) {
                return null;
            }
            return result.scriptRegion;
        });
    }
    getEditor(document) {
        return Window.visibleTextEditors.find((e, n, obj) => e.document === document);
    }
    isDocumentLocked(document) {
        return PSDocumentFormattingEditProvider.documentLocker.isLocked(document);
    }
    lockDocument(document, unlockWhenDone) {
        PSDocumentFormattingEditProvider.documentLocker.lock(document, unlockWhenDone);
    }
    getEditorSettings() {
        const editorConfiguration = vscode.workspace.getConfiguration("editor");
        return {
            insertSpaces: editorConfiguration.get("insertSpaces"),
            tabSize: editorConfiguration.get("tabSize"),
        };
    }
}
PSDocumentFormattingEditProvider.documentLocker = new DocumentLocker();
PSDocumentFormattingEditProvider.statusBarTracker = new Object();
class DocumentFormatterFeature {
    constructor(logger, documentSelector) {
        this.logger = logger;
        this.firstTriggerCharacter = "}";
        this.moreTriggerCharacters = ["\n"];
        this.documentFormattingEditProvider = new PSDocumentFormattingEditProvider(logger);
        this.formattingEditProvider = vscode.languages.registerDocumentFormattingEditProvider(documentSelector, this.documentFormattingEditProvider);
        this.rangeFormattingEditProvider = vscode.languages.registerDocumentRangeFormattingEditProvider(documentSelector, this.documentFormattingEditProvider);
        this.onTypeFormattingEditProvider = vscode.languages.registerOnTypeFormattingEditProvider(documentSelector, this.documentFormattingEditProvider, this.firstTriggerCharacter, ...this.moreTriggerCharacters);
    }
    dispose() {
        this.formattingEditProvider.dispose();
        this.rangeFormattingEditProvider.dispose();
        this.onTypeFormattingEditProvider.dispose();
    }
    setLanguageClient(languageclient) {
        this.languageClient = languageclient;
        this.documentFormattingEditProvider.setLanguageClient(languageclient);
    }
}
exports.DocumentFormatterFeature = DocumentFormatterFeature;
//# sourceMappingURL=DocumentFormatter.js.map