"use strict";
/*
 * FoldingProvider
 *
 * Super basic highlight provider
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
class FoldingRangeProvider {
    constructor(connection, forest) {
        this.FOLD_CONSTRUCTS = new Set([
            'begin',
            'def',
            'if',
            'case',
            'unless',
            'do',
            'class',
            'module',
        ]);
        this.handleFoldingRange = (param) => __awaiter(this, void 0, void 0, function* () {
            const folds = [];
            const tree = this.forest.getTree(param.textDocument.uri);
            const traverse = (node) => {
                if (!node.isNamed && this.FOLD_CONSTRUCTS.has(node.type)) {
                    const endNode = node.parent.lastChild;
                    folds.push({
                        startLine: node.startPosition.row,
                        startCharacter: node.startPosition.column,
                        endLine: endNode.endPosition.row,
                        endCharacter: node.endPosition.column,
                        kind: vscode_languageserver_1.FoldingRangeKind.Region,
                    });
                }
                for (const childNode of node.children) {
                    traverse(childNode);
                }
            };
            traverse(tree.rootNode);
            return folds;
        });
        this.connection = connection;
        this.forest = forest;
        this.connection.onRequest(vscode_languageserver_1.FoldingRangeRequest.type, this.handleFoldingRange);
    }
}
exports.FoldingRangeProvider = FoldingRangeProvider;
//# sourceMappingURL=FoldingRangeProvider.js.map