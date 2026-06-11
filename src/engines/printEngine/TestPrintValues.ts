/** @format */

import type { PrintTemplateConfig } from './PrintTemplateTypes';

export const buildTestPrintValues = (
    templateConfig: PrintTemplateConfig,
): Readonly<Record<string, unknown>> => {
    const values: Record<string, unknown> = {};

    for (const [placeholder, mapping] of Object.entries(templateConfig.Mappings)) {
        values[placeholder] = mapping.SampleValue ?? '';
    }

    return values;
};
