"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
function exec(command, options) {
    return new Promise((resolve, reject) => {
        cp.exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stdout, stderr });
            }
            resolve({ stdout, stderr });
        });
    });
}
exports.exec = exec;
let _channel;
function getOutputChannel() {
    if (!_channel) {
        _channel = vscode.window.createOutputChannel('Ruby');
    }
    return _channel;
}
exports.getOutputChannel = getOutputChannel;
function loadEnv() {
    return __awaiter(this, void 0, void 0, function* () {
        let { stdout, stderr } = yield exec(process.env.SHELL + " -lc export", { cwd: vscode.workspace.rootPath });
        let envs = stdout.trim().split('\n');
        for (let i = 0; i < envs.length; i++) {
            let definition = envs[i];
            let result = definition.split('=', 2);
            let envKey = result[0];
            let envValue = result[1];
            if (["PATH", "GEM_HOME", "GEM_PATH", "RUBY_VERSION"].indexOf(envKey) > -1) {
                if (!process.env[envKey]) {
                    process.env[envKey] = envValue;
                }
            }
        }
        getOutputChannel().appendLine(stderr);
    });
}
exports.loadEnv = loadEnv;
function checkVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        getOutputChannel().appendLine(process.env.SHELL);
        let { stdout, stderr } = yield exec("ruby -v", { cwd: vscode.workspace.rootPath });
        getOutputChannel().appendLine(stdout);
        getOutputChannel().appendLine(stderr);
    });
}
exports.checkVersion = checkVersion;
//# sourceMappingURL=utils.js.map