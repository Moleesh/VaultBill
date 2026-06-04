import { describe, expect, it } from 'vitest';

import { buildCompanyPlaceholders, normalizeRuntimeBranding } from './BrandingSettings';

describe('BrandingSettings', () => {
  it('normalizes runtime branding without changing build identity', () => {
    expect(
      normalizeRuntimeBranding({
        ApplicationName: '',
        CompanyName: 'Sample Traders',
        Tagline: '',
        ApplicationLogoAssetId: 'asset_app',
        PrintLogoAssetId: 'asset_print',
        FaviconAssetId: 'asset_favicon',
      }),
    ).toEqual({
      applicationName: 'VaultBill',
      companyName: 'Sample Traders',
      tagline: 'Configure once. Bill, print, and report anywhere.',
      applicationLogoAssetId: 'asset_app',
      printLogoAssetId: 'asset_print',
      faviconAssetId: 'asset_favicon',
    });
  });

  it('builds company placeholders for print and report mappings', () => {
    expect(
      buildCompanyPlaceholders({
        CompanyName: 'Sample Traders',
        LegalName: 'Sample Traders Pvt Ltd',
        Gstin: '29ABCDE1234F1Z5',
        Address: 'Main Road',
        Phone: '12345',
        Email: 'hello@example.test',
        State: 'Karnataka',
        BankName: 'Bank',
        BankAccountNumber: '123',
        Ifsc: 'IFSC0001',
      }),
    ).toMatchObject({
      'Company.Name': 'Sample Traders',
      'Company.LegalName': 'Sample Traders Pvt Ltd',
      'Company.Gstin': '29ABCDE1234F1Z5',
      'Company.Email': 'hello@example.test',
    });
  });
});
