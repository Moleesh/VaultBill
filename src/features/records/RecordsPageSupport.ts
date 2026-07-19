/** @format */

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import {
    applyDocumentCalculations,
    calculateConfiguredLineItem,
    defaultFieldValue,
    documentFieldValue,
    isNumericField,
    lineItemFieldValue,
    normalizeId,
} from './RecordsPageCalculationsSupport';
import type { AppRecord, EditableRecord, RecordLineItem } from './RecordStoreContext';

export type ConfiguredFieldDefinition = DocumentFormatConfig['Fields'][number];
export type KnownLineFieldRole =
    | 'amount'
    | 'hsnSac'
    | 'itemName'
    | 'quantity'
    | 'rate'
    | 'taxPercent';

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
    'linequantity',
    'rate',
    'linerate',
    'taxpercent',
    'linetaxpercent',
    'amount',
    'lineamount',
]);

/** Resolves configured line fields that are backed by the fixed record row model. */
export const knownLineFieldRole = (
    field: Pick<ConfiguredFieldDefinition, 'FieldId' | 'Label' | 'Type'>,
): KnownLineFieldRole | undefined => {
    const fieldId = normalizeId(field.FieldId);
    const label = normalizeId(field.Label);
    if (fieldId === 'itemname' || label === 'itemname' || label === 'item') return 'itemName';
    if (fieldId === 'hsnsac' || label === 'hsnsac') return 'hsnSac';
    if (
        fieldId === 'quantity' ||
        fieldId === 'linequantity' ||
        label === 'quantity' ||
        label === 'qty'
    )
        return 'quantity';
    if (fieldId === 'rate' || fieldId === 'linerate' || label === 'rate') return 'rate';
    if (fieldId === 'taxpercent' || fieldId === 'linetaxpercent' || label === 'tax')
        return 'taxPercent';
    if (fieldId === 'amount' || fieldId === 'lineamount' || label === 'amount') return 'amount';
    return undefined;
};

/** Identifies configured line fields already represented by the fixed row columns. */
export const isKnownLineFieldDefinition = (field: ConfiguredFieldDefinition): boolean =>
    knownLineFieldRole(field) !== undefined;

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

export {
    applyDocumentCalculations,
    calculateConfiguredLineItem,
    defaultFieldValue,
    documentFieldValue,
    isNumericField,
    lineItemFieldValue,
    normalizeId,
};
