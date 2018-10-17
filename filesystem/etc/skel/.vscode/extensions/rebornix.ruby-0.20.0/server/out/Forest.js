"use strict";
/**
 * Forest
 */
Object.defineProperty(exports, "__esModule", { value: true });
class Forest {
    constructor() {
        this.trees = new Map();
    }
    getTree(uri) {
        return this.trees.get(uri);
    }
    setTree(uri, tree) {
        this.trees.set(uri, tree);
    }
    removeTree(uri) {
        return this.trees.delete(uri);
    }
}
exports.Forest = Forest;
//# sourceMappingURL=Forest.js.map