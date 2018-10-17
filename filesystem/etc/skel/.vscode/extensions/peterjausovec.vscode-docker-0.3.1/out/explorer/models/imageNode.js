"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const path = require("path");
const vscode = require("vscode");
const utils_1 = require("../utils/utils");
const nodeBase_1 = require("./nodeBase");
class ImageNode extends nodeBase_1.NodeBase {
    constructor(label, imageDesc, eventEmitter) {
        super(label);
        this.label = label;
        this.imageDesc = imageDesc;
        this.eventEmitter = eventEmitter;
        this.contextValue = ImageNode.contextValue;
    }
    getTreeItem() {
        let displayName = this.label;
        if (vscode.workspace.getConfiguration('docker').get('truncateLongRegistryPaths', false)) {
            if (/\//.test(displayName)) {
                let parts = this.label.split(/\//);
                displayName = utils_1.trimWithElipsis(parts[0], vscode.workspace.getConfiguration('docker').get('truncateMaxLength', 10)) + '/' + parts[1];
            }
        }
        displayName = `${displayName} (${moment(new Date(this.imageDesc.Created * 1000)).fromNow()})`;
        return {
            label: `${displayName}`,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "localImageNode",
            iconPath: {
                light: path.join(__filename, '..', '..', '..', '..', 'images', 'light', 'application.svg'),
                dark: path.join(__filename, '..', '..', '..', '..', 'images', 'dark', 'application.svg')
            }
        };
    }
}
ImageNode.contextValue = 'localImageNode';
exports.ImageNode = ImageNode;
//# sourceMappingURL=imageNode.js.map