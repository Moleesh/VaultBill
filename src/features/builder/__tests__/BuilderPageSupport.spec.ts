/** @format */

/**
 * Verifies the Builder shell helpers that keep step order, local storage, and
 * file import affordances aligned with the wizard UI.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    base64ByteLength,
    builtInSampleAsset,
    bytesToBase64,
    cloneDefault,
    confirmLargeFile,
    formatBytes,
    helperFor,
    legacyStorageKey,
    mimeTypeFromName,
    move,
    newField,
    readConfig,
    storageKey,
    steps,
} from '../BuilderPageSupport';
import {
    defaultSavedPrintTemplates,
    normalizeSavedPrintTemplates,
    templateNameFromFile,
} from '../BuilderSavedTemplatesSupport';

afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
});

describe('BuilderPageSupport', () => {
    it('keeps the wizard steps and helper copy aligned', () => {
        expect(steps).toEqual([
            'Format',
            'Layout',
            'Fields',
            'Line Items',
            'Calculations',
            'Print',
            'Field Preview',
            'Print Preview',
        ]);
        expect(helperFor('Format')).toContain('document name');
        expect(helperFor('Layout')).toContain('flex columns and gap');
        expect(helperFor('Calculations')).toContain('same-row math');
        expect(helperFor('Field Preview')).toContain('read-only field layout');
        expect(helperFor('Print Preview')).toContain('paper settings');
        expect(move([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
        expect(newField(0)).toMatchObject({ FieldId: 'Field1', Label: 'New field 1' });
        expect(mimeTypeFromName('logo.WEBP')).toBe('image/webp');
        expect(templateNameFromFile('shared-template.html')).toBe('shared-template');
        expect(defaultSavedPrintTemplates()).toHaveLength(1);
    });

    it('formats and decodes builder assets consistently', () => {
        const bytes = new Uint8Array([65, 66, 67]);
        const base64 = bytesToBase64(bytes);

        expect(base64).toBe('QUJD');
        expect(base64ByteLength(base64)).toBe(3);
        expect(formatBytes(1536)).toBe('1.5 KB');
        expect(builtInSampleAsset.name).toBeTruthy();
        expect(builtInSampleAsset.size).toBeGreaterThan(0);
    });

    it('reads stored builder config and confirms unusually large imports', () => {
        const saved = cloneDefault();
        saved.FormatName = 'Updated format';
        window.localStorage.setItem(storageKey, JSON.stringify(saved));
        expect(readConfig().FormatName).toBe('Updated format');

        window.localStorage.clear();
        window.localStorage.setItem(legacyStorageKey, JSON.stringify(cloneDefault()));
        expect(readConfig()).toEqual(cloneDefault());

        window.localStorage.setItem(storageKey, '{not-json');
        expect(readConfig()).toEqual(cloneDefault());

        vi.spyOn(window, 'confirm').mockReturnValueOnce(true).mockReturnValueOnce(false);
        expect(confirmLargeFile('template.html', 5 * 1024 * 1024)).toBe(true);
        expect(confirmLargeFile('template.html', 5 * 1024 * 1024)).toBe(false);
    });

    it('normalizes saved print templates with a fallback', () => {
        expect(normalizeSavedPrintTemplates(null)).toHaveLength(1);
        expect(
            normalizeSavedPrintTemplates([
                {
                    name: 'Template A',
                    templateHtml: '<html></html>',
                    updatedAt: '2026-06-14T00:00:00Z',
                },
            ]),
        ).toHaveLength(2);
    });
});
