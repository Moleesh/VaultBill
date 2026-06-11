/** @format */

import { z } from 'zod';

export const PrintTemplateScopeSchema = z.enum(['Record', 'Report']);

export const PrintTemplateMappingSchema = z
    .object({
        SourceField: z.string().min(1),
        SampleValue: z.unknown().optional(),
    })
    .passthrough();

export const PrintTemplateConfigSchema = z
    .object({
        TemplateId: z.string().min(1),
        TemplateName: z.string().min(1),
        Scope: PrintTemplateScopeSchema,
        Mappings: z.record(z.string().min(1), PrintTemplateMappingSchema),
    })
    .passthrough();

export type PrintTemplateScope = z.infer<typeof PrintTemplateScopeSchema>;
export type PrintTemplateConfig = z.infer<typeof PrintTemplateConfigSchema>;

export type PrintTemplateRecord = {
    readonly templateId: string;
    readonly templateName: string;
    readonly templateHtml: string;
    readonly templateConfig: PrintTemplateConfig;
    readonly scope: PrintTemplateScope;
    readonly updatedAt: string;
};

export type PrintTemplateAsset = {
    readonly assetId: string;
    readonly templateId: string;
    readonly assetName: string;
    readonly mimeType: string;
    readonly assetBlob: Uint8Array;
    readonly sizeBytes: number;
    readonly createdAt: string;
};

export type PrintWarningKind = 'MissingPlaceholder' | 'MissingAsset' | 'OutputCapabilityWarning';

export type PrintCompileWarning = {
    readonly kind: PrintWarningKind;
    readonly placeholder: string;
    readonly message: string;
};
