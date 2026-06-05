import type { DocumentFormatConfig, FieldConfigSchema } from '../../db/startup/ConfigSchemas';
import type { FieldType } from './FieldCatalog';
import type { z } from 'zod';

export type FieldConfig = z.infer<typeof FieldConfigSchema>;

export type FieldValidationIssue = {
  readonly fieldId: string;
  readonly message: string;
};

export type DocumentValidationResult = {
  readonly isValid: boolean;
  readonly issues: readonly FieldValidationIssue[];
};

export type FieldReferenceIndex = {
  readonly formulaReferences?: Readonly<Record<string, readonly string[]>>;
  readonly reportReferences?: Readonly<Record<string, readonly string[]>>;
  readonly printReferences?: Readonly<Record<string, readonly string[]>>;
  readonly prepopulateReferences?: Readonly<Record<string, readonly string[]>>;
};

export type BreakingChangeWarning = {
  readonly kind: 'FormatIdChanged' | 'FieldRemovedWithReferences';
  readonly message: string;
  readonly affectedReferences: readonly string[];
};

export type SchemaFieldPath = {
  readonly fieldId: string;
  readonly label: string;
  readonly type: FieldType;
  readonly sectionId?: string;
};

export type SchemaEngineInput = {
  readonly format: DocumentFormatConfig;
  readonly values: Readonly<Record<string, unknown>>;
};
