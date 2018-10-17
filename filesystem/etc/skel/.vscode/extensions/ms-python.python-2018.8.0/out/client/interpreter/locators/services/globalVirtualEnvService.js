// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
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
const os = require("os");
const path = require("path");
const types_1 = require("../../../common/types");
const types_2 = require("../../../ioc/types");
const contracts_1 = require("../../contracts");
const baseVirtualEnvService_1 = require("./baseVirtualEnvService");
let GlobalVirtualEnvService = class GlobalVirtualEnvService extends baseVirtualEnvService_1.BaseVirtualEnvService {
    constructor(globalVirtualEnvPathProvider, serviceContainer) {
        super(globalVirtualEnvPathProvider, serviceContainer, 'VirtualEnvService');
    }
};
GlobalVirtualEnvService = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(contracts_1.IVirtualEnvironmentsSearchPathProvider)), __param(0, inversify_1.named('global')),
    __param(1, inversify_1.inject(types_2.IServiceContainer))
], GlobalVirtualEnvService);
exports.GlobalVirtualEnvService = GlobalVirtualEnvService;
let GlobalVirtualEnvironmentsSearchPathProvider = class GlobalVirtualEnvironmentsSearchPathProvider {
    constructor(serviceContainer) {
        this.process = serviceContainer.get(types_1.ICurrentProcess);
        this.config = serviceContainer.get(types_1.IConfigurationService);
    }
    getSearchPaths(_resource) {
        const homedir = os.homedir();
        const venvFolders = this.config.getSettings(_resource).venvFolders;
        const folders = venvFolders.map(item => path.join(homedir, item));
        // tslint:disable-next-line:no-string-literal
        const pyenvRoot = this.process.env['PYENV_ROOT'];
        if (pyenvRoot) {
            folders.push(pyenvRoot);
            folders.push(path.join(pyenvRoot, 'versions'));
        }
        else {
            // Check if .pyenv/versions is in the list
            const pyenvVersions = path.join('.pyenv', 'versions');
            if (venvFolders.indexOf('.pyenv') >= 0 && venvFolders.indexOf(pyenvVersions) < 0) {
                // if .pyenv is in the list, but .pyenv/versions is not, add it.
                folders.push(path.join(homedir, pyenvVersions));
            }
        }
        return folders;
    }
};
GlobalVirtualEnvironmentsSearchPathProvider = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_2.IServiceContainer))
], GlobalVirtualEnvironmentsSearchPathProvider);
exports.GlobalVirtualEnvironmentsSearchPathProvider = GlobalVirtualEnvironmentsSearchPathProvider;
//# sourceMappingURL=globalVirtualEnvService.js.map