/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { getFieldCatalogEntry } from '../schemaEngine/FieldCatalog';
import type { LineItemSectionConfig } from '../schemaEngine/LineItemTypes';
import type { FieldConfig } from '../schemaEngine/SchemaEngineTypes';
import type { ImportFieldDescriptor, ImportScope } from './ImportTypes';

export const getImportFields = (scope: ImportScope): readonly ImportFieldDescriptor[] => {
    if (scope.kind === 'LineItem') {
        return getLineItemImportFields(scope.format, scope.sectionId);
    }

    return [
        {
            fieldId: 'ExternalDocumentNumber',
            label: 'External Document Number',
            type: 'System',
            kind: 'Optional',
            sampleValue: '',
        },
        ...scope.format.Fields.flatMap(toImportField),
    ];
};

const getLineItemImportFields = (
    format: DocumentFormatConfig,
    sectionId: string,
): readonly ImportFieldDescriptor[] => {
    const section = getLineItemSection(format, sectionId);
    return section.Fields.flatMap(toImportField);
};

export const getLineItemSection = (
    format: DocumentFormatConfig,
    sectionId: string,
): LineItemSectionConfig => {
    const section = format.LineItemSections.find((candidate) => candidate.SectionId === sectionId);

    if (!section) {
        throw new Error(`Line item section ${sectionId} was not found.`);
    }

    return section;
};

const toImportField = (field: FieldConfig): readonly ImportFieldDescriptor[] => {
    const catalogEntry = getFieldCatalogEntry(field.Type);

    if (!catalogEntry.isSavableByDefault) {
        return [];
    }

    return [
        {
            fieldId: field.FieldId,
            label: field.Label,
            type: field.Type,
            kind: field.Calculated ? 'AutoCalculated' : field.Required ? 'Required' : 'Optional',
            sampleValue: field.SampleValue,
            fieldConfig: field,
        },
    ];
};
