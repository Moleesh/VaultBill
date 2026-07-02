/** @format */

// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { defaultHostedWebPort } from './server/LocalApiSecurity.js';
import { SettingsStore } from './SettingsStore.js';

let directory = '';
let store: SettingsStore | undefined;

afterEach(() => {
    store?.close();
    store = undefined;
    if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('SettingsStore', () => {
    it('persists setup business identity and secrets configuration', () => {
        directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-settings-'));
        const databasePath = path.join(directory, 'vaultbill.sqlite');
        store = new SettingsStore(databasePath);
        expect(store.isSetupComplete()).toBe(false);

        store.saveBusiness({
            companyName: 'Aster Works',
            address: '12 Market Road',
            gstin: '29ABCDE1234F1Z5',
            theme: 'teal-flow',
            outputTarget: 'PreviewOnly',
        });
        store.saveIntegrations({
            secrets: [
                { key: 'CompanyGSTIN', value: '29ABCDE1234F1Z5', description: 'GST number' },
                { key: 'SmsApiKey', value: 'sms-api-key', description: 'SMS gateway' },
            ],
        });
        store.saveHostedWeb({
            autoStart: true,
            lanEnabled: true,
            passwordRequired: true,
            port: defaultHostedWebPort,
        });
        store.close();

        store = new SettingsStore(databasePath);
        expect(store.isSetupComplete()).toBe(true);
        expect(store.getBusiness()).toMatchObject({ companyName: 'Aster Works' });
        expect(store.getIntegrations()).toMatchObject({
            secrets: [
                { key: 'CompanyGSTIN', value: '29ABCDE1234F1Z5' },
                { key: 'SmsApiKey', value: 'sms-api-key' },
            ],
        });
        expect(store.getHostedWeb()).toEqual({
            autoStart: true,
            lanEnabled: true,
            passwordRequired: true,
            port: defaultHostedWebPort,
        });
    });
});
