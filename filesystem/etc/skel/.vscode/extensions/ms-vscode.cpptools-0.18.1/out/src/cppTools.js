'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const customProviders_1 = require("./LanguageServer/customProviders");
const LanguageServer = require("./LanguageServer/extension");
const test = require("./testHook");
class CppTools {
    constructor(version) {
        this.providers = [];
        this.version = version;
    }
    registerCustomConfigurationProvider(provider) {
        let providers = customProviders_1.getCustomConfigProviders();
        if (providers.add(provider, this.version)) {
            let added = providers.get(provider);
            this.providers.push(added);
            LanguageServer.getClients().forEach(client => client.onRegisterCustomConfigurationProvider(added));
        }
    }
    didChangeCustomConfiguration(provider) {
        let providers = customProviders_1.getCustomConfigProviders();
        let p = providers.get(provider);
        if (p) {
            LanguageServer.getClients().forEach(client => client.updateCustomConfigurations(p));
        }
        else {
            console.assert(false, "provider should be registered before sending config change messages");
        }
    }
    dispose() {
        this.providers.forEach(provider => {
            customProviders_1.getCustomConfigProviders().remove(provider);
            provider.dispose();
        });
        this.providers = [];
    }
    getTestHook() {
        return test.getTestHook();
    }
}
exports.CppTools = CppTools;
//# sourceMappingURL=cppTools.js.map