"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const docker_endpoint_1 = require("../../commands/utils/docker-endpoint");
const containerNode_1 = require("./containerNode");
const imageNode_1 = require("./imageNode");
const nodeBase_1 = require("./nodeBase");
const registryRootNode_1 = require("./registryRootNode");
const imageFilters = {
    "filters": {
        "dangling": ["false"]
    }
};
const containerFilters = {
    "filters": {
        "status": ["created", "restarting", "running", "paused", "exited", "dead"]
    }
};
class RootNode extends nodeBase_1.NodeBase {
    constructor(label, contextValue, eventEmitter, azureAccount) {
        super(label);
        this.label = label;
        this.contextValue = contextValue;
        this.eventEmitter = eventEmitter;
        this.azureAccount = azureAccount;
        if (this.contextValue === 'imagesRootNode') {
            this._imagesNode = this;
        }
        else if (this.contextValue === 'containersRootNode') {
            this._containersNode = this;
        }
        this._azureAccount = azureAccount;
    }
    autoRefreshImages() {
        const configOptions = vscode.workspace.getConfiguration('docker');
        const refreshInterval = configOptions.get('explorerRefreshInterval', 1000);
        // https://github.com/Microsoft/vscode/issues/30535
        // if (this._imagesNode.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed) {
        //     clearInterval(this._imageDebounceTimer);
        //     return;
        // }
        if (this._imageDebounceTimer) {
            clearInterval(this._imageDebounceTimer);
        }
        if (refreshInterval > 0) {
            this._imageDebounceTimer = setInterval(async () => {
                let needToRefresh = false;
                let found = false;
                const images = await docker_endpoint_1.docker.getImageDescriptors(imageFilters);
                images.sort((img1, img2) => {
                    if (img1.Id > img2.Id) {
                        return -1;
                    }
                    else if (img1.Id < img2.Id) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
                if (!this._sortedImageCache) {
                    this._sortedImageCache = images;
                    return;
                }
                let imagesAsJson = JSON.stringify(images);
                let cacheAsJson = JSON.stringify(this._sortedImageCache);
                if (imagesAsJson !== cacheAsJson) {
                    this.eventEmitter.fire(this._imagesNode);
                    this._sortedImageCache = images;
                }
            }, refreshInterval);
        }
    }
    getTreeItem() {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: this.contextValue
        };
    }
    async getChildren(element) {
        if (element.contextValue === 'imagesRootNode') {
            return this.getImages();
        }
        if (element.contextValue === 'containersRootNode') {
            return this.getContainers();
        }
        if (element.contextValue === 'registriesRootNode') {
            return this.getRegistries();
        }
        throw new Error(`Unexpected contextValue ${element.contextValue}`);
    }
    async getImages() {
        const imageNodes = [];
        let images;
        try {
            images = await docker_endpoint_1.docker.getImageDescriptors(imageFilters);
            if (!images || images.length === 0) {
                return [];
            }
            // tslint:disable-next-line:prefer-for-of // Grandfathered in
            for (let i = 0; i < images.length; i++) {
                // tslint:disable-next-line:prefer-for-of // Grandfathered in
                if (!images[i].RepoTags) {
                    let node = new imageNode_1.ImageNode(`<none>:<none>`, images[i], this.eventEmitter);
                    imageNodes.push(node);
                }
                else {
                    // tslint:disable-next-line:prefer-for-of // Grandfathered in
                    for (let j = 0; j < images[i].RepoTags.length; j++) {
                        // tslint:disable-next-line:prefer-for-of // Grandfathered in
                        let node = new imageNode_1.ImageNode(`${images[i].RepoTags[j]}`, images[i], this.eventEmitter);
                        imageNodes.push(node);
                    }
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage('Unable to connect to Docker, is the Docker daemon running?');
            return [];
        }
        this.autoRefreshImages();
        return imageNodes;
    }
    autoRefreshContainers() {
        const configOptions = vscode.workspace.getConfiguration('docker');
        const refreshInterval = configOptions.get('explorerRefreshInterval', 1000);
        // https://github.com/Microsoft/vscode/issues/30535
        // if (this._containersNode.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed) {
        //     clearInterval(this._containerDebounceTimer);
        //     return;
        // }
        if (this._containerDebounceTimer) {
            clearInterval(this._containerDebounceTimer);
        }
        if (refreshInterval > 0) {
            this._containerDebounceTimer = setInterval(async () => {
                let needToRefresh = false;
                let found = false;
                const containers = await docker_endpoint_1.docker.getContainerDescriptors(containerFilters);
                if (!this._containerCache) {
                    this._containerCache = containers;
                }
                if (this._containerCache.length !== containers.length) {
                    needToRefresh = true;
                }
                else {
                    // tslint:disable-next-line:prefer-for-of // Grandfathered in
                    for (let i = 0; i < this._containerCache.length; i++) {
                        let ctr = this._containerCache[i];
                        // tslint:disable-next-line:prefer-for-of // Grandfathered in
                        for (let j = 0; j < containers.length; j++) {
                            // can't do a full object compare because "Status" keeps changing for running containers
                            if (ctr.Id === containers[j].Id &&
                                ctr.Image === containers[j].Image &&
                                ctr.State === containers[j].State) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            needToRefresh = true;
                            break;
                        }
                    }
                }
                if (needToRefresh) {
                    this.eventEmitter.fire(this._containersNode);
                    this._containerCache = containers;
                }
            }, refreshInterval);
        }
    }
    async getContainers() {
        const containerNodes = [];
        let containers;
        let contextValue;
        let iconPath;
        try {
            containers = await docker_endpoint_1.docker.getContainerDescriptors(containerFilters);
            if (!containers || containers.length === 0) {
                return [];
            }
            // tslint:disable-next-line:prefer-for-of // Grandfathered in
            for (let i = 0; i < containers.length; i++) {
                if (['exited', 'dead'].includes(containers[i].State)) {
                    contextValue = "stoppedLocalContainerNode";
                    iconPath = {
                        light: path.join(__filename, '..', '..', '..', '..', 'images', 'light', 'stoppedContainer.svg'),
                        dark: path.join(__filename, '..', '..', '..', '..', 'images', 'dark', 'stoppedContainer.svg')
                    };
                }
                else {
                    contextValue = "runningLocalContainerNode";
                    iconPath = {
                        light: path.join(__filename, '..', '..', '..', '..', 'images', 'light', 'runningContainer.svg'),
                        dark: path.join(__filename, '..', '..', '..', '..', 'images', 'dark', 'runningContainer.svg')
                    };
                }
                let containerNode = new containerNode_1.ContainerNode(`${containers[i].Image} (${containers[i].Names[0].substring(1)}) (${containers[i].Status})`, containers[i], contextValue, iconPath);
                containerNodes.push(containerNode);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage('Unable to connect to Docker, is the Docker daemon running?');
            return [];
        }
        this.autoRefreshContainers();
        return containerNodes;
    }
    async getRegistries() {
        const registryRootNodes = [];
        registryRootNodes.push(new registryRootNode_1.RegistryRootNode('Docker Hub', "dockerHubRootNode"));
        if (this._azureAccount) {
            registryRootNodes.push(new registryRootNode_1.RegistryRootNode('Azure', "azureRegistryRootNode", this.eventEmitter, this._azureAccount));
        }
        registryRootNodes.push(new registryRootNode_1.RegistryRootNode('Private Registries', 'customRootNode'));
        return registryRootNodes;
    }
}
exports.RootNode = RootNode;
//# sourceMappingURL=rootNode.js.map