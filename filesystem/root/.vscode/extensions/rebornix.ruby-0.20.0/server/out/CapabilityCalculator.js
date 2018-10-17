"use strict";
/**
 * CapabilityCalculator
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
class CapabilityCalculator {
    constructor(clientCapabilities) {
        this.clientCapabilities = clientCapabilities;
    }
    get capabilities() {
        this.clientCapabilities;
        return {
            // Perform incremental syncs
            // Incremental sync is disabled for now due to not being able to get the
            // old text in ASTProvider
            // textDocumentSync: TextDocumentSyncKind.Incremental,
            textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Full,
            documentHighlightProvider: true,
            foldingRangeProvider: true,
        };
    }
}
exports.CapabilityCalculator = CapabilityCalculator;
//# sourceMappingURL=CapabilityCalculator.js.map