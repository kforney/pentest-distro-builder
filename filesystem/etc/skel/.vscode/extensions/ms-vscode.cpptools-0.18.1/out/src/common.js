var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const os = require("os");
const child_process = require("child_process");
const vscode = require("vscode");
const Telemetry = require("./telemetry");
const HttpsProxyAgent = require("https-proxy-agent");
const url = require("url");
const logger_1 = require("./logger");
const assert = require("assert");
function setExtensionContext(context) {
    exports.extensionContext = context;
}
exports.setExtensionContext = setExtensionContext;
exports.packageJson = vscode.extensions.getExtension("ms-vscode.cpptools").packageJSON;
let rawPackageJson = null;
function getRawPackageJson() {
    if (rawPackageJson === null) {
        const fileContents = fs.readFileSync(getPackageJsonPath());
        rawPackageJson = JSON.parse(fileContents.toString());
    }
    return rawPackageJson;
}
exports.getRawPackageJson = getRawPackageJson;
function stringifyPackageJson(packageJson) {
    return JSON.stringify(packageJson, null, 2);
}
exports.stringifyPackageJson = stringifyPackageJson;
function getExtensionFilePath(extensionfile) {
    return path.resolve(exports.extensionContext.extensionPath, extensionfile);
}
exports.getExtensionFilePath = getExtensionFilePath;
function getPackageJsonPath() {
    return getExtensionFilePath("package.json");
}
exports.getPackageJsonPath = getPackageJsonPath;
function getVcpkgPathDescriptorFile() {
    if (process.platform === 'win32') {
        return path.join(process.env.LOCALAPPDATA, "vcpkg/vcpkg.path.txt");
    }
    else {
        return path.join(process.env.HOME, ".vcpkg/vcpkg.path.txt");
    }
}
exports.getVcpkgPathDescriptorFile = getVcpkgPathDescriptorFile;
let vcpkgRoot;
function getVcpkgRoot() {
    if (!vcpkgRoot && vcpkgRoot !== "") {
        vcpkgRoot = "";
        if (fs.existsSync(getVcpkgPathDescriptorFile())) {
            let vcpkgRootTemp = fs.readFileSync(getVcpkgPathDescriptorFile()).toString();
            vcpkgRootTemp = vcpkgRootTemp.trim();
            if (fs.existsSync(vcpkgRootTemp)) {
                vcpkgRoot = path.join(vcpkgRootTemp, "/installed").replace(/\\/g, "/");
            }
        }
    }
    return vcpkgRoot;
}
exports.getVcpkgRoot = getVcpkgRoot;
function isHeader(document) {
    let ext = path.extname(document.uri.fsPath);
    return !ext || ext.startsWith(".h") || ext.startsWith(".H");
}
exports.isHeader = isHeader;
function isExtensionReady() {
    return __awaiter(this, void 0, void 0, function* () {
        const doesInstallLockFileExist = yield checkInstallLockFile();
        return doesInstallLockFileExist;
    });
}
exports.isExtensionReady = isExtensionReady;
let isExtensionNotReadyPromptDisplayed = false;
exports.extensionNotReadyString = 'The C/C++ extension is still installing. See the output window for more information.';
function displayExtensionNotReadyPrompt() {
    if (!isExtensionNotReadyPromptDisplayed) {
        isExtensionNotReadyPromptDisplayed = true;
        logger_1.showOutputChannel();
        logger_1.getOutputChannelLogger().showInformationMessage(exports.extensionNotReadyString).then(() => { isExtensionNotReadyPromptDisplayed = false; }, () => { isExtensionNotReadyPromptDisplayed = false; });
    }
}
exports.displayExtensionNotReadyPrompt = displayExtensionNotReadyPrompt;
const progressInstallSuccess = 100;
const progressExecutableStarted = 150;
const progressExecutableSuccess = 200;
const progressParseRootSuccess = 300;
const progressIntelliSenseNoSquiggles = 1000;
let installProgressStr = "CPP." + exports.packageJson.version + ".Progress";
let intelliSenseProgressStr = "CPP." + exports.packageJson.version + ".IntelliSenseProgress";
function getProgress() {
    return exports.extensionContext.globalState.get(installProgressStr, -1);
}
exports.getProgress = getProgress;
function getIntelliSenseProgress() {
    return exports.extensionContext.globalState.get(intelliSenseProgressStr, -1);
}
exports.getIntelliSenseProgress = getIntelliSenseProgress;
function setProgress(progress) {
    if (getProgress() < progress) {
        exports.extensionContext.globalState.update(installProgressStr, progress);
        let telemetryProperties = {};
        let progressName;
        switch (progress) {
            case 0:
                progressName = "install started";
                break;
            case progressInstallSuccess:
                progressName = "install succeeded";
                break;
            case progressExecutableStarted:
                progressName = "executable started";
                break;
            case progressExecutableSuccess:
                progressName = "executable succeeded";
                break;
            case progressParseRootSuccess:
                progressName = "parse root succeeded";
                break;
        }
        telemetryProperties['progress'] = progressName;
        Telemetry.logDebuggerEvent("progress", telemetryProperties);
    }
}
exports.setProgress = setProgress;
function setIntelliSenseProgress(progress) {
    if (getIntelliSenseProgress() < progress) {
        exports.extensionContext.globalState.update(intelliSenseProgressStr, progress);
        let telemetryProperties = {};
        let progressName;
        switch (progress) {
            case progressIntelliSenseNoSquiggles:
                progressName = "IntelliSense no squiggles";
                break;
        }
        telemetryProperties['progress'] = progressName;
        Telemetry.logDebuggerEvent("progress", telemetryProperties);
    }
}
exports.setIntelliSenseProgress = setIntelliSenseProgress;
function getProgressInstallSuccess() { return progressInstallSuccess; }
exports.getProgressInstallSuccess = getProgressInstallSuccess;
function getProgressExecutableStarted() { return progressExecutableStarted; }
exports.getProgressExecutableStarted = getProgressExecutableStarted;
function getProgressExecutableSuccess() { return progressExecutableSuccess; }
exports.getProgressExecutableSuccess = getProgressExecutableSuccess;
function getProgressParseRootSuccess() { return progressParseRootSuccess; }
exports.getProgressParseRootSuccess = getProgressParseRootSuccess;
function getProgressIntelliSenseNoSquiggles() { return progressIntelliSenseNoSquiggles; }
exports.getProgressIntelliSenseNoSquiggles = getProgressIntelliSenseNoSquiggles;
function showReleaseNotes() {
    vscode.commands.executeCommand('vscode.previewHtml', vscode.Uri.file(getExtensionFilePath("ReleaseNotes.html")), vscode.ViewColumn.One, "C/C++ Extension Release Notes");
}
exports.showReleaseNotes = showReleaseNotes;
function resolveVariables(input, additionalEnvironment) {
    if (!input) {
        return "";
    }
    if (!additionalEnvironment) {
        additionalEnvironment = {};
    }
    let regexp = () => /\$\{((env|config|workspaceFolder)(\.|:))?(.*?)\}/g;
    let ret = input;
    let cycleCache = new Set();
    while (!cycleCache.has(ret)) {
        cycleCache.add(ret);
        ret = ret.replace(regexp(), (match, ignored1, varType, ignored2, name) => {
            if (varType === undefined) {
                varType = "env";
            }
            let newValue = undefined;
            switch (varType) {
                case "env": {
                    let v = additionalEnvironment[name];
                    if (typeof v === "string") {
                        newValue = v;
                    }
                    else if (input === match && v instanceof Array) {
                        newValue = v.join(";");
                    }
                    if (!newValue) {
                        newValue = process.env[name];
                    }
                    break;
                }
                case "config": {
                    let config = vscode.workspace.getConfiguration();
                    if (config) {
                        newValue = config.get(name);
                    }
                    break;
                }
                case "workspaceFolder": {
                    if (name && vscode.workspace && vscode.workspace.workspaceFolders) {
                        let folder = vscode.workspace.workspaceFolders.find(folder => folder.name.toLocaleLowerCase() === name.toLocaleLowerCase());
                        if (folder) {
                            newValue = folder.uri.fsPath;
                        }
                    }
                    break;
                }
                default: {
                    assert.fail("unknown varType matched");
                }
            }
            return (newValue) ? newValue : match;
        });
    }
    regexp = () => /^\~/g;
    ret = ret.replace(regexp(), (match, name) => {
        let newValue = (process.platform === 'win32') ? process.env.USERPROFILE : process.env.HOME;
        return (newValue) ? newValue : match;
    });
    return ret;
}
exports.resolveVariables = resolveVariables;
function asFolder(uri) {
    let result = uri.toString();
    if (result.charAt(result.length - 1) !== '/') {
        result += '/';
    }
    return result;
}
exports.asFolder = asFolder;
function getOpenCommand() {
    if (os.platform() === 'win32') {
        return 'explorer';
    }
    else if (os.platform() === 'darwin') {
        return '/usr/bin/open';
    }
    else {
        return '/usr/bin/xdg-open';
    }
}
exports.getOpenCommand = getOpenCommand;
function getDebugAdaptersPath(file) {
    return path.resolve(getExtensionFilePath("debugAdapters"), file);
}
exports.getDebugAdaptersPath = getDebugAdaptersPath;
function getHttpsProxyAgent() {
    let proxy = vscode.workspace.getConfiguration().get('http.proxy');
    if (!proxy) {
        proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
        if (!proxy) {
            return null;
        }
    }
    let proxyUrl = url.parse(proxy);
    if (proxyUrl.protocol !== "https:" && proxyUrl.protocol !== "http:") {
        return null;
    }
    let strictProxy = vscode.workspace.getConfiguration().get("http.proxyStrictSSL", true);
    let proxyOptions = {
        host: proxyUrl.hostname,
        port: parseInt(proxyUrl.port, 10),
        auth: proxyUrl.auth,
        rejectUnauthorized: strictProxy
    };
    return new HttpsProxyAgent(proxyOptions);
}
exports.getHttpsProxyAgent = getHttpsProxyAgent;
function touchFile(file) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, "", (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}
function touchInstallLockFile() {
    return touchFile(getInstallLockPath());
}
exports.touchInstallLockFile = touchInstallLockFile;
function touchExtensionFolder() {
    return new Promise((resolve, reject) => {
        fs.utimes(path.resolve(exports.extensionContext.extensionPath, ".."), new Date(Date.now()), new Date(Date.now()), (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}
exports.touchExtensionFolder = touchExtensionFolder;
function checkFileExists(filePath) {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (stats && stats.isFile()) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });
}
exports.checkFileExists = checkFileExists;
function checkDirectoryExists(dirPath) {
    return new Promise((resolve, reject) => {
        fs.stat(dirPath, (err, stats) => {
            if (stats && stats.isDirectory()) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });
}
exports.checkDirectoryExists = checkDirectoryExists;
function readDir(dirPath) {
    return new Promise((resolve) => {
        fs.readdir(dirPath, (err, list) => {
            resolve(list);
        });
    });
}
exports.readDir = readDir;
function checkInstallLockFile() {
    return checkFileExists(getInstallLockPath());
}
exports.checkInstallLockFile = checkInstallLockFile;
function readFileText(filePath, encoding = "utf8") {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, encoding, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
exports.readFileText = readFileText;
function writeFileText(filePath, content, encoding = "utf8") {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, { encoding }, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
exports.writeFileText = writeFileText;
function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        }
        else {
            resolve();
        }
    });
}
exports.deleteFile = deleteFile;
function getInstallLockPath() {
    return getExtensionFilePath("install.lock");
}
exports.getInstallLockPath = getInstallLockPath;
function getReadmeMessage() {
    const readmePath = getExtensionFilePath("README.md");
    const readmeMessage = `Please refer to ${readmePath} for troubleshooting information. Issues can be created at https://github.com/Microsoft/vscode-cpptools/issues`;
    return readmeMessage;
}
exports.getReadmeMessage = getReadmeMessage;
function logToFile(message) {
    const logFolder = getExtensionFilePath("extension.log");
    fs.writeFileSync(logFolder, `${message}${os.EOL}`, { flag: 'a' });
}
exports.logToFile = logToFile;
function execChildProcess(process, workingDirectory, channel) {
    return new Promise((resolve, reject) => {
        child_process.exec(process, { cwd: workingDirectory, maxBuffer: 500 * 1024 }, (error, stdout, stderr) => {
            if (channel) {
                let message = "";
                let err = false;
                if (stdout && stdout.length > 0) {
                    message += stdout;
                }
                if (stderr && stderr.length > 0) {
                    message += stderr;
                    err = true;
                }
                if (error) {
                    message += error.message;
                    err = true;
                }
                if (err) {
                    channel.append(message);
                    channel.show();
                }
            }
            if (error) {
                reject(error);
                return;
            }
            if (stderr && stderr.length > 0) {
                reject(new Error(stderr));
                return;
            }
            resolve(stdout);
        });
    });
}
exports.execChildProcess = execChildProcess;
function spawnChildProcess(process, args, workingDirectory, dataCallback, errorCallback) {
    return new Promise(function (resolve, reject) {
        const child = child_process.spawn(process, args, { cwd: workingDirectory });
        child.stdout.on('data', (data) => {
            dataCallback(`${data}`);
        });
        child.stderr.on('data', (data) => {
            errorCallback(`${data}`);
        });
        child.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`${process} exited with error code ${code}`));
            }
            else {
                resolve();
            }
        });
    });
}
exports.spawnChildProcess = spawnChildProcess;
function allowExecution(file) {
    return new Promise((resolve, reject) => {
        if (process.platform !== 'win32') {
            checkFileExists(file).then((exists) => {
                if (exists) {
                    fs.chmod(file, '755', (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                }
                else {
                    logger_1.getOutputChannelLogger().appendLine("");
                    logger_1.getOutputChannelLogger().appendLine(`Warning: Expected file ${file} is missing.`);
                    resolve();
                }
            });
        }
        else {
            resolve();
        }
    });
}
exports.allowExecution = allowExecution;
function removePotentialPII(str) {
    let words = str.split(" ");
    let result = "";
    for (let word of words) {
        if (word.indexOf(".") === -1 && word.indexOf("/") === -1 && word.indexOf("\\") === -1 && word.indexOf(":") === -1) {
            result += word + " ";
        }
        else {
            result += "? ";
        }
    }
    return result;
}
exports.removePotentialPII = removePotentialPII;
function checkDistro(platformInfo) {
    if (platformInfo.platform !== 'win32' && platformInfo.platform !== 'linux' && platformInfo.platform !== 'darwin') {
        logger_1.getOutputChannelLogger().appendLine(`Warning: Debugging has not been tested for this platform. ${getReadmeMessage()}`);
    }
}
exports.checkDistro = checkDistro;
function unlinkPromise(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            fs.unlink(fileName, err => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    });
}
exports.unlinkPromise = unlinkPromise;
function renamePromise(oldName, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            fs.rename(oldName, newName, err => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    });
}
exports.renamePromise = renamePromise;
function promptForReloadWindowDueToSettingsChange() {
    let reload = "Reload";
    vscode.window.showInformationMessage("Reload the workspace for the settings change to take effect.", reload).then((value) => {
        if (value === reload) {
            vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
    });
}
exports.promptForReloadWindowDueToSettingsChange = promptForReloadWindowDueToSettingsChange;
//# sourceMappingURL=common.js.map