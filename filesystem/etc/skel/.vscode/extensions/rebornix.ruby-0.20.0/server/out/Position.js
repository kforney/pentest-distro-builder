"use strict";
/**
 * Position class
 *
 * This class supports converting to/from VSCode and TreeSitter positions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
class Position {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }
    static FROM_VS_POSITION(position) {
        return new Position(position.line, position.character);
    }
    static FROM_TS_POSITION(position) {
        return new Position(position.row, position.column);
    }
    toVSPosition() {
        return vscode_languageserver_1.Position.create(this.row, this.col);
    }
    toTSPosition() {
        return {
            row: this.row,
            column: this.col,
        };
    }
}
exports.Position = Position;
//# sourceMappingURL=Position.js.map