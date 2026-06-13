/** @format */

import { evaluateFormula } from '../../engines/formulaEngine/FormulaEngine';
import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
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
): string => {
    const formula = field.Formula?.trim();
    if (!formula) return 'No formula';
    const values = Object.fromEntries(
        allFields.map((candidate) => [candidate.FieldId, sampleValueFor(candidate)]),
    );
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
