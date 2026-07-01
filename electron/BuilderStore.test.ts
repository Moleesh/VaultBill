/** @format */

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

    it('deletes non-default formats and preserves the default one', () => {
        directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-builder-'));
        store = new BuilderStore(path.join(directory, 'vaultbill.sqlite'));
        const activeStore = store;

        activeStore.save({
            config: { FormatId: 'TaxInvoice', FormatName: 'GST Invoice' },
            templateHtml: '<main>Default</main>',
            assets: [],
        });
        activeStore.save({
            config: { FormatId: 'RetailInvoice', FormatName: 'Retail Invoice' },
            templateHtml: '<main>Retail</main>',
            assets: [],
        });

        activeStore.delete('RetailInvoice');

        expect(activeStore.load('RetailInvoice')).toBeUndefined();
        expect(activeStore.load('TaxInvoice')).toBeDefined();
        expect(() => {
            activeStore.delete('TaxInvoice');
        }).toThrow('default document cannot be deleted');
    });
});
