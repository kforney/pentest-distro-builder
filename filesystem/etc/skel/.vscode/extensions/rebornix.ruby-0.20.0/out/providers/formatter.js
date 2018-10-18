"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rubyFormat_1 = require("../format/rubyFormat");
function registerFormatter(ctx, documentSelector) {
    new rubyFormat_1.RubyDocumentFormattingEditProvider().register(ctx, documentSelector);
}
exports.registerFormatter = registerFormatter;
//# sourceMappingURL=formatter.js.map