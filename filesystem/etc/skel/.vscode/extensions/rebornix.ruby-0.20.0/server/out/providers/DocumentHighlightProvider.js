"use strict";
/*
 * DocumentHighlightProvider
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
const Position_1 = require("../Position");
// TODO support more highlight use cases than just balanced pairs
class DocumentHighlightProvider {
    constructor(connection, forest) {
        this.BEGIN_TYPES = new Set([
            'begin',
            'def',
            'if',
            'case',
            'unless',
            'do',
            'class',
            'module',
        ]);
        this.handleDocumentHighlight = (textDocumentPosition) => __awaiter(this, void 0, void 0, function* () {
            const tree = this.forest.getTree(textDocumentPosition.textDocument.uri);
            const rootNode = tree.rootNode;
            const position = Position_1.Position.FROM_VS_POSITION(textDocumentPosition.position);
            const node = rootNode.descendantForPosition(position.toTSPosition());
            return this.computeHighlights(node);
        });
        this.connection = connection;
        this.forest = forest;
        this.connection.onDocumentHighlight(this.handleDocumentHighlight);
    }
    computeHighlights(node) {
        let highlights = [];
        if (node.type === 'end') {
            highlights = highlights.concat(this.computeEndHighlight(node));
        }
        if (!node.isNamed && this.BEGIN_TYPES.has(node.type)) {
            highlights = highlights.concat(this.computeBeginHighlight(node));
        }
        return highlights;
    }
    computeBeginHighlight(node) {
        const endNode = node.parent.lastChild;
        return [
            vscode_languageserver_1.DocumentHighlight.create(vscode_languageserver_1.Range.create(Position_1.Position.FROM_TS_POSITION(node.startPosition).toVSPosition(), Position_1.Position.FROM_TS_POSITION(node.endPosition).toVSPosition()), vscode_languageserver_1.DocumentHighlightKind.Text),
            vscode_languageserver_1.DocumentHighlight.create(vscode_languageserver_1.Range.create(Position_1.Position.FROM_TS_POSITION(endNode.startPosition).toVSPosition(), Position_1.Position.FROM_TS_POSITION(endNode.endPosition).toVSPosition()), vscode_languageserver_1.DocumentHighlightKind.Text),
        ];
    }
    computeEndHighlight(node) {
        const startNode = node.parent.firstChild;
        return [
            vscode_languageserver_1.DocumentHighlight.create(vscode_languageserver_1.Range.create(Position_1.Position.FROM_TS_POSITION(startNode.startPosition).toVSPosition(), Position_1.Position.FROM_TS_POSITION(startNode.endPosition).toVSPosition()), vscode_languageserver_1.DocumentHighlightKind.Text),
            vscode_languageserver_1.DocumentHighlight.create(vscode_languageserver_1.Range.create(Position_1.Position.FROM_TS_POSITION(node.startPosition).toVSPosition(), Position_1.Position.FROM_TS_POSITION(node.endPosition).toVSPosition()), vscode_languageserver_1.DocumentHighlightKind.Text),
        ];
    }
}
exports.DocumentHighlightProvider = DocumentHighlightProvider;
//# sourceMappingURL=DocumentHighlightProvider.js.map