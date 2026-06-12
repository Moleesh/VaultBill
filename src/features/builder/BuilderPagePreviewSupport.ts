/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { AssetSummary } from './BuilderPageSupport';

export const renderBuilderPreview = (
    templateHtml: string,
    config: DocumentFormatConfig,
    assets: readonly AssetSummary[],
): string => {
    const values: Record<string, string> = {
        FormatName: config.FormatName,
        FormatId: config.FormatId,
    };
    let rendered = templateHtml;
    for (const field of config.Fields) {
        const sample = field.SampleValue ?? field.DefaultValue ?? field.Label;
        values[field.FieldId] = previewValue(sample);
    }
    for (const asset of assets) {
        values[`Asset.${asset.name}`] = `data:${asset.type};base64,${asset.dataBase64}`;
    }
    for (const [key, value] of Object.entries(values)) {
        rendered = rendered.replaceAll(`{{${key}}}`, escapePreviewHtml(value));
    }
    return rendered;
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
