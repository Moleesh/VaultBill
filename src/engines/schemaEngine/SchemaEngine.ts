/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { DocumentFormatConfigSchema } from '../../db/startup/ConfigSchemas';
import { parseJsonWithSchema } from '../../db/startup/JsonParsing';
import { getFieldCatalogEntry } from './FieldCatalog';
import { validateFieldValue } from './FieldValueValidation';
import type {
    BreakingChangeWarning,
    DocumentValidationResult,
    FieldConfig,
    FieldReferenceIndex,
    SchemaFieldPath,
} from './SchemaEngineTypes';

export { validateFieldValue } from './FieldValueValidation';

export const parseDocumentFormatConfig = (rawJson: string): DocumentFormatConfig =>
    parseJsonWithSchema(rawJson, DocumentFormatConfigSchema);

export const getAllFieldPaths = (format: DocumentFormatConfig): readonly SchemaFieldPath[] => [
    ...format.Fields.map((field) => toFieldPath(field)),
    ...format.LineItemSections.flatMap((section) =>
        section.Fields.map((field) => toFieldPath(field, section.SectionId)),
    ),
];

export const getSavableFields = (format: DocumentFormatConfig): readonly SchemaFieldPath[] =>
    getAllFieldPaths(format).filter((field) => getFieldCatalogEntry(field.type).isSavableByDefault);

export const validateDocumentValues = (
    format: DocumentFormatConfig,
    values: Readonly<Record<string, unknown>>,
): DocumentValidationResult => {
    const issues = format.Fields.flatMap((field) =>
        validateFieldValue(field, values[field.FieldId]),
    );

    return {
        isValid: issues.length === 0,
        issues,
    };
};

export const detectBreakingChangeWarnings = (
    previousFormat: DocumentFormatConfig,
    nextFormat: DocumentFormatConfig,
    references: FieldReferenceIndex,
): readonly BreakingChangeWarning[] => [
    ...detectFormatIdWarning(previousFormat, nextFormat),
    ...detectRemovedFieldReferenceWarnings(previousFormat, nextFormat, references),
];

const detectFormatIdWarning = (
    previousFormat: DocumentFormatConfig,
    nextFormat: DocumentFormatConfig,
): readonly BreakingChangeWarning[] =>
    previousFormat.FormatId === nextFormat.FormatId
        ? []
        : [
              {
                  kind: 'FormatIdChanged',
                  message: 'Changing FormatId is a breaking change.',
                  affectedReferences: [],
              },
          ];

const detectRemovedFieldReferenceWarnings = (
    previousFormat: DocumentFormatConfig,
    nextFormat: DocumentFormatConfig,
    references: FieldReferenceIndex,
): readonly BreakingChangeWarning[] => {
    const nextFieldIds = new Set(getAllFieldPaths(nextFormat).map((field) => field.fieldId));
    return getAllFieldPaths(previousFormat)
        .filter((field) => !nextFieldIds.has(field.fieldId))
        .flatMap((field) => {
            const affectedReferences = getReferencesForField(field.fieldId, references);
            return affectedReferences.length > 0
                ? [
                      {
                          kind: 'FieldRemovedWithReferences' as const,
                          message: `${field.label} cannot be deleted without reviewing dependent references.`,
                          affectedReferences,
                      },
                  ]
                : [];
        });
};

const getReferencesForField = (
    fieldId: string,
    references: FieldReferenceIndex,
): readonly string[] => [
    ...(references.formulaReferences?.[fieldId] ?? []),
    ...(references.reportReferences?.[fieldId] ?? []),
    ...(references.printReferences?.[fieldId] ?? []),
    ...(references.prepopulateReferences?.[fieldId] ?? []),
];

const toFieldPath = (field: FieldConfig, sectionId?: string): SchemaFieldPath => ({
    fieldId: field.FieldId,
    label: field.Label,
    type: field.Type,
    ...(sectionId ? { sectionId } : {}),
});
