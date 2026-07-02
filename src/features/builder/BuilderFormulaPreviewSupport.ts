/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { evaluateFormula } from '../../engines/formulaEngine/FormulaEngine';
import type { FieldConfig } from './BuilderPageSupport';

const sampleValueFor = (field: FieldConfig): number => {
    const sampleValue = field.SampleValue ?? field.DefaultValue ?? 0;
    const numeric =
        typeof sampleValue === 'number' || typeof sampleValue === 'string'
            ? Number.parseFloat(String(sampleValue))
            : 0;
    return Number.isNaN(numeric) ? 0 : numeric;
};

/** Produces a quick preview for the current formula and sample field values. */
export const sampleFormula = (
    field: FieldConfig,
    allFields: readonly FieldConfig[],
    policy: DocumentFormatConfig['CalculationPolicy'],
    secretValues: Readonly<Record<string, string>> = {},
): string => {
    const formula = field.Formula?.trim();
    if (!formula) return 'No formula';
    const values = Object.fromEntries(
        allFields.map((candidate) => [candidate.FieldId, sampleValueFor(candidate)]),
    );
    Object.assign(values, secretValues);
    for (const match of formula.matchAll(/\bSecrets\.([A-Za-z_][A-Za-z0-9_]*)\b/gu)) {
        const reference = match[0];
        if (!(reference in values)) values[reference] = 0;
    }
    try {
        return evaluateFormula(formula, values, policy, field.Precision ?? policy.MoneyPrecision, {
            sumAll: (fieldId) =>
                sampleValueFor(
                    allFields.find((candidate) => candidate.FieldId === fieldId) ?? field,
                ),
        }).formatted;
    } catch {
        return 'Formula could not be previewed';
    }
};
