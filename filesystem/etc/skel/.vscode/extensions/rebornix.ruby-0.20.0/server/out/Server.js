"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CapabilityCalculator_1 = require("./CapabilityCalculator");
const Forest_1 = require("./Forest");
const ASTProvider_1 = require("./providers/ASTProvider");
const DocumentHighlightProvider_1 = require("./providers/DocumentHighlightProvider");
const FoldingRangeProvider_1 = require("./providers/FoldingRangeProvider");
class Server {
    constructor(connection, params) {
        this.connection = connection;
        this.calculator = new CapabilityCalculator_1.CapabilityCalculator(params.capabilities);
        this.forest = new Forest_1.Forest();
        this.registerProviders();
    }
    get capabilities() {
        return {
            capabilities: this.calculator.capabilities,
        };
    }
    registerProviders() {
        new ASTProvider_1.ASTProvider(this.connection, this.forest);
        new DocumentHighlightProvider_1.DocumentHighlightProvider(this.connection, this.forest);
        new FoldingRangeProvider_1.FoldingRangeProvider(this.connection, this.forest);
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map