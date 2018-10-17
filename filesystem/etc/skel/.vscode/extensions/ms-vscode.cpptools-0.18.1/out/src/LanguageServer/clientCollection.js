'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util = require("../common");
const telemetry = require("../telemetry");
const cpptools = require("./client");
const path = require("path");
const customProviders_1 = require("./customProviders");
const defaultClientKey = "@@default@@";
class ClientCollection {
    constructor() {
        this.disposables = [];
        this.languageClients = new Map();
        let key = defaultClientKey;
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            let folder = vscode.workspace.workspaceFolders[0];
            key = util.asFolder(folder.uri);
            this.activeClient = cpptools.createClient(this, folder);
        }
        else {
            this.activeClient = cpptools.createClient(this);
        }
        this.defaultClient = this.activeClient;
        this.languageClients.set(key, this.activeClient);
        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(e => this.onDidChangeWorkspaceFolders(e)));
        this.disposables.push(vscode.workspace.onDidOpenTextDocument(d => this.onDidOpenTextDocument(d)));
        this.disposables.push(vscode.workspace.onDidCloseTextDocument(d => this.onDidCloseTextDocument(d)));
    }
    get ActiveClient() { return this.activeClient; }
    get Names() {
        let result = [];
        this.languageClients.forEach((client, key) => {
            result.push({ name: client.Name, key: key });
        });
        return result;
    }
    get Count() { return this.languageClients.size; }
    activeDocumentChanged(document) {
        this.activeDocument = document;
        let activeClient = this.getClientFor(document.uri);
        activeClient.activeDocumentChanged(document);
        if (activeClient !== this.activeClient) {
            activeClient.activate();
            this.activeClient.deactivate();
            this.activeClient = activeClient;
        }
    }
    get(key) {
        if (this.languageClients.has(key)) {
            return this.languageClients.get(key);
        }
        console.assert("key not found");
        return null;
    }
    forEach(callback) {
        this.languageClients.forEach(callback);
    }
    checkOwnership(client, document) {
        let owners = [];
        this.languageClients.forEach(languageClient => {
            if (document.uri.fsPath.startsWith(languageClient.RootPath + path.sep)) {
                owners.push(languageClient);
            }
        });
        if (owners.length === 0) {
            owners.push(this.activeClient);
        }
        return (owners[0] === client);
    }
    replace(client, transferFileOwnership) {
        let key = undefined;
        for (let pair of this.languageClients) {
            if (pair[1] === client) {
                key = pair[0];
                break;
            }
        }
        if (key) {
            this.languageClients.delete(key);
            if (transferFileOwnership) {
                client.TrackedDocuments.forEach(document => this.transferOwnership(document, client));
                client.TrackedDocuments.clear();
            }
            else {
                this.languageClients.set(key, cpptools.createNullClient());
            }
            if (this.activeClient === client) {
                this.activeClient = this.getClientFor(this.activeDocument.uri);
                this.activeClient.activeDocumentChanged(this.activeDocument);
            }
            client.dispose();
            return this.languageClients.get(key);
        }
        else {
            console.assert(key, "unable to locate language client");
            return null;
        }
    }
    onDidChangeWorkspaceFolders(e) {
        let folderCount = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0;
        if (folderCount > 1) {
            telemetry.logLanguageServerEvent("workspaceFoldersChange", { "count": folderCount.toString() });
        }
        if (e !== undefined) {
            e.removed.forEach(folder => {
                let path = util.asFolder(folder.uri);
                let client = this.languageClients.get(path);
                if (client) {
                    this.languageClients.delete(path);
                    client.TrackedDocuments.forEach(document => this.transferOwnership(document, client));
                    client.TrackedDocuments.clear();
                    if (this.activeClient === client) {
                        this.activeClient = this.getClientFor(this.activeDocument.uri);
                        this.activeClient.activeDocumentChanged(this.activeDocument);
                    }
                    client.dispose();
                }
            });
        }
    }
    transferOwnership(document, oldOwner) {
        let newOwner = this.getClientFor(document.uri);
        console.assert(newOwner !== oldOwner, "'oldOwner' should not be in the list of clients to consider");
        newOwner.takeOwnership(document);
    }
    onDidOpenTextDocument(document) {
        if (document.languageId === "c" || document.languageId === "cpp") {
            this.getClientFor(document.uri);
        }
    }
    getClientFor(uri) {
        let folder = vscode.workspace.getWorkspaceFolder(uri);
        if (!folder) {
            return this.defaultClient;
        }
        else {
            let key = util.asFolder(folder.uri);
            if (!this.languageClients.has(key)) {
                let newClient = cpptools.createClient(this, folder);
                this.languageClients.set(key, newClient);
                customProviders_1.getCustomConfigProviders().forEach(provider => newClient.onRegisterCustomConfigurationProvider(provider));
            }
            return this.languageClients.get(key);
        }
    }
    onDidCloseTextDocument(document) {
    }
    dispose() {
        let promises = [];
        this.defaultClient = undefined;
        this.languageClients.forEach(client => promises.push(client.dispose()));
        this.languageClients.clear();
        return Promise.all(promises).then(() => undefined);
    }
}
exports.ClientCollection = ClientCollection;
//# sourceMappingURL=clientCollection.js.map