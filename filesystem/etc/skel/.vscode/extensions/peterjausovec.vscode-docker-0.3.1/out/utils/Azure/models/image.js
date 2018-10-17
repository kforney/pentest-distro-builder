"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Class Azure Image: Used locally, Organizes data for managing images */
class AzureImage {
    constructor(repository, tag, created) {
        this.registry = repository.registry;
        this.repository = repository;
        this.tag = tag;
        this.created = created;
        this.subscription = repository.subscription;
        this.resourceGroupName = repository.resourceGroupName;
        if (repository.password) {
            this.password = repository.password;
        }
        if (repository.username) {
            this.username = repository.username;
        }
    }
}
exports.AzureImage = AzureImage;
//# sourceMappingURL=image.js.map