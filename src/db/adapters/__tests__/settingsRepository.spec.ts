/** @format */

// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';

import type { SqliteConnection } from '../../sqlite/SqliteConnection';
import { runDatabaseStartupChecks } from '../../startup/DatabaseStartup';
import {
    loadCompanyProfile,
    loadRuntimeBranding,
    loadSecretsSettings,
    loadSignaturePadSettings,
    saveCompanyProfile,
    saveRuntimeBranding,
    saveSecretsSettings,
    saveSignaturePadSettings,
} from '../settingsRepository';
import { openNodeSqliteConnection } from '../sqliteAdapter';

let connection: SqliteConnection | undefined;
const fixedNow = '2026-06-04T10:00:00.000Z';

const openStartedDatabase = () => {
    connection = openNodeSqliteConnection(':memory:');
    runDatabaseStartupChecks(connection, { nowIso: () => fixedNow });
    return connection;
};

afterEach(() => {
    connection?.close();
    connection = undefined;
});

describe('settingsRepository', () => {
    it('saves runtime branding and company profile JSON settings', () => {
        const db = openStartedDatabase();

        saveRuntimeBranding(
            db,
            {
                ApplicationName: 'Acme Billing',
                CompanyName: 'Acme',
                Tagline: 'Bill with confidence.',
                ApplicationLogoAssetId: 'asset_app',
                PrintLogoAssetId: 'asset_print',
                FaviconAssetId: 'asset_favicon',
            },
            fixedNow,
        );
        saveCompanyProfile(
            db,
            {
                CompanyName: 'Acme',
                LegalName: 'Acme Pvt Ltd',
                Gstin: '',
                Address: '',
                Phone: '',
                Email: '',
                State: '',
                BankName: '',
                BankAccountNumber: '',
                Ifsc: '',
            },
            fixedNow,
        );

        expect(loadRuntimeBranding(db)?.ApplicationName).toBe('Acme Billing');
        expect(loadCompanyProfile(db)?.LegalName).toBe('Acme Pvt Ltd');
    });

    it('saves shared secrets JSON settings', () => {
        const db = openStartedDatabase();

        saveSignaturePadSettings(
            db,
            {
                SignaturePad: {
                    Enabled: true,
                    Mode: 'Screen',
                    TestedUsbDevices: [],
                },
            },
            fixedNow,
        );
        saveSecretsSettings(
            db,
            {
                secrets: [
                    { key: 'CompanyGstin', value: '29ABCDE1234F2Z5', description: 'GSTIN' },
                    { key: 'SmsApiKey', value: 'key', description: 'SMS gateway key' },
                ],
            },
            fixedNow,
        );

        expect(loadSignaturePadSettings(db)?.SignaturePad.Mode).toBe('Screen');
        expect(loadSecretsSettings(db)?.secrets).toHaveLength(2);
        expect(loadSecretsSettings(db)?.secrets[0]?.key).toBe('CompanyGstin');
    });
});
