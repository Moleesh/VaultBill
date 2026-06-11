/** @format */

import type { LineItemSectionConfigSchema } from '../../db/startup/ConfigSchemas';
import type { FieldValidationIssue } from './SchemaEngineTypes';
import type { z } from 'zod';

export type LineItemSectionConfig = z.infer<typeof LineItemSectionConfigSchema>;

export type LineItemRow = {
    readonly RowId: string;
    readonly DisplayOrder: number;
    readonly Values: Readonly<Record<string, unknown>>;
};

export type LineItemRowDraft = {
    readonly Values?: Readonly<Record<string, unknown>>;
};

export type LineItemValidationIssue = FieldValidationIssue & {
    readonly rowId: string;
    readonly displayOrder: number;
};

export type LineItemOperationResult = {
    readonly rows: readonly LineItemRow[];
};

export type RowIdFactory = () => string;
