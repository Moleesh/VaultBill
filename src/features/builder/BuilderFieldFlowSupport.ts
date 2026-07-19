/** @format */

import type { FieldConfig } from './BuilderPageSupport';

type FieldFlow<TField extends Pick<FieldConfig, 'Type' | 'Visible'>> = {
    readonly beforeLineItems: readonly TField[];
    readonly afterLineItems: readonly TField[];
};

const isRenderedDocumentField = (field: Pick<FieldConfig, 'Type' | 'Visible'>) =>
    field.Type !== 'LineItemSection' && field.Visible !== false;

/** Splits document fields around the line-item section marker used by the builder flow. */
export const splitFieldsAroundLineItems = <TField extends Pick<FieldConfig, 'Type' | 'Visible'>>(
    fields: readonly TField[],
): FieldFlow<TField> => {
    const markerIndex = fields.findIndex((field) => field.Type === 'LineItemSection');
    const beforeFields = markerIndex >= 0 ? fields.slice(0, markerIndex) : fields;
    const afterFields = markerIndex >= 0 ? fields.slice(markerIndex + 1) : [];

    return {
        beforeLineItems: beforeFields.filter(isRenderedDocumentField),
        afterLineItems: afterFields.filter(isRenderedDocumentField),
    };
};
