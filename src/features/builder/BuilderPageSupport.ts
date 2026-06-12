/** @format */

import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import { builtInDefaultPrintAsset } from '../../db/startup/BuiltInDefaultPrintTemplate';
import {
    DocumentFormatConfigSchema,
    type DocumentFormatConfig,
} from '../../db/startup/ConfigSchemas';

export const steps = [
    'Format',
    'Fields',
    'Layout',
    'Line Items',
    'Calculations',
    'Print',
    'Preview & Save',
] as const;
export type BuilderStep = (typeof steps)[number];
export type BuilderLayoutConfig = {
    readonly Rows: number;
    readonly Columns: number;
};
export type FieldConfig = DocumentFormatConfig['Fields'][number];
export type AssetSummary = {
    readonly name: string;
    readonly type: string;
    readonly size: number;
    readonly dataBase64: string;
};
export type StoredBuilderPackage = {
    readonly config: unknown;
    readonly templateHtml: string;
    readonly assets: readonly {
        readonly name: string;
        readonly type: string;
        readonly dataBase64: string;
    }[];
};

export const storageKey = 'vaultbill.builder';
export const legacyStorageKey = 'vaultbill.builder.v24';
export const htmlStorageKey = 'vaultbill.builder.template-html';

export const cloneDefault = (): DocumentFormatConfig =>
    DocumentFormatConfigSchema.parse(JSON.parse(JSON.stringify(builtInDefaultFormat)) as unknown);

export const builtInSampleAsset: AssetSummary = {
    name: builtInDefaultPrintAsset.name,
    type: builtInDefaultPrintAsset.type,
    size: new TextEncoder().encode(builtInDefaultPrintAsset.svg).length,
    dataBase64: window.btoa(builtInDefaultPrintAsset.svg),
};

export const readConfig = (): DocumentFormatConfig => {
    try {
        return DocumentFormatConfigSchema.parse(
            JSON.parse(
                window.localStorage.getItem(storageKey) ??
                    window.localStorage.getItem(legacyStorageKey) ??
                    'null',
            ) as unknown,
        );
    } catch {
        return cloneDefault();
    }
};

export const newField = (index: number): FieldConfig => ({
    FieldId: `Field${String(index + 1)}`,
    Label: `New field ${String(index + 1)}`,
    Type: 'Text',
    Required: false,
    Visible: true,
});

export const move = <T>(items: readonly T[], from: number, to: number): readonly T[] => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    return next;
};

export const helperFor = (step: BuilderStep): string =>
    ({
        Format: 'Choose the document name operators see when creating a record.',
        Fields: 'Add the business fields shown above the line-item table.',
        Layout: 'Set the document grid before you tune totals and print output.',
        'Line Items': 'Design repeatable product or service rows with totals.',
        Calculations: 'Connect numeric fields with formulas, GST, and round-off.',
        Print: 'Upload one HTML file and the images or fonts it references.',
        'Preview & Save': 'Check field and print previews before publishing.',
    })[step];

export const formatBytes = (size: number): string =>
    size < 1024 * 1024
        ? `${(size / 1024).toFixed(1)} KB`
        : `${(size / (1024 * 1024)).toFixed(1)} MB`;

export const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return window.btoa(binary);
};

export const base64ByteLength = (base64: string): number =>
    Math.floor((base64.length * 3) / 4) -
    (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);

export const mimeTypeFromName = (name: string): string =>
    name.toLocaleLowerCase().endsWith('.woff2')
        ? 'font/woff2'
        : name.toLocaleLowerCase().endsWith('.woff')
          ? 'font/woff'
          : name.toLocaleLowerCase().endsWith('.svg')
            ? 'image/svg+xml'
            : name.toLocaleLowerCase().endsWith('.webp')
              ? 'image/webp'
              : name.toLocaleLowerCase().endsWith('.png')
                ? 'image/png'
                : 'application/octet-stream';

export const confirmLargeFile = (name: string, size: number): boolean =>
    window.confirm(`"${name}" is ${(size / (1024 * 1024)).toFixed(1)} MB. Continue importing it?`);
