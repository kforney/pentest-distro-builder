"use strict";
/**
 * LSP server for vscode-ruby
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
const rebuilder_1 = require("./util/rebuilder");
const connection = vscode_languageserver_1.createConnection(vscode_languageserver_1.ProposedFeatures.all);
connection.onInitialize((params) => __awaiter(this, void 0, void 0, function* () {
    connection.console.info('Initializing Ruby language server...');
    connection.console.info('Rebuilding tree-sitter for local Electron version');
    const rebuildResult = yield rebuilder_1.rebuildTreeSitter();
    for (const result of rebuildResult) {
        if (result) {
            connection.console.error('Rebuild failed!');
            connection.console.error(result.toString());
            return null;
        }
    }
    connection.console.info('Rebuild succeeded!');
    const { Server } = yield Promise.resolve().then(() => require('./Server'));
    const server = new Server(connection, params);
    return server.capabilities;
}));
// Listen on the connection
connection.listen();
//# sourceMappingURL=index.js.map