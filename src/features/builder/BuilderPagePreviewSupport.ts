/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { AssetSummary, BuilderPrintConfig } from './BuilderPageSupport';

const marginStyles: Readonly<Record<BuilderPrintConfig['MarginPreset'], string>> = {
    Compact: '10mm',
    Normal: '18mm',
    Wide: '24mm',
};

const setValue = (values: Record<string, string>, key: string, value: string) => {
    values[key] = value;
};

const setRecordValue = (values: Record<string, string>, fieldId: string, value: string) => {
    setValue(values, fieldId, value);
    setValue(values, `Record.${fieldId}`, value);
};

const setLineValue = (
    values: Record<string, string>,
    rowIndex: number,
    fieldId: string,
    value: string,
) => {
    setValue(values, `Items.${String(rowIndex)}.${fieldId}`, value);
};

const applyRecordAliases = (values: Record<string, string>) => {
    const aliasPairs: readonly (readonly [string, string])[] = [
        ['Record.TaxAmount', 'Record.TaxTotal'],
        ['Record.TaxTotal', 'Record.TaxAmount'],
        ['Record.GstTotal', 'Record.TaxTotal'],
        ['Record.TaxTotal', 'Record.GstTotal'],
        ['Record.GST', 'Record.TaxTotal'],
        ['Record.Total', 'Record.GrandTotal'],
        ['Record.GrandTotal', 'Record.Total'],
        ['Record.RoundOff', 'Record.RoundedTotal'],
        ['Record.RoundedTotal', 'Record.RoundOff'],
    ];

    for (const [alias, source] of aliasPairs) {
        const sourceValue = values[source];
        if (sourceValue !== undefined && values[alias] === undefined) values[alias] = sourceValue;
    }
};

const applyLineAliases = (
    values: Record<string, string>,
    rowIndex: number,
    fieldId: string,
    value: string,
) => {
    const normalized = fieldId.toLocaleLowerCase();
    if (normalized === 'lineamount') setLineValue(values, rowIndex, 'Amount', value);
    if (normalized === 'amount') setLineValue(values, rowIndex, 'LineAmount', value);
    if (normalized === 'itemdescription') setLineValue(values, rowIndex, 'Description', value);
    if (normalized === 'description') setLineValue(values, rowIndex, 'ItemDescription', value);
};

const replaceTemplatePlaceholders = (
    templateHtml: string,
    values: Readonly<Record<string, string>>,
): string =>
    templateHtml.replace(/\{\{\s*([^}]+?)\s*\}\}/gu, (match, rawKey: string) => {
        const key = rawKey.trim();
        const value = values[key];
        if (value !== undefined) return key.startsWith('Asset.') ? value : escapePreviewHtml(value);
        return key.startsWith('Asset.') ? match : '';
    });

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
        setRecordValue(values, field.FieldId, preview);
    }
    applyRecordAliases(values);
    for (const section of config.LineItemSections) {
        if (section.Enabled === false) continue;
        for (const field of section.Fields) {
            const sample = field.SampleValue ?? field.DefaultValue ?? field.Label;
            const preview = previewValue(sample);
            setLineValue(values, 0, field.FieldId, preview);
            applyLineAliases(values, 0, field.FieldId, preview);
            const secondPreview =
                field.Type === 'Text' || field.Type === 'Textarea' ? `${preview} 2` : preview;
            setLineValue(values, 1, field.FieldId, secondPreview);
            applyLineAliases(values, 1, field.FieldId, secondPreview);
        }
    }
    for (const asset of assets) {
        values[`Asset.${asset.name}`] = `data:${asset.type};base64,${asset.dataBase64}`;
    }
    rendered = replaceTemplatePlaceholders(rendered, values);
    const paperMargin = marginStyles[printSettings.MarginPreset];
    const bottomSpacing = `${String(printSettings.BottomSpacingMm)}mm`;
    const pageSize = `${String(printSettings.PageWidthCm)}cm ${String(printSettings.PageHeightCm)}cm`;
    const previewStyle = `
      @page {
        size: ${pageSize};
        margin: ${paperMargin};
      }
      html {
        width: 100%;
        height: 100%;
        background: #eef6f4;
      }
      html, body {
        min-height: 100%;
        width: 100%;
      }
      body {
        margin: 0;
        background: #eef6f4;
        color: #18302c;
        overflow: visible;
      }
      .vaultbill-print-preview,
      .vaultbill-print-preview * {
        box-sizing: border-box;
      }
      .vaultbill-print-preview {
        width: 100%;
        min-height: 100%;
        overflow: visible;
      }
      @media screen {
        html,
        body {
          overflow: hidden;
        }

        body {
          padding: ${paperMargin} ${paperMargin} calc(${paperMargin} + ${bottomSpacing});
        }
      }
      @media print {
        body {
          padding: 0 0 ${bottomSpacing};
        }
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
