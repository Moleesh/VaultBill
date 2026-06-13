/** @format */

import type { CalculationPolicySchema } from '../../db/startup/ConfigSchemas';
import type { DecimalValue, RoundingMode } from './DecimalMath';
import type { z } from 'zod';

export type CalculationPolicy = z.infer<typeof CalculationPolicySchema>;

export type FormulaVariableMap = Readonly<Record<string, string | number>>;

export type FormulaEvaluationContext = {
    readonly sumAll?: (fieldId: string) => string | number;
};

export type FormulaTokenType = 'Identifier' | 'Number' | 'Operator' | 'LeftParen' | 'RightParen';

export type FormulaToken = {
    readonly type: FormulaTokenType;
    readonly value: string;
};

export type FormulaEvaluation = {
    readonly value: DecimalValue;
    readonly formatted: string;
};

export const toRoundingMode = (value: string): RoundingMode => {
    if (value === 'HALF_UP') {
        return value;
    }

    throw new Error(`Unsupported rounding mode: ${value}`);
};
