"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const azure_arm_containerregistry_1 = require("azure-arm-containerregistry");
const azure_arm_resource_1 = require("azure-arm-resource");
const vscode_azureextensionui_1 = require("vscode-azureextensionui");
const constants_1 = require("../constants");
const asyncpool_1 = require("./asyncpool");
const nonNull_1 = require("./nonNull");
/* Singleton for facilitating communication with Azure account services by providing extended shared
  functionality and extension wide access to azureAccount. Tool for internal use.
  Authors: Esteban Rey L, Jackson Stokes
*/
class AzureUtilityManager {
    constructor() { }
    static hasLoadedUtilityManager() {
        if (AzureUtilityManager._instance) {
            return true;
        }
        else {
            return false;
        }
    }
    static getInstance() {
        if (!AzureUtilityManager._instance) { // lazy initialization
            AzureUtilityManager._instance = new AzureUtilityManager();
        }
        return AzureUtilityManager._instance;
    }
    //This function has to be called explicitly before using the singleton.
    setAccount(azureAccount) {
        this.azureAccount = azureAccount;
    }
    //GETTERS
    getAccount() {
        if (this.azureAccount) {
            return this.azureAccount;
        }
        throw new Error('Azure account is not present, you may have forgotten to call setAccount');
    }
    getSession(subscription) {
        const tenantId = nonNull_1.getTenantId(subscription);
        const azureAccount = this.getAccount();
        let foundSession = azureAccount.sessions.find((s) => s.tenantId.toLowerCase() === tenantId.toLowerCase());
        if (!foundSession) {
            throw new Error(`Could not find a session with tenantId "${tenantId}"`);
        }
        return foundSession;
    }
    getFilteredSubscriptionList() {
        return this.getAccount().filters.map(filter => {
            return {
                id: filter.subscription.id,
                subscriptionId: filter.subscription.subscriptionId,
                tenantId: filter.session.tenantId,
                displayName: filter.subscription.displayName,
                state: filter.subscription.state,
                subscriptionPolicies: filter.subscription.subscriptionPolicies,
                authorizationSource: filter.subscription.authorizationSource
            };
        });
    }
    getContainerRegistryManagementClient(subscription) {
        let client = new azure_arm_containerregistry_1.ContainerRegistryManagementClient(this.getCredentialByTenantId(subscription), nonNull_1.getSubscriptionId(subscription));
        vscode_azureextensionui_1.addExtensionUserAgent(client);
        return client;
    }
    getResourceManagementClient(subscription) {
        return new azure_arm_resource_1.ResourceManagementClient(this.getCredentialByTenantId(nonNull_1.getTenantId(subscription)), nonNull_1.getSubscriptionId(subscription));
    }
    async getRegistries(subscription, resourceGroup, compareFn = this.sortRegistriesAlphabetically) {
        let registries = [];
        if (subscription && resourceGroup) {
            //Get all registries under one resourcegroup
            const client = this.getContainerRegistryManagementClient(subscription);
            registries = await client.registries.listByResourceGroup(resourceGroup);
        }
        else if (subscription) {
            //Get all registries under one subscription
            const client = this.getContainerRegistryManagementClient(subscription);
            registries = await client.registries.list();
        }
        else {
            //Get all registries for all subscriptions
            const subs = this.getFilteredSubscriptionList();
            const subPool = new asyncpool_1.AsyncPool(constants_1.MAX_CONCURRENT_SUBSCRIPTON_REQUESTS);
            for (let sub of subs) {
                subPool.addTask(async () => {
                    const client = this.getContainerRegistryManagementClient(sub);
                    let subscriptionRegistries = await client.registries.list();
                    registries = registries.concat(subscriptionRegistries);
                });
            }
            await subPool.runAll();
        }
        registries.sort(compareFn);
        //Return only non classic registries
        return registries.filter((registry) => { return !registry.sku.tier || !registry.sku.tier.includes('Classic'); });
    }
    sortRegistriesAlphabetically(a, b) {
        return (a.loginServer || '').localeCompare(b.loginServer || '');
    }
    async getResourceGroups(subscription) {
        if (subscription) {
            const resourceClient = this.getResourceManagementClient(subscription);
            return await resourceClient.resourceGroups.list();
        }
        const subs = this.getFilteredSubscriptionList();
        const subPool = new asyncpool_1.AsyncPool(constants_1.MAX_CONCURRENT_SUBSCRIPTON_REQUESTS);
        let resourceGroups = [];
        //Acquire each subscription's data simultaneously
        for (let sub of subs) {
            subPool.addTask(async () => {
                const resourceClient = this.getResourceManagementClient(sub);
                const internalGroups = await resourceClient.resourceGroups.list();
                resourceGroups = resourceGroups.concat(internalGroups);
            });
        }
        await subPool.runAll();
        return resourceGroups;
    }
    getCredentialByTenantId(tenantIdOrSubscription) {
        let tenantId = typeof tenantIdOrSubscription === 'string' ? tenantIdOrSubscription : nonNull_1.getTenantId(tenantIdOrSubscription);
        const session = this.getAccount().sessions.find((azureSession) => azureSession.tenantId.toLowerCase() === tenantId.toLowerCase());
        if (session) {
            return session.credentials;
        }
        throw new Error(`Failed to get credentials, tenant ${tenantId} not found.`);
    }
    async getLocationsBySubscription(subscription) {
        const credential = this.getCredentialByTenantId(nonNull_1.getTenantId(subscription));
        const client = new azure_arm_resource_1.SubscriptionClient(credential);
        const locations = (await client.subscriptions.listLocations(nonNull_1.getSubscriptionId(subscription)));
        return locations;
    }
    //CHECKS
    //Provides a unified check for login that should be called once before using the rest of the singletons capabilities
    async waitForLogin() {
        if (!this.azureAccount) {
            return false;
        }
        return await this.azureAccount.waitForLogin();
    }
}
exports.AzureUtilityManager = AzureUtilityManager;
//# sourceMappingURL=azureUtilityManager.js.map