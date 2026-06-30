/** @format */

import { DocumentFormatConfigSchema } from '../../db/startup/ConfigSchemas';
import { isHostedApiErrorStatus, requestHostedApi } from '../../runtime/HostedApi';
import {
    normalizeSecretsSettings,
    secretValuesFromSettings,
} from '../settings/SettingsSecretsSectionSupport';
import { validateCalculationGraph } from './BuilderPageCalculationSupport';
import type { DocumentFormatConfig, FieldConfig } from './BuilderPageControllerSupport';

/** Collects field IDs referenced inside formulas so builder warnings stay in sync. */
export const collectReferencedFieldIds = (fields: readonly FieldConfig[]): ReadonlySet<string> => {
    const referencedFieldIds = new Set<string>();
    for (const field of fields) {
        for (const reference of field.Formula?.matchAll(/\b([A-Za-z_][\w]*)\b/gu) ?? []) {
            const match = reference[1];
            if (match) referencedFieldIds.add(match);
        }
    }
    return referencedFieldIds;
};

/** Runs schema, uniqueness, and formula validation for the current builder format. */
export const validateBuilderConfig = ({
    allFields,
    config,
    lineSection,
    templateHtml,
}: {
    readonly allFields: readonly FieldConfig[];
    readonly config: DocumentFormatConfig;
    readonly lineSection: DocumentFormatConfig['LineItemSections'][number] | undefined;
    readonly templateHtml: string;
}): readonly string[] => {
    const result = DocumentFormatConfigSchema.safeParse(config);
    const errors = result.success ? [] : result.error.issues.map((issue) => issue.message);
    const ids = [
        ...config.Fields.map((field) => field.FieldId),
        ...(lineSection?.Fields.map((field) => field.FieldId) ?? []),
    ];
    if (new Set(ids).size !== ids.length) errors.push('Every field ID must be unique.');
    for (const field of [...config.Fields, ...(lineSection?.Fields ?? [])]) {
        if (field.Calculated && !field.Formula?.trim()) {
            errors.push(`${field.Label} is calculated but has no formula.`);
        }
    }
    errors.push(...validateCalculationGraph(allFields));
    if (!templateHtml.trim()) errors.push('Upload one HTML print template.');
    return errors;
};

/** Loads builder secret values from the active runtime so formula previews can resolve them. */
export const loadBuilderSecretValues = async (
    isHostedWeb: boolean,
): Promise<Readonly<Record<string, string>>> => {
    let rawSettings: unknown;
    if (window.vaultBillDesktop) {
        rawSettings = await window.vaultBillDesktop.getSecretsSettings();
    } else if (isHostedWeb) {
        try {
            rawSettings = await requestHostedApi('/settings/secrets');
        } catch (error) {
            if (isHostedApiErrorStatus(error, [401, 403, 404])) {
                rawSettings = undefined;
            } else {
                throw error;
            }
        }
    }
    const normalized = normalizeSecretsSettings(rawSettings);
    return secretValuesFromSettings(normalized.secrets);
};
