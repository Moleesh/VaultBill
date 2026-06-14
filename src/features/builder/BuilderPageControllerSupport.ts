/** @format */

import type { z } from 'zod';

import type { DocumentFormatConfigSchema } from '../../db/startup/ConfigSchemas';
import type { BuilderLayoutConfig, BuilderPrintConfig } from './BuilderPageSupport';

export type EditingState =
    | { readonly kind: 'document' | 'line'; readonly index: number }
    | undefined;
export type DocumentFormatConfig = z.infer<typeof DocumentFormatConfigSchema> & {
    readonly Layout?: BuilderLayoutConfig | undefined;
    readonly Print?: BuilderPrintConfig | undefined;
};
export type FieldConfig = DocumentFormatConfig['Fields'][number];

export const updateBuilderFields = (
    config: DocumentFormatConfig,
    lineSection: DocumentFormatConfig['LineItemSections'][number] | undefined,
    kind: 'document' | 'line',
    fields: readonly FieldConfig[],
): DocumentFormatConfig => {
    if (kind === 'document') {
        return { ...config, Fields: [...fields] };
    }
    if (!lineSection) return config;
    return { ...config, LineItemSections: [{ ...lineSection, Fields: [...fields] }] };
};

export const updateBuilderCalculationOrder = (
    config: DocumentFormatConfig,
    orderedFieldIds: readonly string[],
): DocumentFormatConfig => {
    const orderById = new Map(orderedFieldIds.map((fieldId, index) => [fieldId, index + 1]));
    return {
        ...config,
        Fields: config.Fields.map((field) => {
            const order = orderById.get(field.FieldId);
            return order ? { ...field, CalculationOrder: order } : field;
        }),
        LineItemSections: config.LineItemSections.map((section) => ({
            ...section,
            Fields: section.Fields.map((field) => {
                const order = orderById.get(field.FieldId);
                return order ? { ...field, CalculationOrder: order } : field;
            }),
        })),
    };
};
