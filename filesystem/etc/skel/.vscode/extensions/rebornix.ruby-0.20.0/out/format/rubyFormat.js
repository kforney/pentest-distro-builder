"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const RuboCop_1 = require("./RuboCop");
class RubyDocumentFormattingEditProvider {
    register(ctx, documentSelector) {
        // only attempt to format if ruby.format is set to rubocop
        if (vscode.workspace.getConfiguration("ruby").get("format") !== "rubocop") {
            return;
        }
        this.autoCorrect = new RuboCop_1.AutoCorrect();
        this.autoCorrect.test().then(() => ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(documentSelector, this))
        // silent failure - AutoCorrect will handle error messages
        );
    }
    provideDocumentFormattingEdits(document, options, token) {
        const root = document.fileName ? path.dirname(document.fileName) : vscode.workspace.rootPath;
        const input = document.getText();
        return this.autoCorrect.correct(input, root)
            .then(result => {
            return [new vscode.TextEdit(document.validateRange(new vscode.Range(0, 0, Infinity, Infinity)), result)];
        }, err => {
            // silent failure - AutoCorrect will handle error messages
            return [];
        });
    }
}
exports.RubyDocumentFormattingEditProvider = RubyDocumentFormattingEditProvider;
//# sourceMappingURL=rubyFormat.js.map