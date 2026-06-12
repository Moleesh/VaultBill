/** @format */

import { describe, expect, it } from 'vitest';

import {
    BuilderAssetSchema,
    BuilderPackageSchema,
    sanitizeSvg,
    sanitizeTemplateHtml,
    toBuffer,
} from './BuilderStoreSupport.js';

describe('builder store support', () => {
    it('accepts valid package and asset payloads', () => {
        const asset = BuilderAssetSchema.parse({
            name: 'Logo',
            type: 'image/svg+xml',
            dataBase64: 'c3Zn',
        });
        const packageValue = BuilderPackageSchema.parse({
            config: { FormatId: 'TaxInvoice', FormatName: 'GST Invoice' },
            templateHtml: '<main>Ready</main>',
            assets: [asset],
        });

        expect(packageValue.assets).toHaveLength(1);
    });

    it('rejects template html with scripts and external loading', () => {
        expect(() => sanitizeTemplateHtml('<script>alert(1)</script>')).toThrow(
            'Print template HTML contains a blocked element.',
        );
        expect(() => sanitizeTemplateHtml('<img src="https://example.com/a.png">')).toThrow(
            'Print template HTML contains blocked active or external content.',
        );
    });

    it('rejects unsafe svg content', () => {
        expect(() => sanitizeSvg('<svg><script /></svg>')).toThrow(
            'SVG assets cannot contain scripts, active content, or external resources.',
        );
    });

    it('normalizes binary blobs into buffers', () => {
        expect(toBuffer(new Uint8Array([1, 2, 3]))).toEqual(Buffer.from([1, 2, 3]));
    });
});
