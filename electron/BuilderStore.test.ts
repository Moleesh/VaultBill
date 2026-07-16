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

    it('allows static document metadata in print templates', () => {
        directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-builder-'));
        store = new BuilderStore(path.join(directory, 'vaultbill.sqlite'));

        const saved = store.save({
            config: { FormatId: 'MetaTemplate', FormatName: 'Meta Template' },
            templateHtml:
                '<!doctype html><html><head><meta charset="UTF-8"></head><body>Safe</body></html>',
            assets: [],
        });

        expect(saved.templateHtml).toContain('<meta charset="UTF-8">');
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

    it('allows standard SVG namespaces in bundled assets', () => {
        directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-builder-'));
        store = new BuilderStore(path.join(directory, 'vaultbill.sqlite'));

        const saved = store.save({
            config: { FormatId: 'SvgNamespace', FormatName: 'SVG Namespace' },
            templateHtml: '<main>{{Asset.Logo}}</main>',
            assets: [
                {
                    name: 'Logo',
                    type: 'image/svg+xml',
                    dataBase64: Buffer.from(
                        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" /></svg>',
                    ).toString('base64'),
                },
            ],
        });

        expect(saved.assets).toHaveLength(1);
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

    it('persists library metadata when default and enabled state changes', () => {
        directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-builder-'));
        store = new BuilderStore(path.join(directory, 'vaultbill.sqlite'));
        const activeStore = store;

        activeStore.save({
            config: {
                FormatId: 'TaxInvoice',
                FormatName: 'GST Invoice',
                LibraryMeta: { isEnabled: true, isFavorite: true, sortOrder: 0 },
            },
            templateHtml: '<main>GST</main>',
            assets: [],
        });
        activeStore.save({
            config: {
                FormatId: 'Bill',
                FormatName: 'Bill',
                LibraryMeta: { isEnabled: true, isFavorite: false, sortOrder: 1 },
            },
            templateHtml: '<main>Bill</main>',
            assets: [],
        });

        activeStore.save({
            config: {
                FormatId: 'TaxInvoice',
                FormatName: 'GST Invoice',
                LibraryMeta: { isEnabled: true, isFavorite: false, sortOrder: 0 },
            },
            templateHtml: '<main>GST</main>',
            assets: [],
        });
        activeStore.save({
            config: {
                FormatId: 'Bill',
                FormatName: 'Bill',
                LibraryMeta: { isEnabled: true, isFavorite: true, sortOrder: 1 },
            },
            templateHtml: '<main>Bill</main>',
            assets: [],
        });
        activeStore.save({
            config: {
                FormatId: 'TaxInvoice',
                FormatName: 'GST Invoice',
                LibraryMeta: { isEnabled: false, isFavorite: false, sortOrder: 0 },
            },
            templateHtml: '<main>GST</main>',
            assets: [],
        });

        expect(activeStore.listInventory()).toMatchObject([
            {
                formatId: 'TaxInvoice',
                isDefault: false,
                isEnabled: false,
            },
            {
                formatId: 'Bill',
                isDefault: true,
                isEnabled: true,
            },
        ]);
        expect(activeStore.loadDefault()?.config.FormatId).toBe('Bill');
    });
});
