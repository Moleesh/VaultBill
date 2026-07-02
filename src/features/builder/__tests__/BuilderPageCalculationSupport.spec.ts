/** @format */

/**
 * Exercises the Builder calculation helpers so formulas, ordering, and preview
 * messaging stay stable as document fields evolve.
 */

import { describe, expect, it } from 'vitest';

import {
    applyCalculationOrder,
    applyCalculationOrderOverride,
    collectCalculationTargets,
    collectReferencedFieldIds,
    formulaReferences,
    sampleFormula,
    validateCalculationGraph,
} from '../BuilderPageCalculationSupport';
import { cloneDefault } from '../BuilderPageSupport';

describe('BuilderPageCalculationSupport', () => {
    it('extracts formula references and flags bad calculation graphs', () => {
        expect(formulaReferences('SUMALL(Amount) + Subtotal + GST + Secrets.CompanyGSTIN')).toEqual(
            ['Amount', 'Subtotal', 'GST', 'Secrets.CompanyGSTIN'],
        );
        expect(
            collectReferencedFieldIds([
                { FieldId: 'Subtotal', Formula: 'GST + Secrets.CompanyGSTIN' } as never,
                { FieldId: 'GST', Formula: 'RoundOff + 1' } as never,
            ]),
        ).toEqual(new Set(['GST', 'RoundOff']));

        const issues = validateCalculationGraph([
            {
                FieldId: 'GrandTotal',
                Label: 'Grand total',
                Type: 'Money',
                Calculated: true,
                Formula: 'MissingField + Secrets.CompanyGSTIN',
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
            Formula: 'Quantity * Rate + Secrets.CompanyGSTIN',
            Precision: 2,
        } as const;
        const subtotalField = {
            FieldId: 'Subtotal',
            Label: 'Subtotal',
            Type: 'Money',
            Calculated: true,
            Formula: 'SUMALL(Amount)',
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
                { 'Secrets.CompanyGSTIN': '18' },
            ),
        ).toBe('38.00');

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

    it('collects calculated targets and preserves manual order overrides', () => {
        const config = cloneDefault();
        const orderedTargets = collectCalculationTargets({
            ...config,
            Fields: [
                {
                    FieldId: 'GrandTotal',
                    Label: 'Grand total',
                    Type: 'Money',
                    Calculated: true,
                    Formula: 'Subtotal + RoundOff',
                } as never,
                {
                    FieldId: 'Subtotal',
                    Label: 'Subtotal',
                    Type: 'Money',
                    Calculated: true,
                    Formula: 'SUMALL(Amount)',
                } as never,
            ],
        });

        expect(orderedTargets.map((target) => target.field.FieldId)).toEqual([
            'Amount',
            'GrandTotal',
            'Subtotal',
        ]);

        const reordered = applyCalculationOrderOverride(
            (() => {
                const lineItemSection = config.LineItemSections[0];
                if (!lineItemSection) throw new Error('Missing default line-item section.');
                return {
                    ...config,
                    Fields: [
                        {
                            FieldId: 'Subtotal',
                            Label: 'Subtotal',
                            Type: 'Money',
                            Calculated: true,
                            Formula: 'SUMALL(Amount)',
                        } as never,
                    ],
                    LineItemSections: [
                        {
                            ...lineItemSection,
                            Fields: [
                                {
                                    FieldId: 'Amount',
                                    Label: 'Amount',
                                    Type: 'Money',
                                    Calculated: true,
                                    Formula: 'Quantity * Rate',
                                } as never,
                            ],
                        },
                    ],
                };
            })(),
            ['Subtotal', 'Amount'],
        );

        expect(
            reordered.Fields.find((field) => field.FieldId === 'Subtotal')?.CalculationOrder,
        ).toBe(1);
        expect(
            reordered.LineItemSections[0]?.Fields.find((field) => field.FieldId === 'Amount')
                ?.CalculationOrder,
        ).toBe(2);
    });
});
