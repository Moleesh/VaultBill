/** @format */

import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import { calculateLineItemRows, evaluateFormula } from './FormulaEngine';
import {
    addDecimal,
    decimalFromInteger,
    divideDecimal,
    formatDecimal,
    parseDecimal,
} from './DecimalMath';
import { toRoundingMode } from './FormulaTypes';

const policy = builtInDefaultFormat.CalculationPolicy;
const itemsSection = builtInDefaultFormat.LineItemSections[0];

const requireItemsSection = () => {
    if (!itemsSection) {
        throw new Error('Expected built-in Items section.');
    }

    return itemsSection;
};

describe('FormulaEngine', () => {
    it('adds decimal strings without JavaScript floating-point drift', () => {
        expect(formatDecimal(addDecimal(parseDecimal('0.1'), parseDecimal('0.2')), 2)).toBe('0.30');
    });

    it('rounds HALF_UP to the requested precision', () => {
        expect(formatDecimal(parseDecimal('1.235'), 2)).toBe('1.24');
        expect(formatDecimal(parseDecimal('-1.235'), 2)).toBe('-1.24');
    });

    it('evaluates formulas with precedence and variables', () => {
        expect(
            evaluateFormula(
                'Quantity * Rate + Tax',
                { Quantity: '2.000', Rate: '500.0000', Tax: '180.00' },
                policy,
                2,
            ).formatted,
        ).toBe('1180.00');
    });

    it('evaluates parentheses, unary minus, and division', () => {
        expect(
            evaluateFormula(
                '-((Quantity * Rate) / Divisor)',
                { Quantity: '2.000', Rate: '500.0000', Divisor: '4' },
                policy,
                2,
            ).formatted,
        ).toBe('-250.00');
    });

    it('throws when a variable is missing', () => {
        expect(() => evaluateFormula('Quantity * Rate', { Quantity: '2.000' }, policy, 2)).toThrow(
            /Rate/u,
        );
    });

    it('throws for invalid formulas and decimal inputs', () => {
        expect(() =>
            evaluateFormula('Quantity ^ Rate', { Quantity: '2', Rate: '3' }, policy, 2),
        ).toThrow(/Unsupported/u);
        expect(() =>
            evaluateFormula('(Quantity + Rate', { Quantity: '2', Rate: '3' }, policy, 2),
        ).toThrow(/closing parenthesis/u);
        expect(() =>
            evaluateFormula('Quantity Rate', { Quantity: '2', Rate: '3' }, policy, 2),
        ).toThrow(/trailing/u);
        expect(() => parseDecimal('not-a-decimal')).toThrow(/Invalid decimal/u);
        expect(() => decimalFromInteger(1.5)).toThrow(/integer/u);
    });

    it('throws for division by zero and unsupported rounding modes', () => {
        expect(() => divideDecimal(parseDecimal('1'), parseDecimal('0'), 2, 'HALF_UP')).toThrow(
            /Division by zero/u,
        );
        expect(() => toRoundingMode('BANKERS')).toThrow(/Unsupported rounding mode/u);
    });

    it('calculates line-item fields in calculation order', () => {
        expect(
            calculateLineItemRows(
                requireItemsSection(),
                [
                    {
                        RowId: 'Row_1',
                        DisplayOrder: 1,
                        Values: {
                            ItemName: 'Sample Item',
                            Quantity: '2.000',
                            Rate: '500.0000',
                        },
                    },
                ],
                policy,
            ),
        ).toEqual([
            {
                RowId: 'Row_1',
                DisplayOrder: 1,
                Values: {
                    ItemName: 'Sample Item',
                    Quantity: '2.000',
                    Rate: '500.0000',
                    Amount: '1000.00',
                },
            },
        ]);
    });
});
