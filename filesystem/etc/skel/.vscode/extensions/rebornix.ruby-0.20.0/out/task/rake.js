'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const vscode = require("vscode");
const utils_1 = require("../utils");
let rakeFiles = new Set();
function registerTaskProvider(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        let rakePromise = undefined;
        let files = yield vscode.workspace.findFiles("**/[rR]akefile{,.rb}");
        for (let i = 0; i < files.length; i++) {
            rakeFiles.add(files[i]);
        }
        let fileWatcher = vscode.workspace.createFileSystemWatcher("**/[rR]akefile{,.rb}");
        fileWatcher.onDidChange(() => rakePromise = undefined);
        fileWatcher.onDidCreate((uri) => {
            rakeFiles.add(uri);
            rakePromise = undefined;
        });
        fileWatcher.onDidDelete((uri) => {
            rakeFiles.delete(uri);
            rakePromise = undefined;
        });
        let taskProvider = vscode.workspace.registerTaskProvider('rake', {
            provideTasks: () => {
                if (!rakePromise) {
                    rakePromise = getRakeTasks();
                }
                return rakePromise;
            },
            resolveTask(_task) {
                return undefined;
            }
        });
    });
}
exports.registerTaskProvider = registerTaskProvider;
function exists(file) {
    return new Promise((resolve, _reject) => {
        fs.exists(file, (value) => {
            resolve(value);
        });
    });
}
const buildNames = ['build', 'compile', 'watch'];
function isBuildTask(name) {
    for (let buildName of buildNames) {
        if (name.indexOf(buildName) !== -1) {
            return true;
        }
    }
    return false;
}
const testNames = ['test'];
function isTestTask(name) {
    for (let testName of testNames) {
        if (name.indexOf(testName) !== -1) {
            return true;
        }
    }
    return false;
}
function getRakeTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        let workspaceRoot = vscode.workspace.rootPath;
        let emptyTasks = [];
        if (!workspaceRoot) {
            return emptyTasks;
        }
        if (rakeFiles.size < 1) {
            return emptyTasks;
        }
        for (let key in rakeFiles.keys) {
            if (!(yield exists(rakeFiles[key]))) {
                return emptyTasks;
            }
        }
        let commandLine = 'rake -AT';
        try {
            let { stdout, stderr } = yield utils_1.exec(commandLine, { cwd: workspaceRoot });
            if (stderr && stderr.length > 0) {
                utils_1.getOutputChannel().appendLine(stderr);
            }
            let result = [];
            if (stdout) {
                let lines = stdout.split(/\r{0,1}\n/);
                for (let line of lines) {
                    if (line.length === 0) {
                        continue;
                    }
                    let regExp = /rake\s(.*)#/;
                    let matches = regExp.exec(line);
                    if (matches && matches.length === 2) {
                        let taskName = matches[1].trim();
                        let kind = {
                            type: 'rake',
                            task: taskName
                        };
                        let task = new vscode.Task(kind, taskName, 'rake', new vscode.ShellExecution(`rake ${taskName}`));
                        result.push(task);
                        let lowerCaseLine = line.toLowerCase();
                        if (isBuildTask(lowerCaseLine)) {
                            task.group = vscode.TaskGroup.Build;
                        }
                        else if (isTestTask(lowerCaseLine)) {
                            task.group = vscode.TaskGroup.Test;
                        }
                    }
                }
            }
            return result;
        }
        catch (err) {
            let channel = utils_1.getOutputChannel();
            if (err.stderr) {
                channel.appendLine(err.stderr);
            }
            if (err.stdout) {
                channel.appendLine(err.stdout);
            }
            channel.appendLine('Auto detecting rake tasks failed.');
            channel.show(true);
            return emptyTasks;
        }
    });
}
//# sourceMappingURL=rake.js.map