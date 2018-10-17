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
const https = require("https");
const path = require("path");
const vscode = require("vscode");
const url = require("url");
const tmp = require("tmp");
const yauzl = require("yauzl");
const mkdirp = require("mkdirp");
const util = require("./common");
const Telemetry = require("./telemetry");
class PackageManagerError extends Error {
    constructor(message, methodName, pkg = null, innerError = null, errorCode = '') {
        super(message);
        this.message = message;
        this.methodName = methodName;
        this.pkg = pkg;
        this.innerError = innerError;
        this.errorCode = errorCode;
    }
}
exports.PackageManagerError = PackageManagerError;
class PackageManagerWebResponseError extends PackageManagerError {
    constructor(socket, message, methodName, pkg = null, innerError = null, errorCode = '') {
        super(message, methodName, pkg, innerError, errorCode);
        this.socket = socket;
        this.message = message;
        this.methodName = methodName;
        this.pkg = pkg;
        this.innerError = innerError;
        this.errorCode = errorCode;
    }
}
exports.PackageManagerWebResponseError = PackageManagerWebResponseError;
class PackageManager {
    constructor(platformInfo, outputChannel) {
        this.platformInfo = platformInfo;
        this.outputChannel = outputChannel;
        tmp.setGracefulCleanup();
    }
    DownloadPackages(progress) {
        return this.GetPackages()
            .then((packages) => {
            let count = 1;
            return this.BuildPromiseChain(packages, (pkg) => {
                const p = this.DownloadPackage(pkg, `${count}/${packages.length}`, progress);
                count += 1;
                return p;
            });
        });
    }
    InstallPackages(progress) {
        return this.GetPackages()
            .then((packages) => {
            let count = 1;
            return this.BuildPromiseChain(packages, (pkg) => {
                const p = this.InstallPackage(pkg, `${count}/${packages.length}`, progress);
                count += 1;
                return p;
            });
        });
    }
    BuildPromiseChain(items, promiseBuilder) {
        let promiseChain = Promise.resolve(null);
        for (let item of items) {
            promiseChain = promiseChain.then(() => {
                return promiseBuilder(item);
            });
        }
        return promiseChain;
    }
    GetPackageList() {
        return new Promise((resolve, reject) => {
            if (!this.allPackages) {
                if (util.packageJson.runtimeDependencies) {
                    this.allPackages = util.packageJson.runtimeDependencies;
                    for (let pkg of this.allPackages) {
                        if (pkg.binaries) {
                            pkg.binaries = pkg.binaries.map((value) => {
                                return util.getExtensionFilePath(value);
                            });
                        }
                    }
                    resolve(this.allPackages);
                }
                else {
                    reject(new PackageManagerError('Package manifest does not exist', 'GetPackageList'));
                }
            }
            else {
                resolve(this.allPackages);
            }
        });
    }
    GetPackages() {
        return this.GetPackageList()
            .then((list) => {
            return list.filter((value, index, array) => {
                return (!value.architectures || value.architectures.indexOf(this.platformInfo.architecture) !== -1) &&
                    (!value.platforms || value.platforms.indexOf(this.platformInfo.platform) !== -1);
            });
        });
    }
    DownloadPackage(pkg, progressCount, progress) {
        return __awaiter(this, void 0, void 0, function* () {
            this.AppendChannel(`Downloading package '${pkg.description}' `);
            progress.report({ message: `Downloading ${progressCount}: ${pkg.description}` });
            const tmpResult = yield this.CreateTempFile(pkg);
            yield this.DownloadPackageWithRetries(pkg, tmpResult, progress);
        });
    }
    CreateTempFile(pkg) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                tmp.file({ prefix: "package-" }, (err, path, fd, cleanupCallback) => {
                    if (err) {
                        return reject(new PackageManagerError('Error from temp.file', 'DownloadPackage', pkg, err));
                    }
                    return resolve({ name: path, fd: fd, removeCallback: cleanupCallback });
                });
            });
        });
    }
    DownloadPackageWithRetries(pkg, tmpResult, progress) {
        return __awaiter(this, void 0, void 0, function* () {
            pkg.tmpFile = tmpResult;
            let success = false;
            let lastError = null;
            let retryCount = 0;
            const MAX_RETRIES = 5;
            do {
                try {
                    yield this.DownloadFile(pkg.url, pkg, retryCount, progress);
                    success = true;
                }
                catch (error) {
                    retryCount += 1;
                    lastError = error;
                    if (retryCount > MAX_RETRIES) {
                        this.AppendChannel(` Failed to download ` + pkg.url);
                        throw error;
                    }
                    else {
                        this.AppendChannel(` Failed. Retrying...`);
                        continue;
                    }
                }
            } while (!success && retryCount < MAX_RETRIES);
            this.AppendLineChannel(" Done!");
            if (retryCount !== 0) {
                let telemetryProperties = {};
                telemetryProperties["success"] = success ? `OnRetry${retryCount}` : 'false';
                if (lastError instanceof PackageManagerError) {
                    let packageError = lastError;
                    telemetryProperties['error.methodName'] = packageError.methodName;
                    telemetryProperties['error.message'] = packageError.message;
                    if (packageError.pkg) {
                        telemetryProperties['error.packageName'] = packageError.pkg.description;
                        telemetryProperties['error.packageUrl'] = packageError.pkg.url;
                    }
                    if (packageError.errorCode) {
                        telemetryProperties['error.errorCode'] = packageError.errorCode;
                    }
                }
                Telemetry.logDebuggerEvent("acquisition", telemetryProperties);
            }
        });
    }
    DownloadFile(urlString, pkg, delay, progress) {
        let parsedUrl = url.parse(urlString);
        let proxyStrictSSL = vscode.workspace.getConfiguration().get("http.proxyStrictSSL", true);
        let options = {
            host: parsedUrl.host,
            path: parsedUrl.path,
            agent: util.getHttpsProxyAgent(),
            rejectUnauthorized: proxyStrictSSL
        };
        return new Promise((resolve, reject) => {
            let secondsDelay = Math.pow(2, delay);
            if (secondsDelay === 1) {
                secondsDelay = 0;
            }
            if (secondsDelay > 4) {
                this.AppendChannel(`Waiting ${secondsDelay} seconds...`);
            }
            setTimeout(() => {
                if (!pkg.tmpFile || pkg.tmpFile.fd === 0) {
                    return reject(new PackageManagerError('Temporary Package file unavailable', 'DownloadFile', pkg));
                }
                let handleHttpResponse = (response) => {
                    if (response.statusCode === 301 || response.statusCode === 302) {
                        let redirectUrl;
                        if (typeof response.headers.location === "string") {
                            redirectUrl = response.headers.location;
                        }
                        else {
                            redirectUrl = response.headers.location[0];
                        }
                        return resolve(this.DownloadFile(redirectUrl, pkg, 0, progress));
                    }
                    else if (response.statusCode !== 200) {
                        let errorMessage = `failed (error code '${response.statusCode}')`;
                        return reject(new PackageManagerWebResponseError(response.socket, 'HTTP/HTTPS Response Error', 'DownloadFile', pkg, errorMessage, response.statusCode.toString()));
                    }
                    else {
                        let contentLength = response.headers['content-length'];
                        if (typeof response.headers['content-length'] === "string") {
                            contentLength = response.headers['content-length'];
                        }
                        else {
                            contentLength = response.headers['content-length'][0];
                        }
                        let packageSize = parseInt(contentLength, 10);
                        let downloadPercentage = 0;
                        let dots = 0;
                        let tmpFile = fs.createWriteStream(null, { fd: pkg.tmpFile.fd });
                        this.AppendChannel(`(${Math.ceil(packageSize / 1024)} KB) `);
                        response.on('data', (data) => {
                            let newDots = Math.ceil(downloadPercentage / 5);
                            if (newDots > dots) {
                                this.AppendChannel(".".repeat(newDots - dots));
                                dots = newDots;
                            }
                        });
                        response.on('end', () => {
                            return resolve();
                        });
                        response.on('error', (error) => {
                            return reject(new PackageManagerWebResponseError(response.socket, 'HTTP/HTTPS Response error', 'DownloadFile', pkg, error.stack, error.name));
                        });
                        response.pipe(tmpFile, { end: false });
                    }
                };
                let request = https.request(options, handleHttpResponse);
                request.on('error', (error) => {
                    return reject(new PackageManagerError('HTTP/HTTPS Request error' + (urlString.includes("fwlink") ? ": fwlink" : ""), 'DownloadFile', pkg, error.stack, error.message));
                });
                request.end();
            }, secondsDelay * 1000);
        });
    }
    InstallPackage(pkg, progressCount, progress) {
        this.AppendLineChannel(`Installing package '${pkg.description}'`);
        progress.report({ message: `Installing ${progressCount}: ${pkg.description}` });
        return new Promise((resolve, reject) => {
            if (!pkg.tmpFile || pkg.tmpFile.fd === 0) {
                return reject(new PackageManagerError('Downloaded file unavailable', 'InstallPackage', pkg));
            }
            yauzl.fromFd(pkg.tmpFile.fd, { lazyEntries: true }, (err, zipfile) => {
                if (err) {
                    return reject(new PackageManagerError('Zip file error', 'InstallPackage', pkg, err));
                }
                zipfile.on('end', () => {
                    return resolve();
                });
                zipfile.on('error', err => {
                    return reject(new PackageManagerError('Zip File Error', 'InstallPackage', pkg, err, err.code));
                });
                zipfile.readEntry();
                zipfile.on('entry', (entry) => {
                    let absoluteEntryPath = util.getExtensionFilePath(entry.fileName);
                    if (entry.fileName.endsWith("/")) {
                        mkdirp.mkdirp(absoluteEntryPath, { mode: 0o775 }, (err) => {
                            if (err) {
                                return reject(new PackageManagerError('Error creating directory', 'InstallPackage', pkg, err, err.code));
                            }
                            zipfile.readEntry();
                        });
                    }
                    else {
                        util.checkFileExists(absoluteEntryPath).then((exists) => {
                            if (!exists) {
                                zipfile.openReadStream(entry, (err, readStream) => {
                                    if (err) {
                                        return reject(new PackageManagerError('Error reading zip stream', 'InstallPackage', pkg, err));
                                    }
                                    readStream.on('error', (err) => {
                                        return reject(new PackageManagerError('Error in readStream', 'InstallPackage', pkg, err));
                                    });
                                    mkdirp.mkdirp(path.dirname(absoluteEntryPath), { mode: 0o775 }, (err) => __awaiter(this, void 0, void 0, function* () {
                                        if (err) {
                                            return reject(new PackageManagerError('Error creating directory', 'InstallPackage', pkg, err, err.code));
                                        }
                                        let absoluteEntryTempFile = absoluteEntryPath + ".tmp";
                                        if (fs.existsSync(absoluteEntryTempFile)) {
                                            try {
                                                yield util.unlinkPromise(absoluteEntryTempFile);
                                            }
                                            catch (err) {
                                                return reject(new PackageManagerError(`Error unlinking file ${absoluteEntryTempFile}`, 'InstallPackage', pkg, err));
                                            }
                                        }
                                        let fileMode = (pkg.binaries && pkg.binaries.indexOf(absoluteEntryPath) !== -1) ? 0o755 : 0o664;
                                        let writeStream = fs.createWriteStream(absoluteEntryTempFile, { mode: fileMode });
                                        writeStream.on('close', () => __awaiter(this, void 0, void 0, function* () {
                                            try {
                                                yield util.renamePromise(absoluteEntryTempFile, absoluteEntryPath);
                                            }
                                            catch (err) {
                                                return reject(new PackageManagerError(`Error renaming file ${absoluteEntryTempFile}`, 'InstallPackage', pkg, err));
                                            }
                                            zipfile.readEntry();
                                        }));
                                        writeStream.on('error', (err) => {
                                            return reject(new PackageManagerError('Error in writeStream', 'InstallPackage', pkg, err));
                                        });
                                        readStream.pipe(writeStream);
                                    }));
                                });
                            }
                            else {
                                if (path.extname(absoluteEntryPath) !== ".txt") {
                                    this.AppendLineChannel(`Warning: File '${absoluteEntryPath}' already exists and was not updated.`);
                                }
                                zipfile.readEntry();
                            }
                        });
                    }
                });
            });
        }).then(() => {
            pkg.tmpFile.removeCallback();
        });
    }
    AppendChannel(text) {
        if (this.outputChannel) {
            this.outputChannel.append(text);
        }
    }
    AppendLineChannel(text) {
        if (this.outputChannel) {
            this.outputChannel.appendLine(text);
        }
    }
}
exports.PackageManager = PackageManager;
//# sourceMappingURL=packageManager.js.map