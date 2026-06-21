/** @format */

import type * as z from 'zod';

import type {
    CompanyProfileSchema,
    DocumentFormatConfigSchema,
    GspIntegrationSettingsSchema,
    GstIntegrationSettingsSchema,
    RuntimeBrandingSchema,
    SecretEntrySchema,
    SecretsSettingsSchema,
    SignaturePadSettingsSchema,
    SmsProviderSettingsSchema,
} from './ConfigSchemas';

/** Inferred document-format configuration used by builder, records, and print flows. */
export type DocumentFormatConfig = z.infer<typeof DocumentFormatConfigSchema>;
/** Inferred company-profile settings used across login, settings, and print output. */
export type CompanyProfileConfig = z.infer<typeof CompanyProfileSchema>;
/** Inferred GSP integration settings for GST automation connectors. */
export type GspIntegrationSettings = z.infer<typeof GspIntegrationSettingsSchema>;
/** Inferred GST integration settings for catalog and seller-state defaults. */
export type GstIntegrationSettings = z.infer<typeof GstIntegrationSettingsSchema>;
/** Inferred runtime branding settings for app and print identity assets. */
export type RuntimeBrandingConfig = z.infer<typeof RuntimeBrandingSchema>;
/** Inferred signature-pad settings used by desktop capture integrations. */
export type SignaturePadSettings = z.infer<typeof SignaturePadSettingsSchema>;
/** Inferred shared secret entry used by settings and formula helpers. */
export type SecretEntry = z.infer<typeof SecretEntrySchema>;
/** Inferred secret-settings collection stored by the runtime. */
export type SecretsSettings = z.infer<typeof SecretsSettingsSchema>;
/** Inferred SMS provider settings used by notification integrations. */
export type SmsProviderSettings = z.infer<typeof SmsProviderSettingsSchema>;
