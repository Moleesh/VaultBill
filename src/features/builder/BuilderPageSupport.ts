/** @format */
/* eslint-disable max-lines */

import { builtInStoredFormats } from '../../constants/BuiltInDocumentFormats';
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import {
    builtInDefaultPrintAsset,
    builtInDefaultPrintTemplateHtml,
} from '../../db/startup/BuiltInDefaultPrintTemplate';
import {
    DocumentFormatConfigSchema,
    type DocumentFormatConfig,
} from '../../db/startup/ConfigSchemas';
import {
    isBuiltInBuilderFormat,
    readBuilderLibraryMeta,
    sortBuilderInventory,
    writeBuilderLibraryMeta,
    type BuilderInventoryItem,
} from './BuilderDocumentLibrarySupport';
import { withNormalizedFieldPlacements } from './BuilderFieldPlacementSupport';

/** Ordered builder steps used by the document-format wizard. */
export const steps = [
    'Format',
    'Layout',
    'Fields',
    'Line Items',
    'Summary',
    'Calculations',
    'Print',
    'Field Preview',
    'Print Preview',
] as const;

/** One step label from the builder workflow. */
export type BuilderStep = (typeof steps)[number];

/** Flex-based layout settings for the on-screen document editor. */
export type BuilderLayoutConfig = {
    readonly Columns: number;
    readonly Gap: number;
};

/** Printable page settings surfaced during the print step. */
export type BuilderPrintConfig = {
    readonly PaperSize: 'A4' | 'Letter' | 'Thermal';
    readonly Orientation: 'Portrait' | 'Landscape';
    readonly PageWidthCm: number;
    readonly PageHeightCm: number;
    readonly MarginPreset: 'Normal' | 'Compact' | 'Wide';
    readonly BottomSpacingMm: number;
};

/** Convenience alias for one configured document field. */
export type FieldConfig = DocumentFormatConfig['Fields'][number];

/** One shared asset available to the builder preview and print pipeline. */
export type AssetSummary = {
    readonly name: string;
    readonly type: string;
    readonly size: number;
    readonly dataBase64: string;
};

/** Browser-side shape used when the demo runtime persists a full builder package. */
export type StoredBuilderPackage = {
    readonly config: unknown;
    readonly templateHtml: string;
    readonly savedTemplates?: readonly SavedPrintTemplate[];
    readonly assets: readonly {
        readonly name: string;
        readonly type: string;
        readonly dataBase64: string;
    }[];
};

/** Saved HTML template variant offered inside the builder workspace. */
export type SavedPrintTemplate = {
    readonly name: string;
    readonly templateHtml: string;
    readonly updatedAt: string;
};

/** Deep-clones the bundled document format so builder edits never mutate startup defaults. */
export const cloneDefault = (): DocumentFormatConfig =>
    withNormalizedFieldPlacements(
        DocumentFormatConfigSchema.parse(
            JSON.parse(JSON.stringify(builtInDefaultFormat)) as unknown,
        ),
    );

/** Shared starter asset that keeps the builder preview useful on first open. */
export const builtInSampleAsset: AssetSummary = {
    name: builtInDefaultPrintAsset.name,
    type: builtInDefaultPrintAsset.type,
    size: new TextEncoder().encode(builtInDefaultPrintAsset.svg).length,
    dataBase64: window.btoa(builtInDefaultPrintAsset.svg),
};

let browserBuilderConfig = cloneDefault();
let browserBuilderTemplateHtml = builtInDefaultPrintTemplateHtml;
let browserBuilderAssets: readonly AssetSummary[] = [builtInSampleAsset];
let browserSavedTemplates: readonly SavedPrintTemplate[] = [];
const browserBuilderPackages = new Map<string, StoredBuilderPackage>();

const createBrowserSavedTemplates = (formatName: string): readonly SavedPrintTemplate[] => [
    {
        name: `${formatName} Shared HTML`,
        templateHtml: builtInDefaultPrintTemplateHtml,
        updatedAt: new Date().toISOString(),
    },
];

const normalizeStoredBuilderPackage = (
    builderPackage: StoredBuilderPackage,
): StoredBuilderPackage => ({
    ...builderPackage,
    savedTemplates: [...(builderPackage.savedTemplates ?? [])],
    assets: [...builderPackage.assets],
});

const initializeBrowserBuilderPackages = () => {
    if (browserBuilderPackages.size > 0) return;
    for (const [index, storedFormat] of builtInStoredFormats.entries()) {
        const parsed = withNormalizedFieldPlacements(
            DocumentFormatConfigSchema.parse(JSON.parse(storedFormat.formatJson) as unknown),
        );
        const config = writeBuilderLibraryMeta(parsed, {
            isEnabled: true,
            isFavorite: storedFormat.isDefault,
            sortOrder: index,
        });
        browserBuilderPackages.set(storedFormat.formatId, {
            config,
            templateHtml: builtInDefaultPrintTemplateHtml,
            savedTemplates: createBrowserSavedTemplates(storedFormat.formatName),
            assets: [builtInSampleAsset],
        });
    }
};

const updateBrowserDefaultMetadata = (favoriteFormatId: string) => {
    for (const [formatId, storedPackage] of browserBuilderPackages.entries()) {
        browserBuilderPackages.set(formatId, {
            ...storedPackage,
            config: writeBuilderLibraryMeta(storedPackage.config as DocumentFormatConfig, {
                isFavorite: formatId === favoriteFormatId,
            }),
        });
    }
};

/** Reads the current in-memory builder config for demo-mode editing. */
export const readConfig = (): DocumentFormatConfig => {
    return withNormalizedFieldPlacements(DocumentFormatConfigSchema.parse(browserBuilderConfig));
};

/** Reads the active print-template HTML for demo-mode editing. */
export const readTemplateHtml = (): string => browserBuilderTemplateHtml;

/** Reads any saved shared HTML templates for demo-mode editing. */
export const readSavedTemplates = (): readonly SavedPrintTemplate[] => browserSavedTemplates;

/** Reads the active builder asset collection for demo-mode editing. */
export const readBuilderAssets = (): readonly AssetSummary[] => browserBuilderAssets;

/** Replaces the in-memory builder package used by the browser demo runtime. */
export const writeBuilderPackage = (builderPackage: {
    readonly config: DocumentFormatConfig;
    readonly templateHtml: string;
    readonly assets: readonly AssetSummary[];
    readonly savedTemplates: readonly SavedPrintTemplate[];
}) => {
    initializeBrowserBuilderPackages();
    browserBuilderConfig = withNormalizedFieldPlacements(
        DocumentFormatConfigSchema.parse(
            JSON.parse(JSON.stringify(builderPackage.config)) as unknown,
        ),
    );
    browserBuilderTemplateHtml = builderPackage.templateHtml;
    browserBuilderAssets = [...builderPackage.assets];
    browserSavedTemplates = [...builderPackage.savedTemplates];
    const configWithLibraryMeta = builderPackage.config;
    const libraryMeta = readBuilderLibraryMeta(configWithLibraryMeta);
    browserBuilderPackages.set(configWithLibraryMeta.FormatId, {
        config: withNormalizedFieldPlacements(
            DocumentFormatConfigSchema.parse(
                JSON.parse(JSON.stringify(configWithLibraryMeta)) as unknown,
            ),
        ),
        templateHtml: builderPackage.templateHtml,
        savedTemplates: [...builderPackage.savedTemplates],
        assets: [...builderPackage.assets],
    });
    if (libraryMeta.isFavorite) updateBrowserDefaultMetadata(configWithLibraryMeta.FormatId);
};

export const listBrowserBuilderInventory = (): readonly BuilderInventoryItem[] => {
    initializeBrowserBuilderPackages();
    const now = new Date().toISOString();
    return sortBuilderInventory(
        [...browserBuilderPackages.values()].map((storedPackage) => {
            const config = withNormalizedFieldPlacements(
                DocumentFormatConfigSchema.parse(storedPackage.config),
            );
            const libraryMeta = readBuilderLibraryMeta(config);
            return {
                formatId: config.FormatId,
                formatName: config.FormatName,
                isDefault: libraryMeta.isFavorite,
                isBuiltIn: isBuiltInBuilderFormat(config.FormatId),
                isEnabled: libraryMeta.isEnabled,
                updatedAt: storedPackage.savedTemplates?.[0]?.updatedAt ?? now,
                templateName: `${config.FormatName} Print`,
                assetCount: storedPackage.assets.length,
                isValid: Boolean(storedPackage.templateHtml),
                sortOrder: libraryMeta.sortOrder,
            } satisfies BuilderInventoryItem;
        }),
    );
};

export const readBrowserBuilderPackage = (formatId?: string): StoredBuilderPackage | null => {
    initializeBrowserBuilderPackages();
    const inventory = listBrowserBuilderInventory();
    const resolvedFormatId = formatId ?? inventory.find((item) => item.isDefault)?.formatId;
    if (!resolvedFormatId) return null;
    const storedPackage = browserBuilderPackages.get(resolvedFormatId);
    if (!storedPackage) return null;
    return normalizeStoredBuilderPackage(storedPackage);
};

export const removeBrowserBuilderPackage = (formatId: string): void => {
    initializeBrowserBuilderPackages();
    browserBuilderPackages.delete(formatId);
};

/** Creates a starter field configuration for ad-hoc builder additions. */
export const newField = (index: number): FieldConfig => ({
    FieldId: `Field${String(index + 1)}`,
    Label: `New field ${String(index + 1)}`,
    Type: 'Text',
    Required: false,
    Visible: true,
});

/** Creates a calculated field ready to appear in the summary totals area. */
export const newSummaryField = (fields: readonly FieldConfig[]): FieldConfig => {
    let nextNumber = fields.filter((field) => /^SummaryTotal\d+$/u.test(field.FieldId)).length + 1;
    while (fields.some((field) => field.FieldId === `SummaryTotal${String(nextNumber)}`)) {
        nextNumber += 1;
    }

    return {
        ...newField(fields.length),
        FieldId: `SummaryTotal${String(nextNumber)}`,
        Label: `Summary total ${String(nextNumber)}`,
        Type: 'Money',
        Calculated: true,
        Formula: '0',
        DisplayPlacement: 'Summary',
        Visible: true,
    };
};

/** Moves one item inside a readonly array and returns a reordered copy. */
export const move = <T>(items: readonly T[], from: number, to: number): readonly T[] => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    return next;
};

/** Returns helper copy for the active builder step. */
export const helperFor = (step: BuilderStep): string =>
    ({
        Format: 'Choose the document name operators see when creating a record.',
        Layout: 'Choose flex columns and gap for the document flow.',
        Fields: 'Add the business fields shown above the line-item table.',
        'Line Items':
            'Design repeatable product or service rows and keep subtotal and total formulas visible.',
        Summary: 'Choose which calculated fields appear in the totals area below line items.',
        Calculations:
            'Connect numeric fields with same-row math, SUMALL totals, Secrets.Key values, GST, and round-off helpers.',
        Print: 'Upload one HTML file and the images or fonts it references.',
        'Field Preview': 'Review the read-only field layout before you publish.',
        'Print Preview': 'Check the rendered print output and paper settings before publishing.',
    })[step];

/** Formats an asset size into a compact human-readable label. */
export const formatBytes = (size: number): string =>
    size < 1024 * 1024
        ? `${(size / 1024).toFixed(1)} KB`
        : `${(size / (1024 * 1024)).toFixed(1)} MB`;

/** Encodes bytes into Base64 for builder assets stored in browser memory. */
export const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return window.btoa(binary);
};

/** Estimates the decoded byte length of a Base64 string without materializing a buffer. */
export const base64ByteLength = (base64: string): number =>
    Math.floor((base64.length * 3) / 4) -
    (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);

/** Infers the supported MIME type from a selected asset filename. */
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

/** Warns before importing an unusually large builder asset into browser memory. */
export const confirmLargeFile = (name: string, size: number): boolean =>
    window.confirm(`"${name}" is ${(size / (1024 * 1024)).toFixed(1)} MB. Continue importing it?`);

/** Default flex-layout settings for a newly opened builder format. */
export const defaultBuilderLayout: BuilderLayoutConfig = {
    Columns: 2,
    Gap: 16,
};

/** Default print settings shown before a format customizes paper output. */
export const defaultBuilderPrintSettings: BuilderPrintConfig = {
    PaperSize: 'A4',
    Orientation: 'Portrait',
    PageWidthCm: 21,
    PageHeightCm: 29.7,
    MarginPreset: 'Normal',
    BottomSpacingMm: 18,
};

const paperDimensionsCm: Readonly<
    Record<BuilderPrintConfig['PaperSize'], readonly [number, number]>
> = {
    A4: [21, 29.7],
    Letter: [21.6, 27.9],
    Thermal: [8, 42],
};

/** Returns the page dimensions for the selected paper and orientation. */
export const dimensionsForPaper = (
    paperSize: BuilderPrintConfig['PaperSize'],
    orientation: BuilderPrintConfig['Orientation'],
): Pick<BuilderPrintConfig, 'PageWidthCm' | 'PageHeightCm'> => {
    const [portraitWidth, portraitHeight] = paperDimensionsCm[paperSize];
    const [width, height] =
        orientation === 'Landscape'
            ? [portraitHeight, portraitWidth]
            : [portraitWidth, portraitHeight];

    return {
        PageWidthCm: width,
        PageHeightCm: height,
    };
};

/** Merges legacy print config with current defaults. */
export const normalizePrintSettings = (
    printSettings?: Partial<BuilderPrintConfig>,
): BuilderPrintConfig => {
    const dimensions = dimensionsForPaper(
        printSettings?.PaperSize ?? defaultBuilderPrintSettings.PaperSize,
        printSettings?.Orientation ?? defaultBuilderPrintSettings.Orientation,
    );

    return {
        ...defaultBuilderPrintSettings,
        ...dimensions,
        ...printSettings,
    };
};

/** Keeps builder column counts inside the supported layout range. */
export const clampColumns = (columns: number): number => Math.min(5, Math.max(1, columns));
