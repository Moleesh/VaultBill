/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { FieldConfig } from './BuilderPageSupport';

export type FieldDisplayPlacement =
    | 'Form'
    | 'LineItemColumn'
    | 'LineItemDetail'
    | 'Summary'
    | 'Hidden';

export type FieldPlacementGroup = {
    readonly formFields: readonly FieldConfig[];
    readonly lineItemColumns: readonly FieldConfig[];
    readonly lineItemDetails: readonly FieldConfig[];
    readonly summaryFields: readonly FieldConfig[];
    readonly hiddenFields: readonly FieldConfig[];
};

const summaryFieldIds = new Set(['subtotal', 'taxtotal', 'taxamount', 'roundoff', 'grandtotal']);
const lineDetailType = new Set(['Textarea', 'Attachment', 'Signature', 'QRCode']);

const normalizeId = (value: string): string => value.replaceAll(/[^a-z0-9]/giu, '').toLowerCase();

export const normalizeFieldPlacement = (
    field: Pick<FieldConfig, 'DisplayPlacement' | 'FieldId' | 'Type' | 'Visible'>,
    context: 'document' | 'line',
): FieldDisplayPlacement => {
    if (field.Visible === false) return 'Hidden';
    if (field.DisplayPlacement) return field.DisplayPlacement;
    if (context === 'line') {
        return lineDetailType.has(field.Type) ? 'LineItemDetail' : 'LineItemColumn';
    }
    return summaryFieldIds.has(normalizeId(field.FieldId)) ? 'Summary' : 'Form';
};

export const withNormalizedFieldPlacements = (
    config: DocumentFormatConfig,
): DocumentFormatConfig => ({
    ...config,
    Fields: config.Fields.map((field) => ({
        ...field,
        DisplayPlacement: normalizeFieldPlacement(field, 'document'),
    })),
    LineItemSections: config.LineItemSections.map((section) => ({
        ...section,
        Fields: section.Fields.map((field) => ({
            ...field,
            DisplayPlacement: normalizeFieldPlacement(field, 'line'),
        })),
    })),
});

export const groupDocumentFieldsByPlacement = (
    fields: readonly FieldConfig[],
): Pick<FieldPlacementGroup, 'formFields' | 'summaryFields' | 'hiddenFields'> => ({
    formFields: fields.filter((field) => normalizeFieldPlacement(field, 'document') === 'Form'),
    summaryFields: fields.filter(
        (field) => normalizeFieldPlacement(field, 'document') === 'Summary',
    ),
    hiddenFields: fields.filter((field) => normalizeFieldPlacement(field, 'document') === 'Hidden'),
});

export const groupLineFieldsByPlacement = (
    fields: readonly FieldConfig[],
): Pick<FieldPlacementGroup, 'lineItemColumns' | 'lineItemDetails' | 'hiddenFields'> => ({
    lineItemColumns: fields.filter(
        (field) => normalizeFieldPlacement(field, 'line') === 'LineItemColumn',
    ),
    lineItemDetails: fields.filter(
        (field) => normalizeFieldPlacement(field, 'line') === 'LineItemDetail',
    ),
    hiddenFields: fields.filter((field) => normalizeFieldPlacement(field, 'line') === 'Hidden'),
});

export const formatPlacementLabel = (placement: FieldDisplayPlacement): string =>
    ({
        Form: 'Form field',
        LineItemColumn: 'Line-item column',
        LineItemDetail: 'Line-item detail',
        Summary: 'Summary total',
        Hidden: 'Hidden',
    })[placement];
