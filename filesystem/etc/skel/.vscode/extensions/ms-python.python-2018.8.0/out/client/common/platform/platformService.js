// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const osinfo = require("./osinfo");
let PlatformService = class PlatformService {
    get os() {
        if (!this.info) {
            this.info = osinfo.getOSInfo();
        }
        return this.info;
    }
    get pathVariableName() {
        return osinfo.getPathVariableName(this.os);
    }
    get virtualEnvBinName() {
        return osinfo.getVirtualEnvBinName(this.os);
    }
    // tslint:disable-next-line: no-suspicious-comment
    // TODO: Drop the following (in favor of osType).
    get isWindows() {
        return osinfo.isWindows(this.os);
    }
    get isMac() {
        return osinfo.isMac(this.os);
    }
    get isLinux() {
        return osinfo.isLinux(this.os);
    }
    get is64bit() {
        return osinfo.is64bit(this.os);
    }
};
PlatformService = __decorate([
    inversify_1.injectable()
], PlatformService);
exports.PlatformService = PlatformService;
//# sourceMappingURL=platformService.js.map