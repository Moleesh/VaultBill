/** @format */

import {
    addDecimal,
    decimalFromInteger,
    divideDecimal,
    multiplyDecimal,
    parseDecimal,
    roundDecimal,
    subtractDecimal,
    type DecimalValue,
} from './DecimalMath';
import { tokenizeFormula } from './FormulaTokenizer';
import type { FormulaToken, FormulaVariableMap } from './FormulaTypes';
import { toRoundingMode, type CalculationPolicy } from './FormulaTypes';

type FormulaCursor = {
    readonly tokens: readonly FormulaToken[];
    readonly variables: FormulaVariableMap;
    readonly policy: CalculationPolicy;
    index: number;
};

export const evaluateFormulaToDecimal = (
    formula: string,
    variables: FormulaVariableMap,
    policy: CalculationPolicy,
): DecimalValue => {
    const cursor: FormulaCursor = {
        tokens: tokenizeFormula(formula),
        variables,
        policy,
        index: 0,
    };
    const value = parseExpression(cursor);

    if (cursor.index !== cursor.tokens.length) {
        throw new Error('Formula contains unexpected trailing tokens.');
    }

    return value;
};

const parseExpression = (cursor: FormulaCursor): DecimalValue => {
    let value = parseTerm(cursor);

    while (peekOperator(cursor, '+') || peekOperator(cursor, '-')) {
        const operator = consume(cursor).value;
        const right = parseTerm(cursor);
        value = operator === '+' ? addDecimal(value, right) : subtractDecimal(value, right);
    }

    return value;
};

const parseTerm = (cursor: FormulaCursor): DecimalValue => {
    let value = parseFactor(cursor);

    while (peekOperator(cursor, '*') || peekOperator(cursor, '/')) {
        const operator = consume(cursor).value;
        const right = parseFactor(cursor);
        value =
            operator === '*'
                ? multiplyDecimal(value, right)
                : divideDecimal(
                      value,
                      right,
                      cursor.policy.MoneyPrecision + 4,
                      toRoundingMode(cursor.policy.RoundingMode),
                  );
    }

    return value;
};

const parseFactor = (cursor: FormulaCursor): DecimalValue => {
    const token = consume(cursor);

    if (token.type === 'Operator' && token.value === '-') {
        const value = parseFactor(cursor);
        return { mantissa: -value.mantissa, scale: value.scale };
    }

    if (token.type === 'Number') {
        return parseDecimal(token.value);
    }

    if (token.type === 'Identifier') {
        if (cursor.tokens[cursor.index]?.type === 'LeftParen') {
            return parseFunctionCall(cursor, token.value);
        }

        return resolveVariable(cursor.variables, token.value);
    }

    if (token.type === 'LeftParen') {
        const value = parseExpression(cursor);

        if (cursor.tokens[cursor.index]?.type !== 'RightParen') {
            throw new Error('Formula is missing a closing parenthesis.');
        }

        const closing = consume(cursor);

        if (closing.type !== 'RightParen') {
            throw new Error('Formula is missing a closing parenthesis.');
        }

        return value;
    }

    throw new Error(`Unexpected formula token: ${token.value}`);
};

const parseFunctionCall = (cursor: FormulaCursor, functionName: string): DecimalValue => {
    if (functionName.toUpperCase() !== 'ROUND') {
        throw new Error(`Unsupported formula function: ${functionName}`);
    }

    consumeExpected(cursor, 'LeftParen', 'Formula function is missing an opening parenthesis.');
    const value = parseExpression(cursor);
    const precision = consumeIf(cursor, 'Comma') ? decimalToInteger(parseExpression(cursor)) : 0;
    consumeExpected(cursor, 'RightParen', 'Formula function is missing a closing parenthesis.');

    if (precision < 0) {
        throw new Error('ROUND precision must be zero or greater.');
    }

    return roundDecimal(value, precision, toRoundingMode(cursor.policy.RoundingMode));
};

const decimalToInteger = (value: DecimalValue): number => {
    if (value.scale !== 0) {
        throw new Error('ROUND precision must be an integer.');
    }

    const precision = Number(value.mantissa);
    if (!Number.isSafeInteger(precision)) {
        throw new Error('ROUND precision is too large.');
    }

    return precision;
};

const resolveVariable = (variables: FormulaVariableMap, identifier: string): DecimalValue => {
    const value = variables[identifier];

    if (value === undefined) {
        throw new Error(`Formula variable ${identifier} is missing.`);
    }

    return typeof value === 'number' ? decimalFromInteger(value) : parseDecimal(value);
};

const peekOperator = (cursor: FormulaCursor, operator: string): boolean => {
    const token = cursor.tokens[cursor.index];
    return token?.type === 'Operator' && token.value === operator;
};

const consume = (cursor: FormulaCursor): FormulaToken => {
    const token = cursor.tokens[cursor.index];

    if (!token) {
        throw new Error('Formula ended unexpectedly.');
    }

    cursor.index += 1;
    return token;
};

const consumeIf = (cursor: FormulaCursor, type: FormulaToken['type']): boolean => {
    if (cursor.tokens[cursor.index]?.type !== type) {
        return false;
    }

    cursor.index += 1;
    return true;
};

const consumeExpected = (
    cursor: FormulaCursor,
    type: FormulaToken['type'],
    message: string,
): FormulaToken => {
    const token = consume(cursor);
    if (token.type !== type) {
        throw new Error(message);
    }

    return token;
};
