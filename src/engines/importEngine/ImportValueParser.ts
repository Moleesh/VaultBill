import type { FieldConfig } from '../schemaEngine/SchemaEngineTypes';

export const parseImportValue = (field: FieldConfig, rawValue: string | undefined): unknown => {
  const value = rawValue?.trim() ?? '';

  if (!value) {
    return undefined;
  }

  if (field.Type === 'Number') {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : value;
  }

  if (field.Type === 'Checkbox') {
    if (/^(true|yes|1)$/iu.test(value)) {
      return true;
    }

    if (/^(false|no|0)$/iu.test(value)) {
      return false;
    }

    return value;
  }

  if (field.Type === 'MultiSelect') {
    return value
      .split(';')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return value;
};
