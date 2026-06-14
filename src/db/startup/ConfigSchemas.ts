/** @format */

import { z } from 'zod';

export const RuntimeBrandingSchema = z.object({
    ApplicationName: z.string(),
    CompanyName: z.string(),
    Tagline: z.string(),
    ApplicationLogoAssetId: z.string(),
    PrintLogoAssetId: z.string(),
    FaviconAssetId: z.string(),
});

export const CompanyProfileSchema = z.object({
    CompanyName: z.string(),
    LegalName: z.string(),
    Gstin: z.string(),
    Address: z.string(),
    Phone: z.string(),
    Email: z.string(),
    State: z.string(),
    BankName: z.string(),
    BankAccountNumber: z.string(),
    Ifsc: z.string(),
});

export const SignaturePadSettingsSchema = z.object({
    SignaturePad: z.object({
        Enabled: z.boolean(),
        Mode: z.enum(['Screen', 'UsbHid']),
        TestedUsbDevices: z.array(
            z.object({
                VendorId: z.string(),
                ProductId: z.string(),
                DisplayName: z.string(),
            }),
        ),
    }),
});

export const SecretEntrySchema = z.object({
    key: z.string().trim().min(1),
    value: z.string(),
    description: z.string().trim(),
});

export const SecretsSettingsSchema = z.object({
    secrets: z.array(SecretEntrySchema),
});

export const SmsProviderSettingsSchema = z.object({
    Enabled: z.boolean(),
    ProviderId: z.string(),
    EndpointUrl: z.string(),
    SenderId: z.string(),
    UseServerSideProxy: z.boolean(),
    Secrets: z.object({
        ApiKey: z.string(),
        ApiSecret: z.string(),
    }),
});

export const GstIntegrationSettingsSchema = z.object({
    Enabled: z.boolean(),
    DefaultSellerStateCode: z.string(),
    HsnSacCatalog: z.array(
        z.object({
            Code: z.string(),
            Description: z.string(),
            TaxRatePercent: z.string(),
        }),
    ),
});

export const GspIntegrationSettingsSchema = z.object({
    Enabled: z.boolean(),
    ProviderId: z.string(),
    BaseUrl: z.string(),
    Sandbox: z.boolean(),
    ClientId: z.string(),
    ClientSecret: z.string(),
    Endpoints: z.object({
        EInvoice: z.string(),
        Gstr: z.string(),
    }),
});

export const FieldTypeSchema = z.enum([
    'Text',
    'Textarea',
    'Character',
    'Number',
    'Decimal',
    'Money',
    'Quantity',
    'Rate',
    'Date',
    'DateTime',
    'Dropdown',
    'MultiSelect',
    'Checkbox',
    'Label',
    'Separator',
    'Blank',
    'Attachment',
    'Signature',
    'QRCode',
    'LineItemSection',
]);

export const FieldConfigSchema = z
    .object({
        FieldId: z.string().min(1),
        Label: z.string().min(1),
        Type: FieldTypeSchema,
        Required: z.boolean().optional(),
        DefaultValue: z.unknown().optional(),
        Prefix: z.string().optional(),
        Suffix: z.string().optional(),
        Placeholder: z.string().optional(),
        SampleValue: z.unknown().optional(),
        ReadOnly: z.boolean().optional(),
        Visible: z.boolean().optional(),
        MaxLength: z.number().int().positive().optional(),
        Precision: z.number().int().nonnegative().optional(),
        Calculated: z.boolean().optional(),
        CalculationOrder: z.number().int().optional(),
        Formula: z.string().optional(),
    })
    .passthrough();

export const LineItemSectionConfigSchema = z
    .object({
        SectionId: z.string().min(1),
        Label: z.string().min(1),
        MinRows: z.number().int().nonnegative(),
        MaxRows: z.number().int().positive(),
        EssentialColumns: z.array(z.string().min(1)),
        AllowAddRows: z.boolean(),
        AllowDuplicateRows: z.boolean(),
        AllowReorderRows: z.boolean(),
        AllowBulkPaste: z.boolean(),
        AllowBulkUpload: z.boolean(),
        Fields: z.array(FieldConfigSchema).min(1),
    })
    .passthrough();

export const CalculationPolicySchema = z
    .object({
        Currency: z.string().min(1),
        MoneyPrecision: z.number().int().nonnegative(),
        QuantityPrecision: z.number().int().nonnegative(),
        RatePrecision: z.number().int().nonnegative(),
        RoundingMode: z.string().min(1),
        TaxRoundingLevel: z.string().min(1),
        DateFormat: z.string().min(1),
        DateTimeFormat: z.string().min(1),
        DefaultPrefix: z.string(),
        DefaultSuffix: z.string(),
    })
    .passthrough();

export const BuilderLayoutSchema = z
    .object({
        Columns: z.number().int().min(1).max(5),
        Gap: z.number().int().min(0),
    })
    .passthrough();

export const BuilderPrintSettingsSchema = z
    .object({
        PaperSize: z.enum(['A4', 'Letter', 'Thermal']),
        MarginPreset: z.enum(['Normal', 'Compact', 'Wide']),
        BottomSpacingMm: z.number().int().min(0).max(60),
    })
    .passthrough();

export const DocumentFormatConfigSchema = z
    .object({
        FormatId: z.string().min(1),
        FormatName: z.string().min(1),
        Description: z.string().optional(),
        Layout: BuilderLayoutSchema.optional(),
        Print: BuilderPrintSettingsSchema.optional(),
        Fields: z.array(FieldConfigSchema),
        LineItemSections: z.array(LineItemSectionConfigSchema),
        CalculationPolicy: CalculationPolicySchema,
    })
    .passthrough();

export const StartupHealthSettingSchema = z.object({
    LastStartupCheckAt: z.string().min(1),
    SchemaVersion: z.literal(2),
});

export type DocumentFormatConfig = z.infer<typeof DocumentFormatConfigSchema>;
export type CompanyProfileConfig = z.infer<typeof CompanyProfileSchema>;
export type GspIntegrationSettings = z.infer<typeof GspIntegrationSettingsSchema>;
export type GstIntegrationSettings = z.infer<typeof GstIntegrationSettingsSchema>;
export type RuntimeBrandingConfig = z.infer<typeof RuntimeBrandingSchema>;
export type SignaturePadSettings = z.infer<typeof SignaturePadSettingsSchema>;
export type SecretEntry = z.infer<typeof SecretEntrySchema>;
export type SecretsSettings = z.infer<typeof SecretsSettingsSchema>;
export type SmsProviderSettings = z.infer<typeof SmsProviderSettingsSchema>;
