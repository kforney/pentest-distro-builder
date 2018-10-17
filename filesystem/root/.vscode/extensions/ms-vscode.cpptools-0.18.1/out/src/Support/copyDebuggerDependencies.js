'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const EnableDevWorkflow = false;
const DebugAdapterPath = "./debugAdapters";
const DebugAdapterBinPath = DebugAdapterPath + "/bin";
let CpptoolsExtensionRoot = null;
let SearchCompleted = false;
const internalBinaryRoots = {
    "miEngineRoot": process.env.CPPTOOLS_MIENGINE_ROOT,
    "openDebugRoot": process.env.CPPTOOLS_OPENDEBUG_ROOT,
    "monoDeps": process.env.CPPTOLS_MONODEPS_ROOT
};
const externalBinaryRoots = {
    "miEngineRoot": DebugAdapterBinPath,
    "openDebugRoot": DebugAdapterBinPath,
    "monoDeps": DebugAdapterPath
};
function findCppToolsExtensionDebugAdapterFolder() {
    const vscodeFolderRegExp = new RegExp(/\.vscode-*[a-z]*$/);
    const cpptoolsFolderRegExp = new RegExp(/ms\-vscode\.cpptools\-.*$/);
    let dirPath = os.homedir();
    if (fs.existsSync(dirPath)) {
        let files = fs.readdirSync(dirPath);
        for (let i = 0; i < files.length; i++) {
            if (vscodeFolderRegExp.test(files[i])) {
                let extPath = path.join(dirPath, files[i], "extensions");
                if (fs.existsSync(extPath)) {
                    let extFiles = fs.readdirSync(extPath);
                    for (let j = 0; j < extFiles.length; j++) {
                        if (cpptoolsFolderRegExp.test(path.join(extFiles[j]))) {
                            dirPath = path.join(extPath, extFiles[j]);
                            break;
                        }
                    }
                }
            }
        }
        if (dirPath === os.homedir()) {
            console.error("Could not find installed C/C++ extension.");
            return null;
        }
        return dirPath;
    }
    else {
        console.error("Unable to determine C/C++ extension installation location.");
        return null;
    }
}
function enableDevWorkflow() {
    if (process.env.AGENT_ID) {
        return false;
    }
    return (EnableDevWorkflow || (process.env.CPPTOOLS_DEV !== undefined));
}
function copySourceDependencies() {
    copy("./", DebugAdapterBinPath, "cppdbg.ad7Engine.json");
}
function getRoot(rootKey) {
    const internal = internalBinaryRoots[rootKey];
    if (internal) {
        return internal;
    }
    if (!CpptoolsExtensionRoot && !SearchCompleted) {
        CpptoolsExtensionRoot = findCppToolsExtensionDebugAdapterFolder();
        SearchCompleted = true;
    }
    if (CpptoolsExtensionRoot) {
        return path.join(CpptoolsExtensionRoot, externalBinaryRoots[rootKey]);
    }
    console.error("Unable to determine internal/external location to copy from for root %s.", rootKey);
    return null;
}
function copyBinaryDependencies() {
    const miEngineRoot = getRoot("miEngineRoot");
    const openDebugRoot = getRoot("openDebugRoot");
    copy(miEngineRoot, DebugAdapterBinPath, "Microsoft.MICore.dll");
    copy(miEngineRoot, DebugAdapterBinPath, "Microsoft.MICore.dll.mdb");
    copy(miEngineRoot, DebugAdapterBinPath, "Microsoft.MICore.XmlSerializers.dll");
    copy(miEngineRoot, DebugAdapterBinPath, "Microsoft.MIDebugEngine.dll");
    copy(miEngineRoot, DebugAdapterBinPath, "Microsoft.MIDebugEngine.dll.mdb");
    copy(miEngineRoot, DebugAdapterBinPath, "osxlaunchhelper.scpt");
    copy(openDebugRoot, DebugAdapterBinPath, "Microsoft.VisualStudio.Debugger.Interop.10.0.dll");
    copy(openDebugRoot, DebugAdapterBinPath, "Microsoft.VisualStudio.Debugger.Interop.11.0.dll");
    copy(openDebugRoot, DebugAdapterBinPath, "Microsoft.VisualStudio.Debugger.Interop.12.0.dll");
    copy(openDebugRoot, DebugAdapterBinPath, "Microsoft.VisualStudio.Debugger.InteropA.dll");
    copy(openDebugRoot, DebugAdapterBinPath, "Microsoft.DebugEngineHost.dll");
    copy(openDebugRoot, DebugAdapterBinPath, "Microsoft.DebugEngineHost.dll.mdb");
    copy(openDebugRoot, DebugAdapterBinPath, "OpenDebugAD7.exe");
    copy(openDebugRoot, DebugAdapterBinPath, "OpenDebugAD7.exe.config");
    copy(openDebugRoot, DebugAdapterBinPath, "OpenDebugAD7.exe.mdb");
    copy(openDebugRoot, DebugAdapterBinPath, "Newtonsoft.Json.dll");
}
function copyMonoDependencies() {
    const monoDeps = getRoot("monoDeps");
    copy(monoDeps, DebugAdapterPath, "OpenDebugAD7");
}
function copy(root, target, file) {
    if (!root) {
        console.error("Unknown root location. Copy Failed for %s.", file);
        return;
    }
    const source = path.join(root, file);
    const destination = path.join(target, file);
    if (!fs.existsSync(target)) {
        console.log('Creating directory %s', target);
        makeDirectory(target);
    }
    console.log('copying %s to %s', source, destination);
    if (fs.existsSync(source)) {
        fs.writeFileSync(destination, fs.readFileSync(source));
    }
    else {
        console.error('ERR: could not find file %s', source);
    }
}
function removeFolder(root) {
    if (!isDirectory(root)) {
        console.warn('Skipping deletion of %s; directory does not exist', root);
        return;
    }
    let files = fs.readdirSync(root);
    for (let i = 0; i < files.length; i++) {
        let fullPath = path.join(root, files[i]);
        console.warn('Found entry %s', fullPath);
        if (!isDirectory(fullPath)) {
            console.warn('Deleting %s', fullPath);
            fs.unlinkSync(fullPath);
        }
        else {
            removeFolder(fullPath);
        }
    }
    console.warn('Deleting %s', root);
    fs.rmdirSync(root);
}
function isDirectory(dir) {
    try {
        return fs.statSync(dir).isDirectory();
    }
    catch (e) {
    }
    return false;
}
function makeDirectory(dir) {
    try {
        fs.mkdirSync(dir);
    }
    catch (e) {
        if (e.code !== "EEXIST") {
            throw e;
        }
    }
}
if (enableDevWorkflow()) {
    removeFolder("./debugAdapters");
}
makeDirectory("./debugAdapters");
copySourceDependencies();
if (enableDevWorkflow()) {
    copyMonoDependencies();
    copyBinaryDependencies();
}
else {
    console.warn('WARNING: Debugger dependencies are missing.');
    console.log('If you are trying to build and run the extension from source and need the debugger dependencies, set the environment variable CPPTOOLS_DEV=1 and try again.');
}
//# sourceMappingURL=copyDebuggerDependencies.js.map