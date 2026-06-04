import type { LineItemSectionConfigSchema } from '../../db/startup/ConfigSchemas';
import type { LineItemRow } from '../schemaEngine/LineItemTypes';
import type { FieldConfig } from '../schemaEngine/SchemaEngineTypes';
import { formatDecimal } from './DecimalMath';
import { evaluateFormulaToDecimal } from './FormulaParser';
import type {
  CalculationPolicy,
  FormulaEvaluation,
  FormulaVariableMap,
} from './FormulaTypes';
import { toRoundingMode } from './FormulaTypes';
import type { z } from 'zod';

export type LineItemSectionConfig = z.infer<typeof LineItemSectionConfigSchema>;

export const evaluateFormula = (
  formula: string,
  variables: FormulaVariableMap,
  policy: CalculationPolicy,
  precision: number,
): FormulaEvaluation => {
  const value = evaluateFormulaToDecimal(formula, variables, policy);

  return {
    value,
    formatted: formatDecimal(value, precision, toRoundingMode(policy.RoundingMode)),
  };
};

export const calculateLineItemRows = (
  section: LineItemSectionConfig,
  rows: readonly LineItemRow[],
  policy: CalculationPolicy,
): readonly LineItemRow[] =>
  rows.map((row) => calculateLineItemRow(section, row, policy));

const calculateLineItemRow = (
  section: LineItemSectionConfig,
  row: LineItemRow,
  policy: CalculationPolicy,
): LineItemRow => {
  const calculatedFields = section.Fields.filter(
    (field) => field.Calculated && field.Formula,
  ).sort((left, right) => (left.CalculationOrder ?? 0) - (right.CalculationOrder ?? 0));
  const nextValues: Record<string, unknown> = { ...row.Values };

  for (const field of calculatedFields) {
    const formula = field.Formula;

    if (!formula) {
      continue;
    }

    nextValues[field.FieldId] = evaluateFormula(
      formula,
      toFormulaVariables(nextValues),
      policy,
      getFieldPrecision(field, policy),
    ).formatted;
  }

  return {
    ...row,
    Values: nextValues,
  };
};

const toFormulaVariables = (
  values: Readonly<Record<string, unknown>>,
): FormulaVariableMap => {
  const variables: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(values)) {
    if (
      typeof value === 'string' ||
      (typeof value === 'number' && Number.isInteger(value))
    ) {
      variables[key] = value;
    }
  }

  return variables;
};

const getFieldPrecision = (field: FieldConfig, policy: CalculationPolicy): number => {
  if (field.Precision !== undefined) {
    return field.Precision;
  }

  if (field.Type === 'Quantity') {
    return policy.QuantityPrecision;
  }

  if (field.Type === 'Rate') {
    return policy.RatePrecision;
  }

  return policy.MoneyPrecision;
};
