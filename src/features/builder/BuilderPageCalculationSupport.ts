/** @format */

import { evaluateFormula } from '../../engines/formulaEngine/FormulaEngine';
import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { FieldConfig } from './BuilderPageSupport';

const numericFieldTypes = new Set(['Number', 'Decimal', 'Money', 'Quantity', 'Rate']);

export const formulaReferences = (formula: string): readonly string[] =>
    [...formula.matchAll(/\b([A-Za-z_][\w]*)\b/gu)].map((match) => match[1] ?? '');

export const collectReferencedFieldIds = (fields: readonly FieldConfig[]): ReadonlySet<string> => {
    const ids = new Set<string>();
    for (const field of fields) {
        for (const reference of formulaReferences(field.Formula ?? '')) ids.add(reference);
    }
    return ids;
};

/** Validates formulas and returns the current builder warning list. */
export const validateCalculationGraph = (fields: readonly FieldConfig[]): readonly string[] => {
    const byId = new Map(fields.map((field) => [field.FieldId, field]));
    const issues: string[] = [];
    const calculated = fields.filter((field) => field.Calculated && field.Formula);
    for (const field of calculated) {
        const references = formulaReferences(field.Formula ?? '');
        for (const reference of references) {
            const target = byId.get(reference);
            if (!target) {
                issues.push(`Formula for ${field.Label} references unknown field ${reference}.`);
                continue;
            }
            if (!target.Calculated && !numericFieldTypes.has(target.Type)) {
                issues.push(
                    `Formula for ${field.Label} references ${target.Label}, which is not numeric.`,
                );
            }
        }
    }
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (fieldId: string): boolean => {
        if (visited.has(fieldId)) return false;
        if (visiting.has(fieldId)) return true;
        visiting.add(fieldId);
        const field = byId.get(fieldId);
        const cycle = formulaReferences(field?.Formula ?? '').some((reference) => {
            const target = byId.get(reference);
            return Boolean(target?.Calculated && visit(reference));
        });
        visiting.delete(fieldId);
        visited.add(fieldId);
        return cycle;
    };
    for (const field of calculated) {
        if (visit(field.FieldId)) {
            issues.push(`Formula dependency cycle detected at ${field.Label}.`);
        }
    }
    return issues;
};

export const sampleFormula = (
    field: FieldConfig,
    allFields: readonly FieldConfig[],
    policy: DocumentFormatConfig['CalculationPolicy'],
): string => {
    const formula = field.Formula?.trim();
    if (!formula) return 'No formula';
    const values = Object.fromEntries(
        allFields.map((candidate) => {
            const defaultValue = candidate.DefaultValue;
            const numeric =
                typeof defaultValue === 'number' || typeof defaultValue === 'string'
                    ? Number.parseFloat(String(defaultValue))
                    : 0;
            return [candidate.FieldId, Number.isNaN(numeric) ? 0 : numeric];
        }),
    );
    try {
        const result = evaluateFormula(
            formula,
            values,
            policy,
            field.Precision ?? policy.MoneyPrecision,
        );
        return result.formatted;
    } catch {
        return 'Formula could not be previewed';
    }
};

export const applyCalculationOrder = (config: DocumentFormatConfig): DocumentFormatConfig => {
    const fields = [
        ...config.Fields.map((field) => ({ ...field })),
        ...(config.LineItemSections[0]?.Fields ?? []).map((field) => ({ ...field })),
    ];
    const calculatedIds = new Set(
        fields.filter((field) => field.Calculated && field.Formula).map((field) => field.FieldId),
    );
    const ordered: string[] = [];
    const visited = new Set<string>();
    const visit = (fieldId: string) => {
        if (visited.has(fieldId)) return;
        visited.add(fieldId);
        const field = fields.find((candidate) => candidate.FieldId === fieldId);
        if (!field || !calculatedIds.has(field.FieldId)) return;
        for (const reference of formulaReferences(field.Formula ?? '')) visit(reference);
        ordered.push(field.FieldId);
    };
    for (const field of fields) visit(field.FieldId);
    const orderById = new Map(ordered.map((fieldId, index) => [fieldId, index + 1]));
    const apply = (field: FieldConfig): FieldConfig => {
        const order = orderById.get(field.FieldId);
        return order ? { ...field, CalculationOrder: order } : field;
    };
    return {
        ...config,
        Fields: config.Fields.map(apply),
        LineItemSections: config.LineItemSections.map((section) => ({
            ...section,
            Fields: section.Fields.map(apply),
        })),
    };
};
