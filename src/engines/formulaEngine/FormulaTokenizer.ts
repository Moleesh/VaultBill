/** @format */

import type { FormulaToken } from './FormulaTypes';

export const tokenizeFormula = (formula: string): readonly FormulaToken[] => {
    const tokens: FormulaToken[] = [];
    let index = 0;

    while (index < formula.length) {
        const character = formula[index];

        if (!character) {
            break;
        }

        if (/\s/u.test(character)) {
            index += 1;
            continue;
        }

        if (/[A-Za-z_]/u.test(character)) {
            const match = /^[A-Za-z_][A-Za-z0-9_]*/u.exec(formula.slice(index));
            const value = match?.[0];

            if (!value) {
                throw new Error(`Invalid identifier at position ${index.toString()}.`);
            }

            tokens.push({ type: 'Identifier', value });
            index += value.length;
            continue;
        }

        if (/\d/u.test(character)) {
            const match = /^\d+(?:\.\d+)?/u.exec(formula.slice(index));
            const value = match?.[0];

            if (!value) {
                throw new Error(`Invalid number at position ${index.toString()}.`);
            }

            tokens.push({ type: 'Number', value });
            index += value.length;
            continue;
        }

        if ('+-*/'.includes(character)) {
            tokens.push({ type: 'Operator', value: character });
            index += 1;
            continue;
        }

        if (character === '(') {
            tokens.push({ type: 'LeftParen', value: character });
            index += 1;
            continue;
        }

        if (character === ')') {
            tokens.push({ type: 'RightParen', value: character });
            index += 1;
            continue;
        }

        throw new Error(`Unsupported formula character: ${character}`);
    }

    return tokens;
};
