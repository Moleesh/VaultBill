/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { FieldConfig } from './BuilderPageSupport';
export { sampleFormula } from './BuilderFormulaPreviewSupport';

const numericFieldTypes = new Set(['Number', 'Decimal', 'Money', 'Quantity', 'Rate']);

export type CalculationTarget = {
    readonly kind: 'document' | 'line';
    readonly sectionIndex: number;
    readonly fieldIndex: number;
    readonly field: FieldConfig;
};

const calculationRoots = (config: DocumentFormatConfig): readonly FieldConfig[] => {
    const fields = [
        ...config.Fields,
        ...config.LineItemSections.flatMap((section) => section.Fields),
    ];
    return [...fields]
        .map((field, index) => ({ field, index }))
        .sort((left, right) => {
            const leftOrder = left.field.CalculationOrder ?? Number.MAX_SAFE_INTEGER;
            const rightOrder = right.field.CalculationOrder ?? Number.MAX_SAFE_INTEGER;
            return leftOrder - rightOrder || left.index - right.index;
        })
        .map(({ field }) => field);
};

export const collectCalculationTargets = (
    config: DocumentFormatConfig,
): readonly CalculationTarget[] => {
    const targets: CalculationTarget[] = config.Fields.filter((field) => field.Calculated).map(
        (field, fieldIndex) => ({
            kind: 'document' as const,
            sectionIndex: 0,
            fieldIndex,
            field,
        }),
    );
    for (const [sectionIndex, section] of config.LineItemSections.entries()) {
        targets.push(
            ...section.Fields.filter((field) => field.Calculated).map((field, fieldIndex) => ({
                kind: 'line' as const,
                sectionIndex,
                fieldIndex,
                field,
            })),
        );
    }
    const orderById = new Map(
        calculationRoots(config).map((field, index) => [field.FieldId, index]),
    );
    return [...targets].sort((left, right) => {
        const leftOrder = orderById.get(left.field.FieldId) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = orderById.get(right.field.FieldId) ?? Number.MAX_SAFE_INTEGER;
        return (
            leftOrder - rightOrder ||
            left.kind.localeCompare(right.kind) ||
            left.sectionIndex - right.sectionIndex ||
            left.fieldIndex - right.fieldIndex
        );
    });
};

export const formulaReferences = (formula: string): readonly string[] =>
    [
        ...formula
            .replace(/\bSUMALL\(\s*/giu, '(')
            .replace(/\bSUM\(\s*Items\./giu, '(')
            .replace(/\bCOUNT\(\s*Items\s*\)/giu, '')
            .matchAll(/\b([A-Za-z_][\w]*)\b/gu),
    ].map((match) => match[1] ?? '');

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

export const applyCalculationOrderOverride = (
    config: DocumentFormatConfig,
    orderedFieldIds: readonly string[],
): DocumentFormatConfig => {
    const orderById = new Map(orderedFieldIds.map((fieldId, index) => [fieldId, index + 1]));
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

export const applyCalculationOrder = (config: DocumentFormatConfig): DocumentFormatConfig => {
    const fields = calculationRoots(config).map((field) => ({ ...field }));
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
