/** @format */

/**
 * Exercises the Builder calculation helpers so formulas, ordering, and preview
 * messaging stay stable as document fields evolve.
 */

import { describe, expect, it } from 'vitest';

import { cloneDefault } from '../BuilderPageSupport';
import {
    applyCalculationOrder,
    collectReferencedFieldIds,
    formulaReferences,
    sampleFormula,
    validateCalculationGraph,
} from '../BuilderPageCalculationSupport';

describe('BuilderPageCalculationSupport', () => {
    it('extracts formula references and flags bad calculation graphs', () => {
        expect(formulaReferences('Subtotal + GST + RoundOff')).toEqual([
            'Subtotal',
            'GST',
            'RoundOff',
        ]);
        expect(
            collectReferencedFieldIds([
                { FieldId: 'Subtotal', Formula: 'GST + RoundOff' } as never,
                { FieldId: 'GST', Formula: 'RoundOff + 1' } as never,
            ]),
        ).toEqual(new Set(['GST', 'RoundOff']));

        const issues = validateCalculationGraph([
            {
                FieldId: 'GrandTotal',
                Label: 'Grand total',
                Type: 'Money',
                Calculated: true,
                Formula: 'MissingField + 1',
            } as never,
            {
                FieldId: 'Description',
                Label: 'Description',
                Type: 'Text',
                Calculated: false,
            } as never,
            {
                FieldId: 'CycleA',
                Label: 'Cycle A',
                Type: 'Money',
                Calculated: true,
                Formula: 'CycleB + 1',
            } as never,
            {
                FieldId: 'CycleB',
                Label: 'Cycle B',
                Type: 'Money',
                Calculated: true,
                Formula: 'CycleA + 1',
            } as never,
        ]);

        expect(issues.some((issue) => issue.includes('unknown field MissingField'))).toBe(true);
        expect(issues.some((issue) => issue.includes('not numeric'))).toBe(false);
        expect(issues.some((issue) => issue.includes('dependency cycle'))).toBe(true);
    });

    it('samples formulas and applies calculation order to document fields', () => {
        const config = cloneDefault();
        const amountField = {
            FieldId: 'Amount',
            Label: 'Amount',
            Type: 'Money',
            Calculated: true,
            Formula: 'Quantity * Rate',
            Precision: 2,
        } as const;
        const subtotalField = {
            FieldId: 'Subtotal',
            Label: 'Subtotal',
            Type: 'Money',
            Calculated: true,
            Formula: 'SUM(Items.Amount)',
            Precision: 2,
        } as const;

        expect(
            sampleFormula(
                amountField as never,
                [
                    { FieldId: 'Quantity', Label: 'Quantity', Type: 'Quantity', DefaultValue: 2 },
                    { FieldId: 'Rate', Label: 'Rate', Type: 'Money', DefaultValue: 10 },
                    amountField,
                ] as never,
                config.CalculationPolicy,
            ),
        ).toBe('20.00');

        const lineItemSection = config.LineItemSections[0];
        if (!lineItemSection) throw new Error('Missing default line-item section.');
        const ordered = applyCalculationOrder({
            ...config,
            Fields: [subtotalField],
            LineItemSections: [{ ...lineItemSection, Fields: [amountField] }],
        });

        expect(ordered.Fields[0]?.CalculationOrder).toBeGreaterThan(0);
        expect(ordered.LineItemSections[0]?.Fields[0]?.CalculationOrder).toBeGreaterThan(0);
    });
});
