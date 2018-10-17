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
const core_utils_1 = require("../../common/core.utils");
const types_1 = require("../../common/platform/types");
const types_2 = require("../../ioc/types");
const constants_1 = require("../common/constants");
const types_3 = require("../common/types");
const types_4 = require("../types");
const JunitXmlArg = '--junitxml';
let TestManagerRunner = class TestManagerRunner {
    constructor(serviceContainer) {
        this.serviceContainer = serviceContainer;
        this.argsService = serviceContainer.get(types_4.IArgumentsService, constants_1.PYTEST_PROVIDER);
        this.argsHelper = serviceContainer.get(types_4.IArgumentsHelper);
        this.testRunner = serviceContainer.get(types_3.ITestRunner);
        this.xUnitParser = this.serviceContainer.get(types_3.IXUnitParser);
        this.fs = this.serviceContainer.get(types_1.IFileSystem);
    }
    runTest(testResultsService, options, _) {
        return __awaiter(this, void 0, void 0, function* () {
            let testPaths = [];
            if (options.testsToRun && options.testsToRun.testFolder) {
                testPaths = testPaths.concat(options.testsToRun.testFolder.map(f => f.nameToRun));
            }
            if (options.testsToRun && options.testsToRun.testFile) {
                testPaths = testPaths.concat(options.testsToRun.testFile.map(f => f.nameToRun));
            }
            if (options.testsToRun && options.testsToRun.testSuite) {
                testPaths = testPaths.concat(options.testsToRun.testSuite.map(f => f.nameToRun));
            }
            if (options.testsToRun && options.testsToRun.testFunction) {
                testPaths = testPaths.concat(options.testsToRun.testFunction.map(f => f.nameToRun));
            }
            let deleteJUnitXmlFile = core_utils_1.noop;
            const args = options.args;
            try {
                const xmlLogResult = yield this.getJUnitXmlFile(args);
                const xmlLogFile = xmlLogResult.filePath;
                deleteJUnitXmlFile = xmlLogResult.dispose;
                // Remove the '--junixml' if it exists, and add it with our path.
                const testArgs = this.argsService.filterArguments(args, [JunitXmlArg]);
                testArgs.splice(0, 0, `${JunitXmlArg}=${xmlLogFile}`);
                // Positional arguments control the tests to be run.
                testArgs.push(...testPaths);
                if (options.debug) {
                    const debugLauncher = this.serviceContainer.get(types_3.ITestDebugLauncher);
                    const debuggerArgs = [options.cwd, 'pytest'].concat(testArgs);
                    const launchOptions = { cwd: options.cwd, args: debuggerArgs, token: options.token, outChannel: options.outChannel, testProvider: constants_1.PYTEST_PROVIDER };
                    yield debugLauncher.launchDebugger(launchOptions);
                }
                else {
                    const runOptions = {
                        args: testArgs,
                        cwd: options.cwd,
                        outChannel: options.outChannel,
                        token: options.token,
                        workspaceFolder: options.workspaceFolder
                    };
                    yield this.testRunner.run(constants_1.PYTEST_PROVIDER, runOptions);
                }
                return options.debug ? options.tests : yield this.updateResultsFromLogFiles(options.tests, xmlLogFile, testResultsService);
            }
            catch (ex) {
                return Promise.reject(ex);
            }
            finally {
                deleteJUnitXmlFile();
            }
        });
    }
    updateResultsFromLogFiles(tests, outputXmlFile, testResultsService) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.xUnitParser.updateResultsFromXmlLogFile(tests, outputXmlFile, types_3.PassCalculationFormulae.pytest);
            testResultsService.updateResults(tests);
            return tests;
        });
    }
    getJUnitXmlFile(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const xmlFile = this.argsHelper.getOptionValues(args, JunitXmlArg);
            if (typeof xmlFile === 'string') {
                return { filePath: xmlFile, dispose: core_utils_1.noop };
            }
            return this.fs.createTemporaryFile('.xml');
        });
    }
};
TestManagerRunner = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_2.IServiceContainer))
], TestManagerRunner);
exports.TestManagerRunner = TestManagerRunner;
//# sourceMappingURL=runner.js.map