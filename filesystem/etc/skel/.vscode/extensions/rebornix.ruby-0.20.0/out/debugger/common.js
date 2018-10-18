"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SocketClientState;
(function (SocketClientState) {
    SocketClientState[SocketClientState["ready"] = 0] = "ready";
    SocketClientState[SocketClientState["connected"] = 1] = "connected";
    SocketClientState[SocketClientState["closed"] = 2] = "closed";
})(SocketClientState = exports.SocketClientState || (exports.SocketClientState = {}));
var Mode;
(function (Mode) {
    Mode[Mode["launch"] = 0] = "launch";
    Mode[Mode["attach"] = 1] = "attach";
})(Mode = exports.Mode || (exports.Mode = {}));
//# sourceMappingURL=common.js.map