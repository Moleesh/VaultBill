/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { evaluateFormula } from '../../engines/formulaEngine/FormulaEngine';
import type { ConfiguredFieldDefinition } from './RecordsPageSupport';
import type { EditableRecord, RecordLineItem } from './RecordStoreContext';
import { calculateRecordTotals } from './RecordTotals';

/** Normalizes field identifiers for stable field lookup. */
export const normalizeId = (value: string): string =>
    value.replaceAll(/[^a-z0-9]/giu, '').toLowerCase();

/** Determines whether a configured field behaves like a numeric entry. */
export const isNumericField = (field: ConfiguredFieldDefinition): boolean =>
    ['Number', 'Decimal', 'Money', 'Quantity', 'Rate'].includes(field.Type);

/** Converts a configured field's default value into a displayable string. */
export const defaultFieldValue = (field: ConfiguredFieldDefinition): string => {
    const value = field.DefaultValue;
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : '';
};

/** Calculates a line item using the configured field formulas. */
export const calculateConfiguredLineItem = (
    item: RecordLineItem,
    config: DocumentFormatConfig | undefined,
    secretValues: Readonly<Record<string, string>> = {},
): RecordLineItem => {
    const section = config?.LineItemSections[0];
    if (!section) return item;
    let next = item;
    const values: Record<string, string | number> = {
        ItemName: item.itemName,
        HsnSac: item.hsnSac,
        Quantity: item.quantity,
        Rate: item.rate,
        TaxPercent: item.taxPercent,
        Amount: item.amount,
        ...(item.values ?? {}),
        ...secretValues,
    };
    for (const field of section.Fields.filter(
        (candidate) => candidate.Calculated && candidate.Formula,
    ).sort((left, right) => (left.CalculationOrder ?? 0) - (right.CalculationOrder ?? 0))) {
        try {
            const value = evaluateFormula(
                field.Formula ?? '',
                values,
                config.CalculationPolicy,
                field.Precision ?? config.CalculationPolicy.MoneyPrecision,
            ).formatted;
            values[field.FieldId] = value;
            const normalized = normalizeId(field.FieldId);
            if (normalized === 'amount') next = { ...next, amount: value };
            else next = { ...next, values: { ...(next.values ?? {}), [field.FieldId]: value } };
        } catch {
            // Builder validation reports invalid formulas; entry keeps the last valid value.
        }
    }
    return next;
};

/** Applies configured document calculations to a saved or editable record. */
export const applyDocumentCalculations = (
    record: EditableRecord,
    config: DocumentFormatConfig | undefined,
    secretValues: Readonly<Record<string, string>> = {},
): EditableRecord => {
    if (!config) return record;
    let next = record;
    const totals = calculateRecordTotals(record);
    const values: Record<string, string | number> = {
        InvoiceDate: record.invoiceDate,
        CustomerName: record.customerName,
        CustomerGstin: record.gstin,
        Gstin: record.gstin,
        State: record.state,
        BillingAddress: record.billingAddress,
        GrandTotal: record.grandTotal,
        Subtotal: totals.subtotal,
        TaxTotal: totals.taxTotal,
        RoundOff: totals.roundOff,
        ...(record.fieldValues ?? {}),
        ...secretValues,
    };
    for (const field of config.Fields.filter(
        (candidate) => candidate.Calculated && candidate.Formula,
    ).sort((left, right) => (left.CalculationOrder ?? 0) - (right.CalculationOrder ?? 0))) {
        const formula = field.Formula ?? '';
        let value: string;
        const sumMatch = /^SUM\(Items\.([^)]+)\)$/iu.exec(formula);
        if (sumMatch?.[1]) {
            value = sumLineItemField(record.lineItems, sumMatch[1], field);
        } else if (/^COUNT\(Items\)$/iu.test(formula)) {
            value = String(record.lineItems.length);
        } else {
            try {
                value = evaluateFormula(
                    formula,
                    values,
                    config.CalculationPolicy,
                    field.Precision ?? config.CalculationPolicy.MoneyPrecision,
                    {
                        sumAll: (fieldId) => sumLineItemField(record.lineItems, fieldId, field),
                    },
                ).formatted;
            } catch {
                continue;
            }
        }
        values[field.FieldId] = value;
        if (normalizeId(field.FieldId) === 'grandtotal') next = { ...next, grandTotal: value };
        else
            next = {
                ...next,
                fieldValues: { ...(next.fieldValues ?? {}), [field.FieldId]: value },
            };
    }
    return next;
};

/** Sums a line-item field using the active document precision. */
const sumLineItemField = (
    lineItems: readonly RecordLineItem[],
    fieldId: string,
    field: ConfiguredFieldDefinition,
): string =>
    lineItems
        .reduce(
            (total, item) => total + (Number.parseFloat(lineItemFieldValue(item, fieldId)) || 0),
            0,
        )
        .toFixed(field.Precision);

/** Resolves a line-item field value from built-in or custom field values. */
export const lineItemFieldValue = (item: RecordLineItem, fieldId: string): string => {
    const values: Readonly<Record<string, string>> = {
        itemname: item.itemName,
        hsnsac: item.hsnSac,
        quantity: item.quantity,
        rate: item.rate,
        taxpercent: item.taxPercent,
        amount: item.amount,
    };
    return values[normalizeId(fieldId)] ?? item.values?.[fieldId] ?? '';
};

/** Resolves a document field value from built-in or custom field values. */
export const documentFieldValue = (record: EditableRecord, fieldId: string): string => {
    const values: Readonly<Record<string, string>> = {
        invoicedate: record.invoiceDate,
        customername: record.customerName,
        customergstin: record.gstin,
        gstin: record.gstin,
        state: record.state,
        billingaddress: record.billingAddress,
        grandtotal: record.grandTotal,
    };
    return values[normalizeId(fieldId)] ?? record.fieldValues?.[fieldId] ?? '';
};
