/** @format */

// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { SettingsStore } from './SettingsStore.js';

let directory = '';
let store: SettingsStore | undefined;

afterEach(() => {
    store?.close();
    store = undefined;
    if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('SettingsStore', () => {
    it('persists setup business identity and connected service configuration', () => {
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
            gst: {
                enabled: true,
                provider: 'Example GSP',
                fields: [
                    { key: 'apiKey', value: 'gst-api-key' },
                    { key: 'endpoint', value: 'https://gst.example' },
                ],
            },
            sms: {
                enabled: false,
                provider: '',
                fields: [{ key: 'apiKey', value: 'sms-api-key' }],
            },
        });
        store.saveHostedWeb({ lanEnabled: true, passwordRequired: true, port: 4317 });
        store.close();

        store = new SettingsStore(databasePath);
        expect(store.isSetupComplete()).toBe(true);
        expect(store.getBusiness()).toMatchObject({ companyName: 'Aster Works' });
        expect(store.getIntegrations()).toMatchObject({
            gst: { enabled: true, provider: 'Example GSP' },
            sms: { fields: [{ key: 'apiKey', value: 'sms-api-key' }] },
        });
        expect(store.getHostedWeb()).toEqual({
            lanEnabled: true,
            passwordRequired: true,
            port: 4317,
        });
    });
});
