'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_debugadapter_1 = require("vscode-debugadapter");
const fs_1 = require("fs");
const path_1 = require("path");
const path = require("path");
const ruby_1 = require("./ruby");
const common_1 = require("./common");
const helper_1 = require("./helper");
class CachedBreakpoint {
    constructor(line, column, condition, id) {
        this.line = line;
        this.column = column;
        this.condition = condition;
        this.id = id;
    }
    static fromSourceBreakpoint(sourceBreakpoint) {
        return new CachedBreakpoint(sourceBreakpoint.line, sourceBreakpoint.column, sourceBreakpoint.condition);
    }
    convertForResponse() {
        var result = new vscode_debugadapter_1.Breakpoint(true, this.line, this.column);
        result.id = this.id;
        return result;
    }
}
class RubyDebugSession extends vscode_debugadapter_1.DebugSession {
    /**
     * Creates a new debug adapter.
     * We configure the default implementation of a debug adapter here
     * by specifying this this 'debugger' uses zero-based lines and columns.
     */
    constructor() {
        super();
        this._breakpointId = 1000;
        this._threadId = 2;
        this._frameId = 0;
        this._firstSuspendReceived = false;
        this._activeFileData = new Map();
        this._existingBreakpoints = new Map();
        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(false);
        this._variableHandles = new vscode_debugadapter_1.Handles();
    }
    /**
     * The 'initialize' request is the first request called by the frontend
     * to interrogate the features the debug adapter provides.
     */
    initializeRequest(response, args) {
        // This debug adapter implements the configurationDoneRequest.
        response.body.supportsConfigurationDoneRequest = true;
        //response.body.supportsFunctionBreakpoints = true;
        response.body.supportsConditionalBreakpoints = true;
        this.sendResponse(response);
    }
    setupProcessHanlders() {
        this.rubyProcess.on('debuggerComplete', () => {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        }).on('debuggerProcessExit', () => {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        }).on('executableOutput', (data) => {
            this.sendEvent(new vscode_debugadapter_1.OutputEvent(data.toString(), 'stdout'));
        }).on('executableStdErr', (error) => {
            this.sendEvent(new vscode_debugadapter_1.OutputEvent(error.toString(), 'stderr'));
        }).on('nonTerminalError', (error) => {
            this.sendEvent(new vscode_debugadapter_1.OutputEvent("Debugger error: " + error + '\n', 'stderr'));
        }).on('breakpoint', result => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('breakpoint', result.threadId));
        }).on('exception', result => {
            this.sendEvent(new vscode_debugadapter_1.OutputEvent("\nException raised: [" + result.type + "]: " + result.message + "\n", 'stderr'));
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('exception', result.threadId, result.type + ": " + result.message));
        }).on('terminalError', (error) => {
            this.sendEvent(new vscode_debugadapter_1.OutputEvent("Debugger terminal error: " + error));
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        });
    }
    launchRequest(response, args) {
        this.debugMode = common_1.Mode.launch;
        this.requestArguments = args;
        this.rubyProcess = new ruby_1.RubyProcess(common_1.Mode.launch, args);
        this.rubyProcess.on('debuggerConnect', () => {
            this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
            this.sendResponse(response);
        }).on('suspended', result => {
            if (args.stopOnEntry && !this._firstSuspendReceived) {
                this.sendEvent(new vscode_debugadapter_1.StoppedEvent('entry', result.threadId));
            }
            else {
                this.sendEvent(new vscode_debugadapter_1.StoppedEvent('step', result.threadId));
            }
            this._firstSuspendReceived = true;
        });
        this.setupProcessHanlders();
        if (args.showDebuggerOutput) {
            this.rubyProcess.on('debuggerOutput', (data) => {
                this.sendEvent(new vscode_debugadapter_1.OutputEvent(data.toString() + '\n', 'console'));
            });
        }
    }
    attachRequest(response, args) {
        this.requestArguments = args;
        this.debugMode = common_1.Mode.attach;
        this.rubyProcess = new ruby_1.RubyProcess(common_1.Mode.attach, args);
        this.rubyProcess.on('debuggerConnect', () => {
            this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
            this.sendResponse(response);
        }).on('suspended', result => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('step', result.threadId));
        });
        this.setupProcessHanlders();
    }
    // Executed after all breakpints have been set by VS Code
    configurationDoneRequest(response, args) {
        this.rubyProcess.Run('start');
        this.sendResponse(response);
    }
    setExceptionBreakPointsRequest(response, args) {
        if (args.filters.indexOf('all') >= 0) {
            //Exception is the root of all (Ruby) exceptions - this is the best we can do
            //If someone makes their own exception class and doesn't inherit from
            //Exception, then they really didn't expect things to work properly
            //anyway.
            //We don't do anything with the return from this, but we
            //have to add an expectation for the output.
            this.rubyProcess.Enqueue('catch Exception').then(() => 1);
        }
        else {
            this.rubyProcess.Run('catch off');
        }
        this.sendResponse(response);
    }
    setBreakPointsRequest(response, args) {
        var key = this.convertClientPathToKey(args.source.path);
        var existingBreakpoints = this._existingBreakpoints.get(key) || [];
        var requestedBreakpoints = args.breakpoints.map(bp => CachedBreakpoint.fromSourceBreakpoint(bp));
        var existingLines = existingBreakpoints.map(bp => bp.line);
        var requestedLines = requestedBreakpoints.map(bp => bp.line);
        var breakpointsToRemove = existingBreakpoints.filter(bp => requestedLines.indexOf(bp.line) < 0);
        var breakpointsToAdd = requestedBreakpoints.filter(bp => existingLines.indexOf(bp.line) < 0);
        console.assert(breakpointsToRemove.length > 0 || breakpointsToAdd.length > 0);
        // Handle the removal of old breakpoints.
        if (breakpointsToRemove.length > 0) {
            var linesToRemove = breakpointsToRemove.map(bp => bp.line);
            existingBreakpoints = existingBreakpoints.filter(bp => linesToRemove.indexOf(bp.line) < 0);
            this._existingBreakpoints.set(key, existingBreakpoints);
            var removePromises = breakpointsToRemove.map(bp => this.rubyProcess.Enqueue('delete ' + bp.id));
            Promise.all(removePromises).then(results => {
                let removedIds = results.map(attr => +attr.no);
                let unremovedBreakpoints = breakpointsToRemove.filter(bp => removedIds.indexOf(bp.id) < 0);
                console.assert(unremovedBreakpoints.length == 0);
                response.body = {
                    breakpoints: existingBreakpoints.map(bp => bp.convertForResponse())
                };
                this.sendResponse(response);
            });
        }
        // Handle the addition of new breakpoints.
        if (breakpointsToAdd.length > 0) {
            var path = this.convertClientPathToDebugger(args.source.path);
            var addPromises = breakpointsToAdd.map(bp => {
                let command = 'break ' + path + ':' + bp.line;
                if (bp.condition)
                    command += ' if ' + bp.condition;
                return this.rubyProcess.Enqueue(command);
            });
            Promise.all(addPromises).then(results => {
                var addedBreakpoints = results.map(attr => {
                    var line = +(attr.location + '').split(':').pop();
                    var id = +attr.no;
                    return new CachedBreakpoint(line, null, null, id);
                });
                console.assert(addedBreakpoints.length == breakpointsToAdd.length);
                for (let index = 0; index < addedBreakpoints.length; ++index) {
                    console.assert(addedBreakpoints[index].line == breakpointsToAdd[index].line);
                    breakpointsToAdd[index].id = addedBreakpoints[index].id;
                }
                existingBreakpoints = existingBreakpoints.concat(breakpointsToAdd);
                this._existingBreakpoints.set(key, existingBreakpoints);
                response.body = {
                    breakpoints: existingBreakpoints.map(bp => bp.convertForResponse())
                };
                this.sendResponse(response);
            });
        }
    }
    threadsRequest(response) {
        this.rubyProcess.Enqueue('thread list').then(results => {
            if (results && results.length > 0) {
                this._threadId = results[0].id;
            }
            response.body = {
                threads: results.map(thread => new vscode_debugadapter_1.Thread(+thread.id, 'Thread ' + thread.id))
            };
            this.sendResponse(response);
        });
    }
    // Called by VS Code after a StoppedEvent
    /** StackTrace request; value of command field is 'stackTrace'.
        The request returns a stacktrace from the current execution state.
    */
    stackTraceRequest(response, args) {
        this.rubyProcess.Enqueue('where').then(results => {
            //drop rdbug frames
            results = results.filter(stack => !(helper_1.endsWith(stack.file, '/rdebug-ide', null) ||
                helper_1.endsWith(stack.file, '/ruby-debug-ide.rb', null)));
            //get the current frame
            results.some(stack => stack.current ? this._frameId = +stack.no : 0);
            //only read the file if we don't have it already
            results.forEach(stack => {
                const filePath = this.convertDebuggerPathToClient(stack.file);
                if (!this._activeFileData.has(filePath) && fs_1.existsSync(filePath)) {
                    this._activeFileData.set(filePath, fs_1.readFileSync(filePath, 'utf8').split('\n'));
                }
            });
            response.body = {
                stackFrames: results.filter(stack => stack.file.indexOf('debug-ide') < 0 && +stack.line > 0)
                    .map(stack => {
                    const filePath = this.convertDebuggerPathToClient(stack.file);
                    const fileData = this._activeFileData.get(filePath);
                    const gemFilePaths = filePath.split('/gems/');
                    const gemFilePath = gemFilePaths[gemFilePaths.length - 1];
                    return new vscode_debugadapter_1.StackFrame(+stack.no, fileData ? fileData[+stack.line - 1].trim() : (gemFilePath + ':' + stack.line), fileData ? new vscode_debugadapter_1.Source(path_1.basename(stack.file), filePath) : null, this.convertDebuggerLineToClient(+stack.line), 0);
                })
            };
            if (response.body.stackFrames.length) {
                this.sendResponse(response);
            }
            else {
                this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
            }
            return;
        });
    }
    convertClientPathToKey(localPath) {
        return localPath.replace(/\\/g, '/');
    }
    convertClientPathToDebugger(localPath) {
        if (this.debugMode == common_1.Mode.launch) {
            return localPath;
        }
        if (!localPath.startsWith(this.requestArguments.cwd)) {
            return localPath;
        }
        var relativePath = path.join(this.requestArguments.remoteWorkspaceRoot, localPath.substring(this.requestArguments.cwd.length));
        var sepIndex = this.requestArguments.remoteWorkspaceRoot.lastIndexOf('/');
        if (sepIndex !== -1) {
            // *inx or darwin
            relativePath = relativePath.replace(/\\/g, '/');
        }
        return relativePath;
    }
    convertDebuggerPathToClient(serverPath) {
        if (this.debugMode == common_1.Mode.launch) {
            return serverPath;
        }
        if (!serverPath.startsWith(this.requestArguments.remoteWorkspaceRoot)) {
            return serverPath;
        }
        // Path.join will convert the path using local OS preferred separator
        var relativePath = path.join(this.requestArguments.cwd, serverPath.substring(this.requestArguments.remoteWorkspaceRoot.length));
        return relativePath;
    }
    switchFrame(frameId) {
        if (frameId === this._frameId)
            return;
        this._frameId = frameId;
        this.rubyProcess.Run('frame ' + frameId);
    }
    varyVariable(variable) {
        if (variable.type === 'String') {
            variable.hasChildren = false;
            variable.value = "'" + variable.value.replace(/'/g, "\\'") + "'";
        }
        else if (variable.value && helper_1.startsWith(variable.value, '#<' + variable.type, 0)) {
            variable.value = variable.type;
        }
        return variable;
    }
    createVariableReference(variables) {
        if (!Array.isArray(variables)) {
            variables = [];
        }
        return variables.map(this.varyVariable).map(variable => ({
            name: variable.name,
            kind: variable.kind,
            type: variable.type,
            value: variable.value === undefined ? 'undefined' : variable.value,
            id: variable.objectId,
            variablesReference: variable.hasChildren === 'true' ? this._variableHandles.create({ objectId: variable.objectId }) : 0
        }));
    }
    /** Scopes request; value of command field is 'scopes'.
       The request returns the variable scopes for a given stackframe ID.
    */
    scopesRequest(response, args) {
        //this doesn't work properly across threads.
        this.switchFrame(args.frameId);
        Promise.all([
            this.rubyProcess.Enqueue('var local'),
            this.rubyProcess.Enqueue('var global')
        ])
            .then(results => {
            const scopes = new Array();
            scopes.push(new vscode_debugadapter_1.Scope('Local', this._variableHandles.create({ variables: this.createVariableReference(results[0]) }), false));
            scopes.push(new vscode_debugadapter_1.Scope('Global', this._variableHandles.create({ variables: this.createVariableReference(results[1]) }), false));
            response.body = {
                scopes: scopes
            };
            this.sendResponse(response);
        });
    }
    variablesRequest(response, args) {
        var varRef = this._variableHandles.get(args.variablesReference);
        let varPromise;
        if (varRef.objectId) {
            varPromise = this.rubyProcess.Enqueue('var i ' + varRef.objectId).then(results => this.createVariableReference(results));
        }
        else {
            varPromise = Promise.resolve(varRef.variables);
        }
        varPromise.then(variables => {
            response.body = {
                variables: variables
            };
            this.sendResponse(response);
        });
    }
    continueRequest(response, args) {
        this.sendResponse(response);
        this.rubyProcess.Run('c');
    }
    nextRequest(response, args) {
        this.sendResponse(response);
        this.rubyProcess.Run('next');
    }
    stepInRequest(response) {
        this.sendResponse(response);
        this.rubyProcess.Run('step');
    }
    pauseRequest(response) {
        this.sendResponse(response);
        this.rubyProcess.Run('pause');
    }
    stepOutRequest(response) {
        this.sendResponse(response);
        //Not sure which command we should use, `finish` will execute all frames.
        this.rubyProcess.Run('finish');
    }
    /** Evaluate request; value of command field is 'evaluate'.
        Evaluates the given expression in the context of the top most stack frame.
        The expression has access to any variables and arguments this are in scope.
    */
    evaluateRequest(response, args) {
        // TODO: this will often not work. Will try to call
        // Class.@variable which doesn't work.
        // need to tie it to the existing variablesReference set
        // That will required having ALL variables stored, which will also (hopefully) fix
        // the variable value mismatch between threads
        this.rubyProcess.Enqueue("eval " + args.expression).then(result => {
            response.body = {
                result: result.value
                    ? result.value
                    : (result.length > 0 && result[0].value
                        ? result[0].value
                        : "Not available"),
                variablesReference: 0,
            };
            this.sendResponse(response);
        });
    }
    disconnectRequest(response, args) {
        if (this.rubyProcess.state !== common_1.SocketClientState.closed) {
            this.rubyProcess.Run('quit');
        }
        this.sendResponse(response);
    }
}
vscode_debugadapter_1.DebugSession.run(RubyDebugSession);
//# sourceMappingURL=main.js.map