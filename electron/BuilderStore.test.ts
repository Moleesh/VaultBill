// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { BuilderStore } from './BuilderStore.js';

let directory: string | undefined;
let store: BuilderStore | undefined;

afterEach(() => {
  store?.close();
  store = undefined;
  if (directory) rmSync(directory, { recursive: true, force: true });
  directory = undefined;
});

describe('BuilderStore', () => {
  it('persists configuration, sanitized HTML, and separate asset blobs', () => {
    directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-builder-'));
    store = new BuilderStore(path.join(directory, 'vaultbill.sqlite'));
    const saved = store.save({
      config: {
        FormatId: 'TaxInvoice',
        FormatName: 'GST Invoice',
        Fields: [],
        LineItemSections: [],
        CalculationPolicy: {},
      },
      templateHtml: '<main><img src="{{Asset.Logo}}"><h1>{{Record.Number}}</h1></main>',
      assets: [
        {
          name: 'Logo',
          type: 'image/png',
          dataBase64: Buffer.from('image-bytes').toString('base64'),
        },
      ],
    });

    expect(saved.assets).toHaveLength(1);
    expect(store.loadDefault()).toEqual(saved);
  });

  it('rejects active or externally loaded template content', () => {
    directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-builder-'));
    store = new BuilderStore(path.join(directory, 'vaultbill.sqlite'));

    expect(() =>
      store?.save({
        config: { FormatId: 'Unsafe', FormatName: 'Unsafe' },
        templateHtml: '<script src="https://example.com/a.js"></script>',
        assets: [],
      }),
    ).toThrow('blocked element');
  });

  it('rejects active content inside uploaded SVG assets', () => {
    directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-builder-'));
    store = new BuilderStore(path.join(directory, 'vaultbill.sqlite'));

    expect(() =>
      store?.save({
        config: { FormatId: 'UnsafeSvg', FormatName: 'Unsafe SVG' },
        templateHtml: '<main>{{Asset.Logo}}</main>',
        assets: [
          {
            name: 'Logo',
            type: 'image/svg+xml',
            dataBase64: Buffer.from('<svg onload="alert(1)"></svg>').toString('base64'),
          },
        ],
      }),
    ).toThrow('SVG assets cannot contain');
  });
});
