import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import {
  canDeleteDocumentFormat,
  defaultFormatFallbackWarning,
  resolveDocumentFormatSelection,
} from './DocumentFormatResolver';
import type { StoredDocumentFormat } from './DocumentFormatTypes';

const storedDefault = (): StoredDocumentFormat => ({
  formatId: 'TaxInvoice',
  formatName: 'GST Invoice',
  formatJson: JSON.stringify(builtInDefaultFormat),
  isDefault: true,
});

const storedBill = (): StoredDocumentFormat => ({
  formatId: 'Bill',
  formatName: 'Bill',
  formatJson: JSON.stringify({
    ...builtInDefaultFormat,
    FormatId: 'Bill',
    FormatName: 'Bill',
  }),
  isDefault: false,
});

describe('DocumentFormatResolver', () => {
  it('loads by FormatId first', () => {
    const result = resolveDocumentFormatSelection({ formatId: 'Bill', formatName: 'GST Invoice' }, [
      storedDefault(),
      storedBill(),
    ]);

    expect(result.format.formatId).toBe('Bill');
    expect(result.fallbackKind).toBe('None');
  });

  it('falls back to the same FormatName when FormatId is unavailable', () => {
    const result = resolveDocumentFormatSelection({ formatId: 'MissingBill', formatName: 'Bill' }, [
      storedDefault(),
      storedBill(),
    ]);

    expect(result.format.formatId).toBe('Bill');
    expect(result.fallbackKind).toBe('FormatName');
  });

  it('falls back to the single default format with the required warning', () => {
    const result = resolveDocumentFormatSelection({ formatId: 'Missing', formatName: 'Missing' }, [
      storedDefault(),
      storedBill(),
    ]);

    expect(result.format.formatId).toBe('TaxInvoice');
    expect(result.fallbackKind).toBe('Default');
    expect(result.warning).toBe(defaultFormatFallbackWarning);
  });

  it('stops when no valid default format exists', () => {
    expect(() => resolveDocumentFormatSelection({ formatId: 'Missing' }, [storedBill()])).toThrow(
      /exactly one valid default/u,
    );
  });

  it('prevents deleting the default document format', () => {
    const result = resolveDocumentFormatSelection({ formatId: 'TaxInvoice' }, [storedDefault()]);

    expect(canDeleteDocumentFormat(result.format)).toEqual({
      canDelete: false,
      reason: 'The default document format cannot be deleted.',
    });
  });
});
