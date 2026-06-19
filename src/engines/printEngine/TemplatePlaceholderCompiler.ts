/** @format */

import { createDataUrl } from './DataUrlEncoding';
import { renderUnknownPrintValue } from './LineItemRenderer';
import type { PrintCompileWarning, PrintTemplateAsset } from './PrintTemplateTypes';
import { sanitizeTemplateHtml } from './TemplateHtmlSanitizer';

const placeholderPattern = /{{\s*([A-Za-z0-9_.-]+)\s*}}/g;

export type CompilePrintTemplateInput = {
    readonly templateHtml: string;
    readonly values: Readonly<Record<string, unknown>>;
    readonly assets: readonly PrintTemplateAsset[];
};

export type CompilePrintTemplateResult = {
    readonly html: string;
    readonly warnings: readonly PrintCompileWarning[];
};

export const compilePrintTemplate = (
    input: CompilePrintTemplateInput,
): CompilePrintTemplateResult => {
    const warnings: PrintCompileWarning[] = [];
    const assetByName = new Map(input.assets.map((asset) => [asset.assetName, asset] as const));
    const sanitizedHtml = sanitizeTemplateHtml(input.templateHtml);
    const html = sanitizedHtml.replace(
        placeholderPattern,
        (_match: string, placeholder: string) => {
            if (placeholder.startsWith('Asset.')) {
                return resolveAssetPlaceholder(placeholder, assetByName, warnings);
            }

            return resolveValuePlaceholder(placeholder, input.values, warnings);
        },
    );

    return { html, warnings };
};

const resolveAssetPlaceholder = (
    placeholder: string,
    assetByName: ReadonlyMap<string, PrintTemplateAsset>,
    warnings: PrintCompileWarning[],
): string => {
    const assetName = placeholder.slice('Asset.'.length);
    const asset = assetByName.get(assetName);

    if (!asset) {
        warnings.push({
            kind: 'MissingAsset',
            placeholder,
            message: `${placeholder} asset is missing and rendered blank.`,
        });
        return '';
    }

    return createDataUrl(asset.mimeType, asset.assetBlob);
};

const resolveValuePlaceholder = (
    placeholder: string,
    values: Readonly<Record<string, unknown>>,
    warnings: PrintCompileWarning[],
): string => {
    const value = values[placeholder];

    if (value === undefined || value === null || value === '') {
        warnings.push({
            kind: 'MissingPlaceholder',
            placeholder,
            message: `${placeholder} value is missing and rendered blank.`,
        });
        return '';
    }

    return renderUnknownPrintValue(value);
};
