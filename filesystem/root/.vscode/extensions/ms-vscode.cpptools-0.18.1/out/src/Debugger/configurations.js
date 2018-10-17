Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
var DebuggerType;
(function (DebuggerType) {
    DebuggerType[DebuggerType["cppvsdbg"] = 0] = "cppvsdbg";
    DebuggerType[DebuggerType["cppdbg"] = 1] = "cppdbg";
})(DebuggerType = exports.DebuggerType || (exports.DebuggerType = {}));
function indentJsonString(json, numTabs = 1) {
    return json.split('\n').map(line => '\t'.repeat(numTabs) + line).join('\n').trim();
}
exports.indentJsonString = indentJsonString;
function formatString(format, args) {
    for (let arg in args) {
        format = format.replace("{" + arg + "}", args[arg]);
    }
    return format;
}
function createLaunchString(name, type, executable) {
    return `"name": "${name}",
"type": "${type}",
"request": "launch",
"program": "${"enter program name, for example " + "$\{workspaceFolder\}" + "/" + executable}",
"args": [],
"stopAtEntry": false,
"cwd": "$\{workspaceFolder\}",
"environment": [],
"externalConsole": true
`;
}
function createAttachString(name, type, executable) {
    return formatString(`
"name": "${name}",
"type": "${type}",
"request": "attach",{0}
"processId": "$\{command:pickProcess\}"
`, [type === "cppdbg" ? `${os.EOL}"program": "${"enter program name, for example $\{workspaceFolder\}/" + executable}",` : ""]);
}
function createRemoteAttachString(name, type, executable) {
    return `
"name": "${name}",
"type": "${type}",
"request": "attach",
"program": "${"enter program name, for example $\{workspaceFolder\}/" + executable}",
"processId": "$\{command:pickRemoteProcess\}"
`;
}
function createPipeTransportString(pipeProgram, debuggerProgram, pipeArgs = []) {
    return `
"pipeTransport": {
\t"debuggerPath": "/usr/bin/${debuggerProgram}",
\t"pipeProgram": "${pipeProgram}",
\t"pipeArgs": ${JSON.stringify(pipeArgs)},
\t"pipeCwd": ""
}`;
}
class Configuration {
    constructor(MIMode, executable, pipeProgram, additionalProperties = "") {
        this.snippetPrefix = "C/C++: ";
        this.miDebugger = "cppdbg";
        this.windowsDebugger = "cppvsdbg";
        this.MIMode = MIMode;
        this.executable = executable;
        this.pipeProgram = pipeProgram;
        this.additionalProperties = additionalProperties;
    }
}
class MIConfigurations extends Configuration {
    GetLaunchConfiguration() {
        let name = `(${this.MIMode}) Launch`;
        let body = formatString(`{
\t${indentJsonString(createLaunchString(name, this.miDebugger, this.executable))},
\t"MIMode": "${this.MIMode}"{0}{1}
}`, [this.miDebugger === "cppdbg" && os.platform() === "win32" ? `,${os.EOL}\t"miDebuggerPath": "/path/to/gdb"` : "",
            this.additionalProperties ? `,${os.EOL}\t${indentJsonString(this.additionalProperties)}` : ""]);
        return {
            "label": this.snippetPrefix + name,
            "description": `Launch with ${this.MIMode}.`,
            "bodyText": body.trim(),
            "isInitialConfiguration": true,
            "debuggerType": DebuggerType.cppdbg
        };
    }
    GetAttachConfiguration() {
        let name = `(${this.MIMode}) Attach`;
        let body = formatString(`{ 
\t${indentJsonString(createAttachString(name, this.miDebugger, this.executable))},
\t"MIMode": "${this.MIMode}"{0}{1}
}`, [this.miDebugger === "cppdbg" && os.platform() === "win32" ? `,${os.EOL}\t"miDebuggerPath": "/path/to/gdb"` : "",
            this.additionalProperties ? `,${os.EOL}\t${indentJsonString(this.additionalProperties)}` : ""]);
        return {
            "label": this.snippetPrefix + name,
            "description": `Attach with ${this.MIMode}.`,
            "bodyText": body.trim(),
            "debuggerType": DebuggerType.cppdbg
        };
    }
}
exports.MIConfigurations = MIConfigurations;
class PipeTransportConfigurations extends Configuration {
    GetLaunchConfiguration() {
        let name = `(${this.MIMode}) Pipe Launch`;
        let body = formatString(`
{
\t${indentJsonString(createLaunchString(name, this.miDebugger, this.executable))},
\t${indentJsonString(createPipeTransportString(this.pipeProgram, this.MIMode))},
\t"MIMode": "${this.MIMode}"{0}
}`, [this.additionalProperties ? `,${os.EOL}\t${indentJsonString(this.additionalProperties)}` : ""]);
        return {
            "label": this.snippetPrefix + name,
            "description": `Pipe Launch with ${this.MIMode}.`,
            "bodyText": body.trim(),
            "debuggerType": DebuggerType.cppdbg
        };
    }
    GetAttachConfiguration() {
        let name = `(${this.MIMode}) Pipe Attach`;
        let body = formatString(`
{
\t${indentJsonString(createRemoteAttachString(name, this.miDebugger, this.executable))},
\t${indentJsonString(createPipeTransportString(this.pipeProgram, this.MIMode))},
\t"MIMode": "${this.MIMode}"{0}
}`, [this.additionalProperties ? `,${os.EOL}\t${indentJsonString(this.additionalProperties)}` : ""]);
        return {
            "label": this.snippetPrefix + name,
            "description": `Pipe Attach with ${this.MIMode}.`,
            "bodyText": body.trim(),
            "debuggerType": DebuggerType.cppdbg
        };
    }
}
exports.PipeTransportConfigurations = PipeTransportConfigurations;
class WindowsConfigurations extends Configuration {
    GetLaunchConfiguration() {
        let name = "(Windows) Launch";
        let body = `
{
\t${indentJsonString(createLaunchString(name, this.windowsDebugger, this.executable))}
}`;
        return {
            "label": this.snippetPrefix + name,
            "description": "Launch with the Visual Studio C/C++ debugger.",
            "bodyText": body.trim(),
            "isInitialConfiguration": true,
            "debuggerType": DebuggerType.cppvsdbg
        };
    }
    GetAttachConfiguration() {
        let name = "(Windows) Attach";
        let body = `
{
\t${indentJsonString(createAttachString(name, this.windowsDebugger, this.executable))}
}`;
        return {
            "label": this.snippetPrefix + name,
            "description": "Attach to a process with the Visual Studio C/C++ debugger.",
            "bodyText": body.trim(),
            "debuggerType": DebuggerType.cppvsdbg
        };
    }
}
exports.WindowsConfigurations = WindowsConfigurations;
class WSLConfigurations extends Configuration {
    constructor() {
        super(...arguments);
        this.bashPipeProgram = process.arch === 'ia32' ? "${env:windir}\\\\sysnative\\\\bash.exe" : "${env:windir}\\\\system32\\\\bash.exe";
    }
    GetLaunchConfiguration() {
        let name = `(${this.MIMode}) Bash on Windows Launch`;
        let body = formatString(`
{
\t${indentJsonString(createLaunchString(name, this.miDebugger, this.executable))},
\t${indentJsonString(createPipeTransportString(this.bashPipeProgram, this.MIMode, ["-c"]))}{0}
}`, [this.additionalProperties ? `,${os.EOL}\t${indentJsonString(this.additionalProperties)}` : ""]);
        return {
            "label": this.snippetPrefix + name,
            "description": `Launch in Bash on Windows using ${this.MIMode}.`,
            "bodyText": body.trim(),
            "debuggerType": DebuggerType.cppdbg
        };
    }
    GetAttachConfiguration() {
        let name = `(${this.MIMode}) Bash on Windows Attach`;
        let body = formatString(`
{
\t${indentJsonString(createRemoteAttachString(name, this.miDebugger, this.executable))},
\t${indentJsonString(createPipeTransportString(this.bashPipeProgram, this.MIMode, ["-c"]))}{0}
}`, [this.additionalProperties ? `,${os.EOL}\t${indentJsonString(this.additionalProperties)}` : ""]);
        return {
            "label": this.snippetPrefix + name,
            "description": `Attach to a remote process running in Bash on Windows using ${this.MIMode}.`,
            "bodyText": body.trim(),
            "debuggerType": DebuggerType.cppdbg
        };
    }
}
exports.WSLConfigurations = WSLConfigurations;
//# sourceMappingURL=configurations.js.map