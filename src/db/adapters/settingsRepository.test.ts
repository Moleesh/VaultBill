// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';

import type { SqliteConnection } from '../sqlite/SqliteConnection';
import { runDatabaseStartupChecks } from '../startup/DatabaseStartup';
import { openNodeSqliteConnection } from './sqliteAdapter';
import {
  loadGspIntegrationSettings,
  loadGstIntegrationSettings,
  loadCompanyProfile,
  loadRuntimeBranding,
  loadSignaturePadSettings,
  loadSmsProviderSettings,
  saveGspIntegrationSettings,
  saveGstIntegrationSettings,
  saveCompanyProfile,
  saveRuntimeBranding,
  saveSignaturePadSettings,
  saveSmsProviderSettings,
} from './settingsRepository';

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

  it('saves optional integration JSON settings', () => {
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
    saveSmsProviderSettings(
      db,
      {
        Enabled: true,
        ProviderId: 'generic',
        EndpointUrl: 'https://sms.example/send',
        SenderId: 'VAULT',
        UseServerSideProxy: true,
        Secrets: { ApiKey: 'key', ApiSecret: 'secret' },
      },
      fixedNow,
    );
    saveGstIntegrationSettings(
      db,
      {
        Enabled: true,
        DefaultSellerStateCode: '29',
        HsnSacCatalog: [{ Code: '9983', Description: 'Services', TaxRatePercent: '18' }],
      },
      fixedNow,
    );
    saveGspIntegrationSettings(
      db,
      {
        Enabled: true,
        ProviderId: 'generic-gsp',
        BaseUrl: 'https://gsp.example',
        Sandbox: true,
        ClientId: 'client',
        ClientSecret: 'secret',
        Endpoints: { EInvoice: '/einvoice', Gstr: '/gstr' },
      },
      fixedNow,
    );

    expect(loadSignaturePadSettings(db)?.SignaturePad.Mode).toBe('Screen');
    expect(loadSmsProviderSettings(db)?.UseServerSideProxy).toBe(true);
    expect(loadGstIntegrationSettings(db)?.HsnSacCatalog).toHaveLength(1);
    expect(loadGspIntegrationSettings(db)?.Endpoints.EInvoice).toBe('/einvoice');
  });
});
