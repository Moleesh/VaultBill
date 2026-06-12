/** @format */

/**
 * Keeps Builder preview rendering, asset links, and file helpers covered by
 * direct unit tests instead of relying on UI smoke checks alone.
 */

import { describe, expect, it, vi } from 'vitest';

import { cloneDefault } from '../BuilderPageSupport';
import {
    downloadBase64Asset,
    escapePreviewHtml,
    extensionForMimeType,
    previewValue,
    renderBuilderPreview,
    updateOptionalNumber,
} from '../BuilderPagePreviewSupport';

describe('BuilderPagePreviewSupport', () => {
    it('renders preview values and escapes markup safely', () => {
        const config = {
            ...cloneDefault(),
            FormatName: 'GST <Invoice>',
            FormatId: 'TaxInvoice',
            Fields: [
                {
                    FieldId: 'CustomerName',
                    Label: 'Customer name',
                    Type: 'Text',
                    SampleValue: '<Acme & Co>',
                } as never,
            ],
        };
        const html = renderBuilderPreview(
            '<main>{{FormatName}} {{CustomerName}} {{Asset.logo.svg}}</main>',
            config,
            [{ name: 'logo.svg', type: 'image/svg+xml', size: 12, dataBase64: 'PHN2Zz48L3N2Zz4=' }],
        );

        expect(html).toContain('GST &lt;Invoice&gt;');
        expect(html).toContain('&lt;Acme &amp; Co&gt;');
        expect(html).toContain('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
        expect(escapePreviewHtml('"Hello" & <world>')).toBe(
            '&quot;Hello&quot; &amp; &lt;world&gt;',
        );
    });

    it('maps mime types and downloads assets from the preview pane', () => {
        expect(extensionForMimeType('font/woff2')).toBe('woff2');
        expect(extensionForMimeType('image/png')).toBe('png');
        expect(previewValue(null)).toBe('');
        expect(previewValue(42)).toBe('42');

        const asset = {
            name: 'logo.svg',
            type: 'image/svg+xml',
            size: 6,
            dataBase64: 'PHN2Zz4=',
        };
        const click = vi.fn();
        const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
            click,
        } as never);

        downloadBase64Asset(asset);

        expect(createElement).toHaveBeenCalledWith('a');
        expect(click).toHaveBeenCalledOnce();
        expect(updateOptionalNumber({ FieldId: 'Price' } as never, 'Precision', 3)).toMatchObject({
            Precision: 3,
        });
        expect(
            updateOptionalNumber({ FieldId: 'Price' } as never, 'Precision', Number.NaN),
        ).toEqual({ FieldId: 'Price', Precision: undefined });
    });
});
