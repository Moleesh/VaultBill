/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { FieldConfig } from '../schemaEngine/SchemaEngineTypes';

export type SourceTable = {
    readonly delimiter: ',' | '\t';
    readonly rows: readonly (readonly string[])[];
};

export type SourceColumn = {
    readonly columnIndex: number;
    readonly header: string;
};

export type ImportFieldKind = 'Required' | 'Optional' | 'SystemGenerated' | 'AutoCalculated';

export type ImportFieldDescriptor = {
    readonly fieldId: string;
    readonly label: string;
    readonly type: FieldConfig['Type'] | 'System';
    readonly kind: ImportFieldKind;
    readonly sampleValue?: unknown;
    readonly fieldConfig?: FieldConfig;
};

export type ImportMapping = Readonly<Record<string, number>>;

export type ImportPreviewIssue = {
    readonly rowNumber: number;
    readonly fieldId: string;
    readonly message: string;
};

export type ImportPreviewRow = {
    readonly rowNumber: number;
    readonly values: Readonly<Record<string, unknown>>;
    readonly issues: readonly ImportPreviewIssue[];
    readonly warnings: readonly ImportPreviewIssue[];
};

export type ImportPreviewResult = {
    readonly fields: readonly ImportFieldDescriptor[];
    readonly sourceColumns: readonly SourceColumn[];
    readonly proposedMapping: ImportMapping;
    readonly rows: readonly ImportPreviewRow[];
    readonly validRows: number;
    readonly invalidRows: number;
};

export type ImportScope =
    | { readonly kind: 'TopLevel'; readonly format: DocumentFormatConfig }
    | {
          readonly kind: 'LineItem';
          readonly format: DocumentFormatConfig;
          readonly sectionId: string;
      };

export type TemplateColumn = {
    readonly label: string;
    readonly fieldId: string;
    readonly required: string;
    readonly dataType: string;
    readonly example: string;
    readonly calculated: string;
};
