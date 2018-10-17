"use strict";
/**
 * ASTProvider
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
const Parser = require("tree-sitter");
const TreeSitterRuby = require("tree-sitter-ruby");
const Position_1 = require("../Position");
class ASTProvider {
    constructor(connection, forest) {
        this.handleOpenTextDocument = (params) => __awaiter(this, void 0, void 0, function* () {
            const document = params.textDocument;
            const tree = this.parser.parse(document.text);
            this.forest.setTree(document.uri, tree);
        });
        this.handleChangeTextDocument = (params) => __awaiter(this, void 0, void 0, function* () {
            const document = params.textDocument;
            let tree = this.forest.getTree(document.uri);
            if (tree !== undefined) {
                for (const changeEvent of params.contentChanges) {
                    if (changeEvent.range && changeEvent.rangeLength) {
                        // range is range of the change. end is exclusive
                        // rangeLength is length of text removed
                        // text is new text
                        const { range, rangeLength, text } = changeEvent;
                        const startIndex = range.start.line * range.start.character;
                        const oldEndIndex = startIndex + rangeLength - 1;
                        tree.edit({
                            startIndex,
                            oldEndIndex,
                            newEndIndex: range.end.line * range.end.character - 1,
                            startPosition: Position_1.Position.FROM_VS_POSITION(range.start).toTSPosition(),
                            oldEndPosition: this.computeEndPosition(startIndex, oldEndIndex, tree),
                            newEndPosition: Position_1.Position.FROM_VS_POSITION(range.end).toTSPosition(),
                        });
                        tree = this.parser.parse(text, tree);
                    }
                    else {
                        tree = this.buildTree(changeEvent.text);
                    }
                }
            }
            this.forest.setTree(document.uri, tree);
        });
        this.handleCloseTextDocument = (params) => __awaiter(this, void 0, void 0, function* () {
            const document = params.textDocument;
            this.forest.removeTree(document.uri);
        });
        this.buildTree = (text) => {
            return this.parser.parse(text);
        };
        this.computeEndPosition = (startIndex, endIndex, tree) => {
            // TODO handle case where this method call fails for whatever reason
            const node = tree.rootNode.descendantForIndex(startIndex, endIndex);
            return node.endPosition;
        };
        this.connection = connection;
        this.forest = forest;
        this.parser = new Parser();
        this.parser.setLanguage(TreeSitterRuby);
        this.connection.onDidOpenTextDocument(this.handleOpenTextDocument);
        this.connection.onDidChangeTextDocument(this.handleChangeTextDocument);
        this.connection.onDidCloseTextDocument(this.handleCloseTextDocument);
    }
}
exports.ASTProvider = ASTProvider;
//# sourceMappingURL=ASTProvider.js.map