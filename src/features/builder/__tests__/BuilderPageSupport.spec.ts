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

afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
});

describe('BuilderPageSupport', () => {
    it('keeps the wizard steps and helper copy aligned', () => {
        expect(steps).toEqual([
            'Format',
            'Fields',
            'Layout',
            'Line Items',
            'Calculations',
            'Print',
            'Preview & Save',
        ]);
        expect(helperFor('Format')).toContain('document name');
        expect(helperFor('Preview & Save')).toContain('field and print previews');
        expect(move([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
        expect(newField(0)).toMatchObject({ FieldId: 'Field1', Label: 'New field 1' });
        expect(mimeTypeFromName('logo.WEBP')).toBe('image/webp');
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
});
