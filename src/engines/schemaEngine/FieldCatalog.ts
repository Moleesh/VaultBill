import type { z } from 'zod';

import type { FieldTypeSchema } from '../../db/startup/ConfigSchemas';

export type FieldType = z.infer<typeof FieldTypeSchema>;

export type FieldStorageKind =
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'StringArray'
  | 'Attachment'
  | 'Generated'
  | 'Layout'
  | 'LineItemRows';

export type FieldCatalogEntry = {
  readonly type: FieldType;
  readonly storageKind: FieldStorageKind;
  readonly isLayoutOnly: boolean;
  readonly isSavableByDefault: boolean;
};

const field = (
  type: FieldType,
  storageKind: FieldStorageKind,
  isLayoutOnly = false,
  isSavableByDefault = !isLayoutOnly,
): FieldCatalogEntry => ({
  type,
  storageKind,
  isLayoutOnly,
  isSavableByDefault,
});

export const fieldCatalog: Readonly<Record<FieldType, FieldCatalogEntry>> = {
  Text: field('Text', 'String'),
  Textarea: field('Textarea', 'String'),
  Character: field('Character', 'String'),
  Number: field('Number', 'Number'),
  Decimal: field('Decimal', 'String'),
  Money: field('Money', 'String'),
  Quantity: field('Quantity', 'String'),
  Rate: field('Rate', 'String'),
  Date: field('Date', 'String'),
  DateTime: field('DateTime', 'String'),
  Dropdown: field('Dropdown', 'String'),
  MultiSelect: field('MultiSelect', 'StringArray'),
  Checkbox: field('Checkbox', 'Boolean'),
  Label: field('Label', 'Layout', true),
  Separator: field('Separator', 'Layout', true),
  Blank: field('Blank', 'Layout', true),
  Attachment: field('Attachment', 'Attachment'),
  Signature: field('Signature', 'String'),
  QRCode: field('QRCode', 'Generated', false, false),
  LineItemSection: field('LineItemSection', 'LineItemRows'),
};

export const getFieldCatalogEntry = (type: FieldType): FieldCatalogEntry => fieldCatalog[type];
