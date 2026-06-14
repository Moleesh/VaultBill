/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { AssetSummary, BuilderPrintConfig } from './BuilderPageSupport';

const paperSizeStyles: Readonly<Record<BuilderPrintConfig['PaperSize'], string>> = {
    A4: '210mm 297mm',
    Letter: '216mm 279mm',
    Thermal: '80mm auto',
};

const marginStyles: Readonly<Record<BuilderPrintConfig['MarginPreset'], string>> = {
    Compact: '10mm',
    Normal: '18mm',
    Wide: '24mm',
};

export const renderBuilderPreview = (
    templateHtml: string,
    config: DocumentFormatConfig,
    assets: readonly AssetSummary[],
    printSettings: BuilderPrintConfig,
): string => {
    const values: Record<string, string> = {
        FormatName: config.FormatName,
        FormatId: config.FormatId,
        'Print.PaperSize': printSettings.PaperSize,
        'Print.MarginPreset': printSettings.MarginPreset,
        'Print.BottomSpacingMm': String(printSettings.BottomSpacingMm),
        'Company.Name': 'VaultBill Demo',
        'Company.Address': '1 Demo Lane',
        'Record.FormatName': config.FormatName,
        'Record.Status': 'Finalized',
        'Record.IsCancelled': 'false',
        'Record.CancellationReason': '',
    };
    let rendered = templateHtml;
    for (const field of config.Fields) {
        const sample = field.SampleValue ?? field.DefaultValue ?? field.Label;
        const preview = previewValue(sample);
        values[field.FieldId] = preview;
        values[`Record.${field.FieldId}`] = preview;
    }
    for (const field of config.LineItemSections[0]?.Fields ?? []) {
        const sample = field.SampleValue ?? field.DefaultValue ?? field.Label;
        const preview = previewValue(sample);
        values[`Items.0.${field.FieldId}`] = preview;
        values[`Items.1.${field.FieldId}`] =
            field.Type === 'Text' || field.Type === 'Textarea' ? `${preview} 2` : preview;
    }
    for (const asset of assets) {
        values[`Asset.${asset.name}`] = `data:${asset.type};base64,${asset.dataBase64}`;
    }
    for (const [key, value] of Object.entries(values)) {
        rendered = rendered.replaceAll(`{{${key}}}`, escapePreviewHtml(value));
    }
    const previewStyle = `
      @page {
        size: ${paperSizeStyles[printSettings.PaperSize]};
        margin: ${marginStyles[printSettings.MarginPreset]};
      }
      html, body {
        min-height: 100%;
      }
      body {
        margin: 0;
        padding: 0 0 ${String(printSettings.BottomSpacingMm)}mm;
        background: #eef6f4;
        color: #18302c;
      }
      .vaultbill-print-preview,
      .vaultbill-print-preview * {
        box-sizing: border-box;
      }
    `;
    return rendered.includes('</head>')
        ? rendered.replace('</head>', `<style>${previewStyle}</style></head>`)
        : `<style>${previewStyle}</style>${rendered}`;
};

export const escapePreviewHtml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

export const downloadBase64Asset = (asset: AssetSummary) => {
    const anchor = document.createElement('a');
    anchor.href = `data:${asset.type};base64,${asset.dataBase64}`;
    anchor.download = asset.name;
    anchor.click();
};

export const extensionForMimeType = (mimeType: string): string =>
    mimeType === 'font/woff2'
        ? 'woff2'
        : mimeType === 'font/woff'
          ? 'woff'
          : mimeType === 'image/svg+xml'
            ? 'svg'
            : mimeType === 'image/webp'
              ? 'webp'
              : mimeType === 'image/png'
                ? 'png'
                : 'bin';

export const updateOptionalNumber = (
    field: DocumentFormatConfig['Fields'][number],
    key: 'MaxLength' | 'Precision',
    value: number,
): DocumentFormatConfig['Fields'][number] => ({
    ...field,
    [key]: Number.isNaN(value) ? undefined : value,
});

export const previewValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
};
