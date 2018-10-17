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
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const path = require("path");
const registry_1 = require("../../common/platform/registry");
const types_1 = require("../../common/platform/types");
const utils_1 = require("../../common/utils");
const types_2 = require("../../ioc/types");
const contracts_1 = require("../contracts");
const CheckPythonInterpreterRegEx = utils_1.IS_WINDOWS ? /^python(\d+(.\d+)?)?\.exe$/ : /^python(\d+(.\d+)?)?$/;
function lookForInterpretersInDirectory(pathToCheck) {
    return utils_1.fsReaddirAsync(pathToCheck)
        .then(subDirs => subDirs.filter(fileName => CheckPythonInterpreterRegEx.test(path.basename(fileName))))
        .catch(err => {
        console.error('Python Extension (lookForInterpretersInDirectory.fsReaddirAsync):', err);
        return [];
    });
}
exports.lookForInterpretersInDirectory = lookForInterpretersInDirectory;
function fixInterpreterDisplayName(item) {
    if (!item.displayName) {
        const arch = registry_1.getArchitectureDislayName(item.architecture);
        const version = typeof item.version === 'string' ? item.version : '';
        const prefix = version.toUpperCase().startsWith('PYTHON') ? '' : 'Python';
        item.displayName = [prefix, version, arch].filter(namePart => namePart.length > 0).join(' ').trim();
    }
    return item;
}
exports.fixInterpreterDisplayName = fixInterpreterDisplayName;
let InterpreterLocatorHelper = class InterpreterLocatorHelper {
    constructor(serviceContainer) {
        this.platform = serviceContainer.get(types_1.IPlatformService);
        this.helper = serviceContainer.get(contracts_1.IInterpreterHelper);
        this.fs = serviceContainer.get(types_1.IFileSystem);
    }
    mergeInterpreters(interpreters) {
        return interpreters
            .map(item => { return Object.assign({}, item); })
            .map(fixInterpreterDisplayName)
            .map(item => { item.path = path.normalize(item.path); return item; })
            .reduce((accumulator, current) => {
            if (this.platform.isMac && this.helper.isMacDefaultPythonPath(current.path)) {
                return accumulator;
            }
            const currentVersion = Array.isArray(current.version_info) ? current.version_info.join('.') : undefined;
            const existingItem = accumulator.find(item => {
                // If same version and same base path, then ignore.
                // Could be Python 3.6 with path = python.exe, and Python 3.6 and path = python3.exe.
                if (Array.isArray(item.version_info) && item.version_info.join('.') === currentVersion &&
                    item.path && current.path &&
                    this.fs.arePathsSame(path.dirname(item.path), path.dirname(current.path))) {
                    return true;
                }
                return false;
            });
            if (!existingItem) {
                accumulator.push(current);
            }
            else {
                // Preserve type information.
                // Possible we identified environment as unknown, but a later provider has identified env type.
                if (existingItem.type === contracts_1.InterpreterType.Unknown && current.type !== contracts_1.InterpreterType.Unknown) {
                    existingItem.type = current.type;
                }
            }
            return accumulator;
        }, []);
    }
};
InterpreterLocatorHelper = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_2.IServiceContainer))
], InterpreterLocatorHelper);
exports.InterpreterLocatorHelper = InterpreterLocatorHelper;
//# sourceMappingURL=helpers.js.map