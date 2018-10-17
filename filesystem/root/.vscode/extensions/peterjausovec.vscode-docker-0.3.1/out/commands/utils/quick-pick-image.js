"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_azureextensionui_1 = require("vscode-azureextensionui");
const extensionVariables_1 = require("../../extensionVariables");
const docker_endpoint_1 = require("./docker-endpoint");
function createItem(image, repoTag) {
    return {
        label: repoTag || '<none>',
        imageDesc: image
    };
}
function computeItems(images, includeAll) {
    const items = [];
    // tslint:disable-next-line:prefer-for-of // Grandfathered in
    for (let i = 0; i < images.length; i++) {
        if (!images[i].RepoTags) {
            // dangling
            const item = createItem(images[i], '<none>:<none>');
            items.push(item);
        }
        else {
            // tslint:disable-next-line:prefer-for-of // Grandfathered in
            for (let j = 0; j < images[i].RepoTags.length; j++) {
                const item = createItem(images[i], images[i].RepoTags[j]);
                items.push(item);
            }
        }
    }
    if (includeAll && images.length > 0) {
        items.unshift({
            label: 'All Images',
            allImages: true
        });
    }
    return items;
}
async function quickPickImage(actionContext, includeAll) {
    let images;
    let properties = actionContext.properties;
    const imageFilters = {
        "filters": {
            "dangling": ["false"]
        }
    };
    try {
        images = await docker_endpoint_1.docker.getImageDescriptors(imageFilters);
    }
    catch (error) {
        error.message = 'Unable to connect to Docker, is the Docker daemon running?\nOutput from Docker: ' + vscode_azureextensionui_1.parseError(error).message;
        throw error;
    }
    if (!images || images.length === 0) {
        throw new Error('There are no docker images. Try Docker Build first.');
    }
    else {
        const items = computeItems(images, includeAll);
        let response = await extensionVariables_1.ext.ui.showQuickPick(items, { placeHolder: 'Choose image...' });
        properties.allContainers = includeAll ? String(response.allImages) : undefined;
        return response;
    }
}
exports.quickPickImage = quickPickImage;
//# sourceMappingURL=quick-pick-image.js.map