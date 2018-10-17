"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
var Architecture;
(function (Architecture) {
    Architecture[Architecture["Unknown"] = 1] = "Unknown";
    Architecture[Architecture["x86"] = 2] = "x86";
    Architecture[Architecture["x64"] = 3] = "x64";
})(Architecture = exports.Architecture || (exports.Architecture = {}));
var OSType;
(function (OSType) {
    OSType[OSType["Unknown"] = 0] = "Unknown";
    OSType[OSType["Windows"] = 1] = "Windows";
    OSType[OSType["OSX"] = 2] = "OSX";
    OSType[OSType["Linux"] = 3] = "Linux";
})(OSType = exports.OSType || (exports.OSType = {}));
var OSDistro;
(function (OSDistro) {
    OSDistro[OSDistro["Unknown"] = 0] = "Unknown";
    // linux:
    OSDistro[OSDistro["Ubuntu"] = 1] = "Ubuntu";
    OSDistro[OSDistro["Debian"] = 2] = "Debian";
    OSDistro[OSDistro["RHEL"] = 3] = "RHEL";
    OSDistro[OSDistro["Fedora"] = 4] = "Fedora";
    OSDistro[OSDistro["CentOS"] = 5] = "CentOS";
    // The remainder aren't officially supported.
    // See: https://code.visualstudio.com/docs/supporting/requirements
    OSDistro[OSDistro["Suse"] = 6] = "Suse";
    OSDistro[OSDistro["Gentoo"] = 7] = "Gentoo";
    OSDistro[OSDistro["Arch"] = 8] = "Arch";
})(OSDistro = exports.OSDistro || (exports.OSDistro = {}));
exports.IOSInfo = Symbol('IOSInfo');
var RegistryHive;
(function (RegistryHive) {
    RegistryHive[RegistryHive["HKCU"] = 0] = "HKCU";
    RegistryHive[RegistryHive["HKLM"] = 1] = "HKLM";
})(RegistryHive = exports.RegistryHive || (exports.RegistryHive = {}));
exports.IRegistry = Symbol('IRegistry');
exports.IPlatformService = Symbol('IPlatformService');
exports.IFileSystem = Symbol('IFileSystem');
//# sourceMappingURL=types.js.map