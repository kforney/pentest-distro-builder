"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moduleNotInstalledError_1 = require("./errors/moduleNotInstalledError");
// tslint:disable-next-line:no-require-imports no-var-requires
const tmp = require('tmp');
function isNotInstalledError(error) {
    const isError = typeof (error) === 'object' && error !== null;
    // tslint:disable-next-line:no-any
    const errorObj = error;
    if (!isError) {
        return false;
    }
    if (error instanceof moduleNotInstalledError_1.ModuleNotInstalledError) {
        return true;
    }
    const isModuleNoInstalledError = error.message.indexOf('No module named') >= 0;
    return errorObj.code === 'ENOENT' || errorObj.code === 127 || isModuleNoInstalledError;
}
exports.isNotInstalledError = isNotInstalledError;
class DeferredImpl {
    // tslint:disable-next-line:no-any
    constructor(scope = null) {
        this.scope = scope;
        this._resolved = false;
        this._rejected = false;
        // tslint:disable-next-line:promise-must-complete
        this._promise = new Promise((res, rej) => {
            this._resolve = res;
            this._reject = rej;
        });
    }
    resolve(value) {
        this._resolve.apply(this.scope ? this.scope : this, arguments);
        this._resolved = true;
    }
    // tslint:disable-next-line:no-any
    reject(reason) {
        this._reject.apply(this.scope ? this.scope : this, arguments);
        this._rejected = true;
    }
    get promise() {
        return this._promise;
    }
    get resolved() {
        return this._resolved;
    }
    get rejected() {
        return this._rejected;
    }
    get completed() {
        return this._rejected || this._resolved;
    }
}
// tslint:disable-next-line:no-any
function createDeferred(scope = null) {
    return new DeferredImpl(scope);
}
exports.createDeferred = createDeferred;
function createTemporaryFile(extension, temporaryDirectory) {
    // tslint:disable-next-line:no-any
    const options = { postfix: extension };
    if (temporaryDirectory) {
        options.dir = temporaryDirectory;
    }
    return new Promise((resolve, reject) => {
        tmp.file(options, (err, tmpFile, fd, cleanupCallback) => {
            if (err) {
                return reject(err);
            }
            resolve({ filePath: tmpFile, cleanupCallback: cleanupCallback });
        });
    });
}
exports.createTemporaryFile = createTemporaryFile;
//# sourceMappingURL=helpers.js.map