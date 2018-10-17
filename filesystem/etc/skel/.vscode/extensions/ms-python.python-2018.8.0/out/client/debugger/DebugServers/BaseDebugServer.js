// tslint:disable:quotemark ordered-imports no-any no-empty
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const helpers_1 = require("../../common/helpers");
class BaseDebugServer extends events_1.EventEmitter {
    get client() {
        return this.clientSocket.promise;
    }
    get IsRunning() {
        return this.isRunning;
    }
    get DebugClientConnected() {
        return this.debugClientConnected.promise;
    }
    constructor(debugSession, pythonProcess) {
        super();
        this.debugSession = debugSession;
        this.pythonProcess = pythonProcess;
        this.debugClientConnected = helpers_1.createDeferred();
        this.clientSocket = helpers_1.createDeferred();
    }
}
exports.BaseDebugServer = BaseDebugServer;
//# sourceMappingURL=BaseDebugServer.js.map