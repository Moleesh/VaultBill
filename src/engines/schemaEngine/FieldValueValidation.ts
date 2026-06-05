import { getFieldCatalogEntry } from './FieldCatalog';
import type { FieldConfig, FieldValidationIssue } from './SchemaEngineTypes';

const decimalPattern = /^-?\d+(?:\.\d+)?$/u;
const datePattern = /^\d{4}-\d{2}-\d{2}$/u;

export const validateFieldValue = (
  field: FieldConfig,
  value: unknown,
): readonly FieldValidationIssue[] => {
  const catalogEntry = getFieldCatalogEntry(field.Type);

  if (catalogEntry.isLayoutOnly || field.Type === 'QRCode') {
    return [];
  }

  if (isEmpty(value)) {
    return field.Required
      ? [{ fieldId: field.FieldId, message: `${field.Label} is required.` }]
      : [];
  }

  if (field.Type === 'Number' && !Number.isInteger(value)) {
    return [{ fieldId: field.FieldId, message: `${field.Label} must be an integer.` }];
  }

  if (isDecimalType(field.Type) && !isDecimalString(value)) {
    return [
      {
        fieldId: field.FieldId,
        message: `${field.Label} must be a decimal string.`,
      },
    ];
  }

  if (field.Type === 'Date' && !isDateString(value)) {
    return [{ fieldId: field.FieldId, message: `${field.Label} must be YYYY-MM-DD.` }];
  }

  if (field.Type === 'MultiSelect' && !isStringArray(value)) {
    return [{ fieldId: field.FieldId, message: `${field.Label} must be a string array.` }];
  }

  if (field.Type === 'Checkbox' && typeof value !== 'boolean') {
    return [{ fieldId: field.FieldId, message: `${field.Label} must be true or false.` }];
  }

  if (requiresString(field.Type) && typeof value !== 'string') {
    return [{ fieldId: field.FieldId, message: `${field.Label} must be text.` }];
  }

  if (
    field.Type === 'Character' &&
    typeof value === 'string' &&
    field.MaxLength &&
    value.length > field.MaxLength
  ) {
    return [
      {
        fieldId: field.FieldId,
        message: `${field.Label} must be ${field.MaxLength.toString()} characters or fewer.`,
      },
    ];
  }

  return [];
};

const isEmpty = (value: unknown): boolean => value === undefined || value === null || value === '';

const isDecimalType = (type: FieldConfig['Type']): boolean =>
  type === 'Decimal' || type === 'Money' || type === 'Quantity' || type === 'Rate';

const isDecimalString = (value: unknown): boolean =>
  typeof value === 'string' && decimalPattern.test(value);

const isDateString = (value: unknown): boolean =>
  typeof value === 'string' && datePattern.test(value);

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const requiresString = (type: FieldConfig['Type']): boolean =>
  type === 'Text' ||
  type === 'Textarea' ||
  type === 'Character' ||
  type === 'DateTime' ||
  type === 'Dropdown' ||
  type === 'Signature';
