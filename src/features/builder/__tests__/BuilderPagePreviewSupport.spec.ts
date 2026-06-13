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
        const config = cloneDefault();
        config.FormatName = 'GST <Invoice>';
        config.FormatId = 'TaxInvoice';
        config.Fields = [
            {
                FieldId: 'CustomerName',
                Label: 'Customer name',
                Type: 'Text',
                SampleValue: 'Sample Customer',
            } as never,
        ];
        const lineSection = config.LineItemSections[0];
        if (!lineSection) throw new Error('Default builder seed should include one line section.');
        config.LineItemSections = [
            {
                ...lineSection,
                Fields: [
                    {
                        FieldId: 'Amount',
                        Label: 'Amount',
                        Type: 'Money',
                        SampleValue: '1000.00',
                    } as never,
                ],
            },
        ];
        const html = renderBuilderPreview(
            '<main>{{FormatName}} {{Company.Name}} {{Record.CustomerName}} {{Items.0.Amount}} {{Asset.logo.svg}}</main>',
            config,
            [
                {
                    name: 'logo.svg',
                    type: 'image/svg+xml',
                    size: 12,
                    dataBase64: 'PHN2Zz48L3N2Zz4=',
                },
            ],
        );

        expect(html).toContain('GST &lt;Invoice&gt;');
        expect(html).toContain('VaultBill Demo');
        expect(html).toContain('Sample Customer');
        expect(html).toContain('1000.00');
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
