"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants");
const commonRegistryUtils_1 = require("../../explorer/models/commonRegistryUtils");
const extensionVariables_1 = require("../../extensionVariables");
const azureUtilityManager_1 = require("../azureUtilityManager");
const nonNull_1 = require("../nonNull");
const image_1 = require("./models/image");
const repository_1 = require("./models/repository");
//General helpers
/** Gets the subscription for a given registry
 * @returns a subscription object
 */
function getSubscriptionFromRegistry(registry) {
    let id = nonNull_1.getId(registry);
    let subscriptionId = id.slice('/subscriptions/'.length, id.search('/resourceGroups/'));
    const subs = azureUtilityManager_1.AzureUtilityManager.getInstance().getFilteredSubscriptionList();
    let subscription = subs.find((sub) => {
        return sub.subscriptionId === subscriptionId;
    });
    if (!subscription) {
        throw new Error(`Could not find subscription with id "${subscriptionId}"`);
    }
    return subscription;
}
exports.getSubscriptionFromRegistry = getSubscriptionFromRegistry;
function getResourceGroupName(registry) {
    let id = nonNull_1.getId(registry);
    return id.slice(id.search('resourceGroups/') + 'resourceGroups/'.length, id.search('/providers/'));
}
exports.getResourceGroupName = getResourceGroupName;
//Registry item management
/** List images under a specific Repository */
async function getImagesByRepository(element) {
    let allImages = [];
    let image;
    const { acrAccessToken } = await acquireACRAccessTokenFromRegistry(element.registry, 'repository:' + element.name + ':pull');
    const tags = await commonRegistryUtils_1.getTags('https://' + element.registry.loginServer, element.name, { bearer: acrAccessToken });
    for (let tag of tags) {
        image = new image_1.AzureImage(element, tag.tag, tag.created);
        allImages.push(image);
    }
    return allImages;
}
exports.getImagesByRepository = getImagesByRepository;
/** List repositories on a given Registry. */
async function getRepositoriesByRegistry(registry) {
    let repo;
    const { acrAccessToken } = await acquireACRAccessTokenFromRegistry(registry, "registry:catalog:*");
    const repositories = await commonRegistryUtils_1.getCatalog('https://' + registry.loginServer, { bearer: acrAccessToken });
    let allRepos = [];
    for (let tempRepo of repositories) {
        repo = new repository_1.Repository(registry, tempRepo);
        allRepos.push(repo);
    }
    //Note these are ordered by default in alphabetical order
    return allRepos;
}
exports.getRepositoriesByRegistry = getRepositoriesByRegistry;
/** Sends a custom html request to a registry
 * @param http_method : the http method, this function currently only uses delete
 * @param login_server: the login server of the registry
 * @param path : the URL path
 * @param username : registry username, can be in generic form of 0's, used to generate authorization header
 * @param password : registry password, can be in form of accessToken, used to generate authorization header
 */
async function sendRequestToRegistry(http_method, login_server, path, bearerAccessToken) {
    let url = `https://${login_server}${path}`;
    let header = 'Bearer ' + bearerAccessToken;
    let opt = {
        headers: { 'Authorization': header },
        http_method: http_method,
        url: url
    };
    if (http_method === 'delete') {
        await extensionVariables_1.ext.request.delete(opt);
        return;
    }
    throw new Error('sendRequestToRegistry: Unexpected http method');
}
exports.sendRequestToRegistry = sendRequestToRegistry;
//Credential management
/** Obtains registry username and password compatible with docker login */
async function loginCredentials(registry) {
    const subscription = getSubscriptionFromRegistry(registry);
    const session = azureUtilityManager_1.AzureUtilityManager.getInstance().getSession(subscription);
    const { aadAccessToken, aadRefreshToken } = await acquireAADTokens(session);
    const acrRefreshToken = await acquireACRRefreshToken(nonNull_1.getLoginServer(registry), session.tenantId, aadRefreshToken, aadAccessToken);
    return { 'password': acrRefreshToken, 'username': constants_1.NULL_GUID };
}
exports.loginCredentials = loginCredentials;
/** Obtains tokens for using the Docker Registry v2 Api
 * @param registry The targeted Azure Container Registry
 * @param scope String determining the scope of the access token
 * @returns acrRefreshToken: For use as a Password for docker registry access , acrAccessToken: For use with docker API
 */
async function acquireACRAccessTokenFromRegistry(registry, scope) {
    const subscription = getSubscriptionFromRegistry(registry);
    const session = azureUtilityManager_1.AzureUtilityManager.getInstance().getSession(subscription);
    const { aadAccessToken, aadRefreshToken } = await acquireAADTokens(session);
    let loginServer = nonNull_1.getLoginServer(registry);
    const acrRefreshToken = await acquireACRRefreshToken(loginServer, session.tenantId, aadRefreshToken, aadAccessToken);
    const acrAccessToken = await acquireACRAccessToken(loginServer, scope, acrRefreshToken);
    return { acrRefreshToken, acrAccessToken };
}
exports.acquireACRAccessTokenFromRegistry = acquireACRAccessTokenFromRegistry;
/** Obtains refresh and access tokens for Azure Active Directory. */
async function acquireAADTokens(session) {
    return new Promise((resolve, reject) => {
        const credentials = session.credentials;
        const environment = session.environment;
        credentials.context.acquireToken(environment.activeDirectoryResourceId, credentials.username, credentials.clientId, (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                let tokenResponse = result;
                resolve({
                    aadAccessToken: tokenResponse.accessToken,
                    aadRefreshToken: tokenResponse.refreshToken,
                });
            }
        });
    });
}
exports.acquireAADTokens = acquireAADTokens;
/** Obtains refresh tokens for Azure Container Registry. */
async function acquireACRRefreshToken(registryUrl, tenantId, aadRefreshToken, aadAccessToken) {
    const acrRefreshTokenResponse = await extensionVariables_1.ext.request.post(`https://${registryUrl}/oauth2/exchange`, {
        form: {
            grant_type: "refresh_token",
            service: registryUrl,
            tenant: tenantId,
            refresh_token: aadRefreshToken,
            access_token: aadAccessToken,
        },
        json: true
    });
    return acrRefreshTokenResponse.refresh_token;
}
exports.acquireACRRefreshToken = acquireACRRefreshToken;
/** Gets an ACR accessToken by using an acrRefreshToken */
async function acquireACRAccessToken(registryUrl, scope, acrRefreshToken) {
    const acrAccessTokenResponse = await extensionVariables_1.ext.request.post(`https://${registryUrl}/oauth2/token`, {
        form: {
            grant_type: "refresh_token",
            service: registryUrl,
            scope,
            refresh_token: acrRefreshToken,
        },
        json: true
    });
    return acrAccessTokenResponse.access_token;
}
exports.acquireACRAccessToken = acquireACRAccessToken;
//# sourceMappingURL=acrTools.js.map