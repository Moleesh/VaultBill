/** @format */

const formulaStartPattern = /^[=+\-@]/u;

export const escapeSpreadsheetFormula = (value: string): string =>
    formulaStartPattern.test(value) ? `'${value}` : value;
