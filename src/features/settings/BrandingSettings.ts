/** @format */

import type { CompanyProfileConfig, RuntimeBrandingConfig } from '../../db/startup/ConfigSchemas';
import type { RuntimeBranding } from '../../types/AppTypes';

export const normalizeRuntimeBranding = (branding: RuntimeBrandingConfig): RuntimeBranding => ({
    applicationName: 'VaultBill',
    companyName: branding.CompanyName,
    tagline: branding.Tagline.trim() || 'Configure once. Create, print, and report anywhere.',
    applicationLogoAssetId: branding.ApplicationLogoAssetId,
    printLogoAssetId: branding.PrintLogoAssetId,
    faviconAssetId: branding.FaviconAssetId,
});

export const buildCompanyPlaceholders = (
    companyProfile: CompanyProfileConfig,
): Readonly<Record<string, string>> => ({
    'Company.Name': companyProfile.CompanyName,
    'Company.LegalName': companyProfile.LegalName,
    'Company.Gstin': companyProfile.Gstin,
    'Company.Address': companyProfile.Address,
    'Company.Phone': companyProfile.Phone,
    'Company.Email': companyProfile.Email,
});
