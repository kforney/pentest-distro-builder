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
const vscode_1 = require("vscode");
const constants_1 = require("../../common/constants");
const types_1 = require("../../common/types");
const types_2 = require("../../ioc/types");
const types_3 = require("./types");
let ApplicationDiagnostics = class ApplicationDiagnostics {
    constructor(serviceContainer) {
        this.serviceContainer = serviceContainer;
    }
    performPreStartupHealthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            const diagnosticsServices = this.serviceContainer.getAll(types_3.IDiagnosticsService);
            yield Promise.all(diagnosticsServices.map((diagnosticsService) => __awaiter(this, void 0, void 0, function* () {
                const diagnostics = yield diagnosticsService.diagnose();
                this.log(diagnostics);
                if (diagnostics.length > 0) {
                    yield diagnosticsService.handle(diagnostics);
                }
            })));
        });
    }
    log(diagnostics) {
        const logger = this.serviceContainer.get(types_1.ILogger);
        const outputChannel = this.serviceContainer.get(types_1.IOutputChannel, constants_1.STANDARD_OUTPUT_CHANNEL);
        diagnostics.forEach(item => {
            const message = `Diagnostic Code: ${item.code}, Message: ${item.message}`;
            switch (item.severity) {
                case vscode_1.DiagnosticSeverity.Error: {
                    logger.logError(message);
                    outputChannel.appendLine(message);
                    break;
                }
                case vscode_1.DiagnosticSeverity.Warning: {
                    logger.logWarning(message);
                    outputChannel.appendLine(message);
                    break;
                }
                default: {
                    logger.logInformation(message);
                }
            }
        });
    }
};
ApplicationDiagnostics = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_2.IServiceContainer))
], ApplicationDiagnostics);
exports.ApplicationDiagnostics = ApplicationDiagnostics;
//# sourceMappingURL=applicationDiagnostics.js.map