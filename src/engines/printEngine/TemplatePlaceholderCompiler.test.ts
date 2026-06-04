import { describe, expect, it } from 'vitest';

import { compilePrintTemplate } from './TemplatePlaceholderCompiler';
import type { PrintTemplateAsset } from './PrintTemplateTypes';

const createLogoAsset = (): PrintTemplateAsset => ({
  assetId: 'asset_1',
  templateId: 'TaxInvoiceA4',
  assetName: 'CompanyLogo',
  mimeType: 'image/png',
  assetBlob: new Uint8Array([72, 105]),
  sizeBytes: 2,
  createdAt: '2026-06-04T10:00:00.000Z',
});

describe('TemplatePlaceholderCompiler', () => {
  it('escapes record values and resolves DB assets to data URLs', () => {
    const result = compilePrintTemplate({
      templateHtml: '<img src="{{Asset.CompanyLogo}}" /><p>{{Record.CustomerName}}</p>',
      values: { 'Record.CustomerName': '<Acme & Sons>' },
      assets: [createLogoAsset()],
    });

    expect(result.html).toContain('data:image/png;base64,SGk=');
    expect(result.html).toContain('&lt;Acme &amp; Sons&gt;');
    expect(result.warnings).toEqual([]);
  });

  it('renders missing values and missing assets blank with warnings', () => {
    const result = compilePrintTemplate({
      templateHtml: '<img src="{{Asset.MissingLogo}}" /><p>{{Record.Missing}}</p>',
      values: {},
      assets: [],
    });

    expect(result.html).toBe('<img src="" /><p></p>');
    expect(result.warnings).toEqual([
      {
        kind: 'MissingAsset',
        placeholder: 'Asset.MissingLogo',
        message: 'Asset.MissingLogo asset is missing and rendered blank.',
      },
      {
        kind: 'MissingPlaceholder',
        placeholder: 'Record.Missing',
        message: 'Record.Missing value is missing and rendered blank.',
      },
    ]);
  });

  it('renders line item rows as escaped table cells', () => {
    const result = compilePrintTemplate({
      templateHtml: '<section>{{Items}}</section>',
      values: {
        Items: [
          {
            Values: {
              ItemName: 'A < B',
              Amount: '100.00',
            },
          },
        ],
      },
      assets: [],
    });

    expect(result.html).toContain('<table>');
    expect(result.html).toContain('<th>ItemName</th>');
    expect(result.html).toContain('<td>A &lt; B</td>');
  });
});
