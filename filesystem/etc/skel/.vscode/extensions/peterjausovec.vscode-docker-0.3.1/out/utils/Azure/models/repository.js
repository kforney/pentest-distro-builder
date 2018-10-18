"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const acrTools = require("../acrTools");
/** Class Azure Repository: Used locally, Organizes data for managing Repositories */
class Repository {
    constructor(registry, repository, password, username) {
        this.registry = registry;
        this.resourceGroupName = acrTools.getResourceGroupName(registry);
        this.subscription = acrTools.getSubscriptionFromRegistry(registry);
        this.name = repository;
        if (password) {
            this.password = password;
        }
        if (username) {
            this.username = username;
        }
    }
}
exports.Repository = Repository;
//# sourceMappingURL=repository.js.map