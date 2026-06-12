/** @format */
import { evaluateFormula } from '../../engines/formulaEngine/FormulaEngine';
import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { AppRecord, EditableRecord, RecordLineItem } from './RecordStoreContext';
export type ConfiguredFieldDefinition = DocumentFormatConfig['Fields'][number];
export const emptyLineItem = (): RecordLineItem => ({
    rowId: crypto.randomUUID(),
    itemName: '',
    hsnSac: '',
    quantity: '1',
    rate: '',
    taxPercent: '18',
    amount: '0.00',
    values: {},
});
export const calculateItemAmount = (item: RecordLineItem): string => {
    const quantity = Number.parseFloat(item.quantity) || 0;
    const rate = Number.parseFloat(item.rate) || 0;
    const tax = Number.parseFloat(item.taxPercent) || 0;
    return (quantity * rate * (1 + tax / 100)).toFixed(2);
};
export const createEmptyRecord = (): EditableRecord => ({
    recordId: crypto.randomUUID(),
    formatId: 'TaxInvoice',
    formatName: 'GST Invoice',
    invoiceDate: new Date().toISOString().slice(0, 10),
    customerName: '',
    gstin: '',
    state: '',
    billingAddress: '',
    lineItems: [emptyLineItem()],
    grandTotal: '0.00',
    fieldValues: {},
});
export const toEditableRecord = (record: AppRecord): EditableRecord => ({
    recordId: record.recordId,
    formatId: record.formatId,
    formatName: record.formatName,
    invoiceDate: record.invoiceDate,
    customerName: record.customerName,
    gstin: record.gstin,
    state: record.state,
    billingAddress: record.billingAddress,
    lineItems: record.lineItems,
    grandTotal: record.grandTotal,
    fieldValues: record.fieldValues ?? {},
});
export const knownDocumentFields = new Set([
    'invoicedate',
    'customername',
    'customergstin',
    'gstin',
    'state',
    'billingaddress',
    'grandtotal',
]);

export const knownLineFields = new Set([
    'itemname',
    'hsnsac',
    'quantity',
    'rate',
    'taxpercent',
    'amount',
]);

export const normalizeId = (value: string): string =>
    value.replaceAll(/[^a-z0-9]/giu, '').toLowerCase();

export const isNumericField = (field: ConfiguredFieldDefinition): boolean =>
    ['Number', 'Decimal', 'Money', 'Quantity', 'Rate'].includes(field.Type);

export const defaultFieldValue = (field: ConfiguredFieldDefinition): string => {
    const value = field.DefaultValue;
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : '';
};

export const calculateConfiguredLineItem = (
    item: RecordLineItem,
    config: DocumentFormatConfig | undefined,
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

export const applyDocumentCalculations = (
    record: EditableRecord,
    config: DocumentFormatConfig | undefined,
): EditableRecord => {
    if (!config) return record;
    let next = record;
    const values: Record<string, string | number> = {
        InvoiceDate: record.invoiceDate,
        CustomerName: record.customerName,
        CustomerGstin: record.gstin,
        Gstin: record.gstin,
        State: record.state,
        BillingAddress: record.billingAddress,
        GrandTotal: record.grandTotal,
        ...(record.fieldValues ?? {}),
    };
    for (const field of config.Fields.filter(
        (candidate) => candidate.Calculated && candidate.Formula,
    ).sort((left, right) => (left.CalculationOrder ?? 0) - (right.CalculationOrder ?? 0))) {
        const formula = field.Formula ?? '';
        let value: string;
        const sumMatch = /^SUM\(Items\.([^)]+)\)$/iu.exec(formula);
        if (sumMatch?.[1]) {
            value = record.lineItems
                .reduce(
                    (total, item) =>
                        total +
                        (Number.parseFloat(lineItemFieldValue(item, sumMatch[1] ?? '')) || 0),
                    0,
                )
                .toFixed(field.Precision ?? config.CalculationPolicy.MoneyPrecision);
        } else if (/^COUNT\(Items\)$/iu.test(formula)) {
            value = String(record.lineItems.length);
        } else {
            try {
                value = evaluateFormula(
                    formula,
                    values,
                    config.CalculationPolicy,
                    field.Precision ?? config.CalculationPolicy.MoneyPrecision,
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

export const firstMissingRequiredField = (
    record: EditableRecord,
    config: DocumentFormatConfig,
): string | undefined =>
    config.Fields.find(
        (field) =>
            field.Required &&
            !field.Calculated &&
            !documentFieldValue(record, field.FieldId).trim(),
    )?.Label;

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
