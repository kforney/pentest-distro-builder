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
const url = require("url");
const https = require("https");
const vscode = require("vscode");
const fs = require("fs");
const util = require("./common");
const Telemetry = require("./telemetry");
const persistentState_1 = require("./LanguageServer/persistentState");
const userBucketMax = 100;
const userBucketString = "CPP.UserBucket";
const localConfigFile = "cpptools.json";
class ABTestSettings {
    constructor() {
        this.intelliSenseEngineDefault = new persistentState_1.PersistentState("ABTest.1", 100);
        this.recursiveIncludesDefault = new persistentState_1.PersistentState("ABTest.2", 100);
        this.settings = {
            defaultIntelliSenseEngine: this.intelliSenseEngineDefault.Value,
            recursiveIncludes: this.recursiveIncludesDefault.Value
        };
        this.bucket = new persistentState_1.PersistentState(userBucketString, -1);
        if (this.bucket.Value === -1) {
            this.bucket.Value = Math.floor(Math.random() * userBucketMax) + 1;
        }
        this.updateSettingsAsync().then(() => {
            this.downloadCpptoolsJsonPkgAsync();
        });
        setInterval(() => { this.downloadCpptoolsJsonPkgAsync(); }, 30 * 60 * 1000);
    }
    get UseDefaultIntelliSenseEngine() {
        return this.settings.defaultIntelliSenseEngine ? this.settings.defaultIntelliSenseEngine >= this.bucket.Value : true;
    }
    get UseRecursiveIncludes() {
        return this.settings.recursiveIncludes ? this.settings.recursiveIncludes >= this.bucket.Value : true;
    }
    updateSettingsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const cpptoolsJsonFile = util.getExtensionFilePath(localConfigFile);
            try {
                const exists = yield util.checkFileExists(cpptoolsJsonFile);
                if (exists) {
                    const fileContent = yield util.readFileText(cpptoolsJsonFile);
                    let newSettings = JSON.parse(fileContent);
                    if (newSettings.defaultIntelliSenseEngine) {
                        this.intelliSenseEngineDefault.Value = newSettings.defaultIntelliSenseEngine;
                    }
                    if (newSettings.recursiveIncludes) {
                        this.recursiveIncludesDefault.Value = newSettings.recursiveIncludes;
                    }
                    this.settings = {
                        defaultIntelliSenseEngine: this.intelliSenseEngineDefault.Value,
                        recursiveIncludes: this.recursiveIncludesDefault.Value
                    };
                }
            }
            catch (error) {
            }
        });
    }
    downloadCpptoolsJsonAsync(urlString) {
        return new Promise((resolve, reject) => {
            let parsedUrl = url.parse(urlString);
            let request = https.request({
                host: parsedUrl.host,
                path: parsedUrl.path,
                agent: util.getHttpsProxyAgent(),
                rejectUnauthorized: vscode.workspace.getConfiguration().get("http.proxyStrictSSL", true)
            }, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    let redirectUrl;
                    if (typeof response.headers.location === "string") {
                        redirectUrl = response.headers.location;
                    }
                    else {
                        redirectUrl = response.headers.location[0];
                    }
                    return resolve(this.downloadCpptoolsJsonAsync(redirectUrl));
                }
                if (response.statusCode !== 200) {
                    return reject();
                }
                let downloadedBytes = 0;
                let cppToolsJsonFile = fs.createWriteStream(util.getExtensionFilePath(localConfigFile));
                response.on('data', (data) => { downloadedBytes += data.length; });
                response.on('end', () => { cppToolsJsonFile.close(); });
                cppToolsJsonFile.on('close', () => { resolve(); this.updateSettingsAsync(); });
                response.on('error', (error) => { reject(); });
                response.pipe(cppToolsJsonFile, { end: false });
            });
            request.on('error', (error) => { reject(); });
            request.end();
        });
    }
    downloadCpptoolsJsonPkgAsync() {
        let hasError = false;
        let telemetryProperties = {};
        return this.downloadCpptoolsJsonAsync("https://go.microsoft.com/fwlink/?linkid=852750")
            .catch((error) => {
            hasError = true;
        })
            .then(() => {
            telemetryProperties['success'] = (!hasError).toString();
            Telemetry.logDebuggerEvent("cpptoolsJsonDownload", telemetryProperties);
        });
    }
}
exports.ABTestSettings = ABTestSettings;
let settings;
function getABTestSettings() {
    if (!settings) {
        settings = new ABTestSettings();
    }
    return settings;
}
exports.getABTestSettings = getABTestSettings;
//# sourceMappingURL=abTesting.js.map