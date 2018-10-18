"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const path = require("path");
const types_1 = require("../../../common/platform/types");
const types_2 = require("../../../common/process/types");
const types_3 = require("../../../common/types");
const versionUtils_1 = require("../../../common/versionUtils");
const types_4 = require("../../../ioc/types");
const contracts_1 = require("../../contracts");
const condaHelper_1 = require("./condaHelper");
// tslint:disable-next-line:no-require-imports no-var-requires
const untildify = require('untildify');
// This glob pattern will match all of the following:
// ~/anaconda/bin/conda, ~/anaconda3/bin/conda, ~/miniconda/bin/conda, ~/miniconda3/bin/conda
exports.CondaLocationsGlob = '~/*conda*/bin/conda';
/**
 * A wrapper around a conda installation.
 */
let CondaService = class CondaService {
    constructor(serviceContainer, registryLookupForConda) {
        this.serviceContainer = serviceContainer;
        this.registryLookupForConda = registryLookupForConda;
        this.condaHelper = new condaHelper_1.CondaHelper();
        this.processServiceFactory = this.serviceContainer.get(types_2.IProcessServiceFactory);
        this.platform = this.serviceContainer.get(types_1.IPlatformService);
        this.logger = this.serviceContainer.get(types_3.ILogger);
        this.fileSystem = this.serviceContainer.get(types_1.IFileSystem);
    }
    get condaEnvironmentsFile() {
        const homeDir = this.platform.isWindows ? process.env.USERPROFILE : (process.env.HOME || process.env.HOMEPATH);
        return homeDir ? path.join(homeDir, '.conda', 'environments.txt') : undefined;
    }
    /**
     * Release any held resources.
     *
     * Called by VS Code to indicate it is done with the resource.
     */
    // tslint:disable-next-line:no-empty
    dispose() { }
    /**
     * Return the path to the "conda file".
     */
    getCondaFile() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.condaFile) {
                this.condaFile = this.getCondaFileImpl();
            }
            // tslint:disable-next-line:no-unnecessary-local-variable
            const condaFile = yield this.condaFile;
            return condaFile;
        });
    }
    /**
     * Is there a conda install to use?
     */
    isCondaAvailable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.isAvailable === 'boolean') {
                return this.isAvailable;
            }
            return this.getCondaVersion()
                .then(version => this.isAvailable = typeof version === 'string')
                .catch(() => this.isAvailable = false);
        });
    }
    /**
     * Return the conda version.
     */
    getCondaVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const processService = yield this.processServiceFactory.create();
            return this.getCondaFile()
                .then(condaFile => processService.exec(condaFile, ['--version'], {}))
                .then(result => result.stdout.trim())
                .catch(() => undefined);
        });
    }
    /**
     * Can the shell find conda (to run it)?
     */
    isCondaInCurrentPath() {
        return __awaiter(this, void 0, void 0, function* () {
            const processService = yield this.processServiceFactory.create();
            return processService.exec('conda', ['--version'])
                .then(output => output.stdout.length > 0)
                .catch(() => false);
        });
    }
    /**
     * Return the info reported by the conda install.
     */
    getCondaInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const condaFile = yield this.getCondaFile();
                const processService = yield this.processServiceFactory.create();
                const condaInfo = yield processService.exec(condaFile, ['info', '--json']).then(output => output.stdout);
                return JSON.parse(condaInfo);
            }
            catch (ex) {
                // Failed because either:
                //   1. conda is not installed.
                //   2. `conda info --json` has changed signature.
            }
        });
    }
    /**
     * Determines whether a python interpreter is a conda environment or not.
     * The check is done by simply looking for the 'conda-meta' directory.
     * @param {string} interpreterPath
     * @returns {Promise<boolean>}
     * @memberof CondaService
     */
    isCondaEnvironment(interpreterPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const fs = this.serviceContainer.get(types_1.IFileSystem);
            const dir = path.dirname(interpreterPath);
            const isWindows = this.serviceContainer.get(types_1.IPlatformService).isWindows;
            const condaMetaDirectory = isWindows ? path.join(dir, 'conda-meta') : path.join(dir, '..', 'conda-meta');
            return fs.directoryExists(condaMetaDirectory);
        });
    }
    /**
     * Return (env name, interpreter filename) for the interpreter.
     */
    getCondaEnvironment(interpreterPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const isCondaEnv = yield this.isCondaEnvironment(interpreterPath);
            if (!isCondaEnv) {
                return;
            }
            let environments = yield this.getCondaEnvironments(false);
            const dir = path.dirname(interpreterPath);
            // If interpreter is in bin or Scripts, then go up one level
            const subDirName = path.basename(dir);
            const goUpOnLevel = ['BIN', 'SCRIPTS'].indexOf(subDirName.toUpperCase()) !== -1;
            const interpreterPathToMatch = goUpOnLevel ? path.join(dir, '..') : dir;
            const fs = this.serviceContainer.get(types_1.IFileSystem);
            // From the list of conda environments find this dir.
            let matchingEnvs = Array.isArray(environments) ? environments.filter(item => fs.arePathsSame(item.path, interpreterPathToMatch)) : [];
            if (matchingEnvs.length === 0) {
                environments = yield this.getCondaEnvironments(true);
                matchingEnvs = Array.isArray(environments) ? environments.filter(item => fs.arePathsSame(item.path, interpreterPathToMatch)) : [];
            }
            if (matchingEnvs.length > 0) {
                return { name: matchingEnvs[0].name, path: interpreterPathToMatch };
            }
            // If still not available, then the user created the env after starting vs code.
            // The only solution is to get the user to re-start vscode.
        });
    }
    /**
     * Return the list of conda envs (by name, interpreter filename).
     */
    getCondaEnvironments(ignoreCache) {
        return __awaiter(this, void 0, void 0, function* () {
            // Global cache.
            const persistentFactory = this.serviceContainer.get(types_3.IPersistentStateFactory);
            // tslint:disable-next-line:no-any
            const globalPersistence = persistentFactory.createGlobalPersistentState('CONDA_ENVIRONMENTS', undefined);
            if (!ignoreCache && globalPersistence.value) {
                return globalPersistence.value.data;
            }
            try {
                const condaFile = yield this.getCondaFile();
                const processService = yield this.processServiceFactory.create();
                const envInfo = yield processService.exec(condaFile, ['env', 'list']).then(output => output.stdout);
                const environments = this.condaHelper.parseCondaEnvironmentNames(envInfo);
                yield globalPersistence.updateValue({ data: environments });
                return environments;
            }
            catch (ex) {
                yield globalPersistence.updateValue({ data: undefined });
                // Failed because either:
                //   1. conda is not installed.
                //   2. `conda env list has changed signature.
                this.logger.logInformation('Failed to get conda environment list from conda', ex);
            }
        });
    }
    /**
     * Return the interpreter's filename for the given environment.
     */
    getInterpreterPath(condaEnvironmentPath) {
        // where to find the Python binary within a conda env.
        const relativePath = this.platform.isWindows ? 'python.exe' : path.join('bin', 'python');
        return path.join(condaEnvironmentPath, relativePath);
    }
    /**
     * Is the given interpreter from conda?
     */
    detectCondaEnvironment(interpreter) {
        return (interpreter.displayName ? interpreter.displayName : '').toUpperCase().indexOf('ANACONDA') >= 0 ||
            (interpreter.companyDisplayName ? interpreter.companyDisplayName : '').toUpperCase().indexOf('CONTINUUM') >= 0;
    }
    /**
     * Return the highest Python version from the given list.
     */
    getLatestVersion(interpreters) {
        const sortedInterpreters = interpreters.filter(interpreter => interpreter.version && interpreter.version.length > 0);
        // tslint:disable-next-line:no-non-null-assertion
        sortedInterpreters.sort((a, b) => versionUtils_1.VersionUtils.compareVersion(a.version, b.version));
        if (sortedInterpreters.length > 0) {
            return sortedInterpreters[sortedInterpreters.length - 1];
        }
    }
    /**
     * Return the path to the "conda file", if there is one (in known locations).
     */
    getCondaFileImpl() {
        return __awaiter(this, void 0, void 0, function* () {
            const isAvailable = yield this.isCondaInCurrentPath();
            if (isAvailable) {
                return 'conda';
            }
            if (this.platform.isWindows && this.registryLookupForConda) {
                return this.registryLookupForConda.getInterpreters()
                    .then(interpreters => interpreters.filter(this.detectCondaEnvironment))
                    .then(condaInterpreters => this.getLatestVersion(condaInterpreters))
                    .then(condaInterpreter => {
                    return condaInterpreter ? path.join(path.dirname(condaInterpreter.path), 'conda.exe') : 'conda';
                })
                    .then((condaPath) => __awaiter(this, void 0, void 0, function* () {
                    return this.fileSystem.fileExists(condaPath).then(exists => exists ? condaPath : 'conda');
                }));
            }
            return this.getCondaFileFromKnownLocations();
        });
    }
    /**
     * Return the path to the "conda file", if there is one (in known locations).
     */
    getCondaFileFromKnownLocations() {
        return __awaiter(this, void 0, void 0, function* () {
            const condaFiles = yield this.fileSystem.search(untildify(exports.CondaLocationsGlob))
                .catch(() => []);
            const validCondaFiles = condaFiles.filter(condaPath => condaPath.length > 0);
            return validCondaFiles.length === 0 ? 'conda' : validCondaFiles[0];
        });
    }
};
CondaService = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_4.IServiceContainer)),
    __param(1, inversify_1.inject(contracts_1.IInterpreterLocatorService)), __param(1, inversify_1.named(contracts_1.WINDOWS_REGISTRY_SERVICE)), __param(1, inversify_1.optional())
], CondaService);
exports.CondaService = CondaService;
//# sourceMappingURL=condaService.js.map