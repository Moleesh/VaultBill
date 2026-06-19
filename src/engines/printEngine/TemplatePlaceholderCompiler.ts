/** @format */

import { createDataUrl } from './DataUrlEncoding';
import { renderUnknownPrintValue } from './LineItemRenderer';
import type { PrintCompileWarning, PrintTemplateAsset } from './PrintTemplateTypes';
import { sanitizeTemplateHtml } from './TemplateHtmlSanitizer';

/** Matches `{{Placeholder.Name}}` tokens inside sanitized print-template HTML. */
const placeholderPattern = /{{\s*([A-Za-z0-9_.-]+)\s*}}/g;

/** Input values needed to compile one HTML print template. */
export type CompilePrintTemplateInput = {
    readonly templateHtml: string;
    readonly values: Readonly<Record<string, unknown>>;
    readonly assets: readonly PrintTemplateAsset[];
};

/** Compiled HTML plus any non-fatal missing-placeholder warnings. */
export type CompilePrintTemplateResult = {
    readonly html: string;
    readonly warnings: readonly PrintCompileWarning[];
};

/** Replaces value and asset placeholders inside sanitized print-template HTML. */
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

/** Resolves `Asset.*` placeholders into safe data URLs or records a warning. */
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

/** Resolves record-value placeholders into printable text or records a warning. */
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
