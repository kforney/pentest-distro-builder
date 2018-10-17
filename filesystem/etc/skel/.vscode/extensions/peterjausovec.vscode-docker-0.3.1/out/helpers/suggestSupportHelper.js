/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const dockerExtension_1 = require("../dockerExtension");
const hub = require("../dockerHubApi");
const parser = require("../parser");
class SuggestSupportHelper {
    // tslint:disable-next-line:promise-function-async // Grandfathered in
    suggestImages(word) {
        return hub.searchImagesInRegistryHub(word, true).then((results) => {
            return results.map((image) => {
                let stars = '';
                if (image.star_count > 0) {
                    stars = ' ' + image.star_count + ' ' + (image.star_count > 1 ? 'stars' : 'star');
                }
                return {
                    label: image.name,
                    kind: vscode.CompletionItemKind.Value,
                    detail: hub.tagsForImage(image) + stars,
                    insertText: image.name,
                    documentation: image.description,
                };
            });
        });
    }
    // tslint:disable-next-line:promise-function-async // Grandfathered in
    searchImageInRegistryHub(imageName) {
        return hub.searchImageInRegistryHub(imageName, true).then((result) => {
            if (result) {
                let r = [];
                let tags = hub.tagsForImage(result);
                // Name, tags and stars.
                let nameString = '';
                if (tags.length > 0) {
                    nameString = '**' + result.name + ' ' + tags + '** ';
                }
                else {
                    nameString = '**' + result.name + '**';
                }
                if (result.star_count) {
                    let plural = (result.star_count > 1);
                    nameString += '**' + String(result.star_count) + (plural ? ' stars' : ' star') + '**';
                }
                r.push(nameString);
                // Description
                r.push(result.description);
                return r;
            }
        });
    }
    // tslint:disable-next-line:promise-function-async // Grandfathered in
    getImageNameHover(line, _parser, tokens, tokenIndex) {
        // -------------
        // Detect <<image: [["something"]]>>
        // Detect <<image: [[something]]>>
        let originalValue = _parser.tokenValue(line, tokens[tokenIndex]);
        let keyToken = null;
        tokenIndex--;
        while (tokenIndex >= 0) {
            let type = tokens[tokenIndex].type;
            if (type === parser.TokenType.String || type === parser.TokenType.Text) {
                return;
            }
            if (type === parser.TokenType.Key) {
                keyToken = _parser.tokenValue(line, tokens[tokenIndex]);
                break;
            }
            tokenIndex--;
        }
        if (!keyToken) {
            return;
        }
        let keyName = _parser.keyNameFromKeyToken(keyToken);
        if (keyName === 'image' || keyName === 'FROM') {
            let imageName;
            if (keyName === 'FROM') {
                imageName = line.match(dockerExtension_1.FROM_DIRECTIVE_PATTERN)[1];
            }
            else {
                imageName = originalValue.replace(/^"/, '').replace(/"$/, '');
            }
            return this.searchImageInRegistryHub(imageName).then((results) => {
                if (results[0] && results[1]) {
                    return ['**DockerHub:**', results[0], '**DockerRuntime**', results[1]];
                }
                if (results[0]) {
                    return [results[0]];
                }
                return [results[1]];
            });
        }
    }
}
exports.SuggestSupportHelper = SuggestSupportHelper;
//# sourceMappingURL=suggestSupportHelper.js.map