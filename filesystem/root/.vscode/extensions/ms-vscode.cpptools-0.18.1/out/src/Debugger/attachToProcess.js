Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../common");
const nativeAttach_1 = require("./nativeAttach");
const debugUtils = require("./utils");
const fs = require("fs");
const os = require("os");
const path = require("path");
const util = require("../common");
const vscode = require("vscode");
class AttachPicker {
    constructor(attachItemsProvider) {
        this.attachItemsProvider = attachItemsProvider;
    }
    ShowAttachEntries() {
        return util.isExtensionReady().then(ready => {
            if (!ready) {
                util.displayExtensionNotReadyPrompt();
            }
            else {
                return this.attachItemsProvider.getAttachItems()
                    .then(processEntries => {
                    let attachPickOptions = {
                        matchOnDescription: true,
                        matchOnDetail: true,
                        placeHolder: "Select the process to attach to"
                    };
                    return vscode.window.showQuickPick(processEntries, attachPickOptions)
                        .then(chosenProcess => {
                        return chosenProcess ? chosenProcess.id : Promise.reject(new Error("Process not selected."));
                    });
                });
            }
        });
    }
}
exports.AttachPicker = AttachPicker;
class RemoteAttachPicker {
    constructor() {
        this._channel = null;
        this._channel = vscode.window.createOutputChannel('remote-attach');
    }
    ShowAttachEntries(config) {
        return util.isExtensionReady().then(ready => {
            if (!ready) {
                util.displayExtensionNotReadyPrompt();
            }
            else {
                this._channel.clear();
                let pipeTransport = config ? config.pipeTransport : null;
                if (pipeTransport === null) {
                    return Promise.reject(new Error("Chosen debug configuration does not contain pipeTransport"));
                }
                let pipeProgram = null;
                if (os.platform() === 'win32' &&
                    pipeTransport.pipeProgram &&
                    !fs.existsSync(pipeTransport.pipeProgram)) {
                    const pipeProgramStr = pipeTransport.pipeProgram.toLowerCase().trim();
                    const expectedArch = debugUtils.ArchType[process.arch];
                    if (!fs.existsSync(config.pipeTransport.pipeProgram)) {
                        pipeProgram = debugUtils.ArchitectureReplacer.checkAndReplaceWSLPipeProgram(pipeProgramStr, expectedArch);
                    }
                    if (!pipeProgram && config.pipeTransport.pipeCwd) {
                        const pipeCwdStr = config.pipeTransport.pipeCwd.toLowerCase().trim();
                        const newPipeProgramStr = path.join(pipeCwdStr, pipeProgramStr);
                        if (!fs.existsSync(newPipeProgramStr)) {
                            pipeProgram = debugUtils.ArchitectureReplacer.checkAndReplaceWSLPipeProgram(newPipeProgramStr, expectedArch);
                        }
                    }
                }
                if (!pipeProgram) {
                    pipeProgram = pipeTransport.pipeProgram;
                }
                let pipeArgs = pipeTransport.pipeArgs;
                let argList = RemoteAttachPicker.createArgumentList(pipeArgs);
                let pipeCmd = `"${pipeProgram}" ${argList}`;
                return this.getRemoteOSAndProcesses(pipeCmd)
                    .then(processes => {
                    let attachPickOptions = {
                        matchOnDetail: true,
                        matchOnDescription: true,
                        placeHolder: "Select the process to attach to"
                    };
                    return vscode.window.showQuickPick(processes, attachPickOptions)
                        .then(item => {
                        return item ? item.id : Promise.reject(new Error("Process not selected."));
                    });
                });
            }
        });
    }
    getRemoteOSAndProcesses(pipeCmd) {
        const command = `sh -c 'uname && if [ $(uname) == "Linux" ] ; then ${nativeAttach_1.PsProcessParser.psLinuxCommand} ; elif [ $(uname) == "Darwin" ] ; ` +
            `then ${nativeAttach_1.PsProcessParser.psDarwinCommand}; fi'`;
        return common_1.execChildProcess(`${pipeCmd} "${command}"`, null, this._channel).then(output => {
            let lines = output.split(/\r?\n/);
            if (lines.length === 0) {
                return Promise.reject(new Error("Pipe transport failed to get OS and processes."));
            }
            else {
                let remoteOS = lines[0].replace(/[\r\n]+/g, '');
                if (remoteOS !== "Linux" && remoteOS !== "Darwin") {
                    return Promise.reject(new Error(`Operating system "${remoteOS}" not supported.`));
                }
                if (lines.length === 1) {
                    return Promise.reject(new Error("Transport attach could not obtain processes list."));
                }
                else {
                    let processes = lines.slice(1);
                    return nativeAttach_1.PsProcessParser.ParseProcessFromPsArray(processes)
                        .sort((a, b) => {
                        if (a.name === undefined) {
                            if (b.name === undefined) {
                                return 0;
                            }
                            return 1;
                        }
                        if (b.name === undefined) {
                            return -1;
                        }
                        let aLower = a.name.toLowerCase();
                        let bLower = b.name.toLowerCase();
                        if (aLower === bLower) {
                            return 0;
                        }
                        return aLower < bLower ? -1 : 1;
                    })
                        .map(p => p.toAttachItem());
                }
            }
        });
    }
    static createArgumentList(args) {
        let argsString = "";
        for (let arg of args) {
            if (argsString) {
                argsString += " ";
            }
            argsString += `"${arg}"`;
        }
        return argsString;
    }
}
exports.RemoteAttachPicker = RemoteAttachPicker;
//# sourceMappingURL=attachToProcess.js.map