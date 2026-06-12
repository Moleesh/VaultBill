/** @format */

import { z } from 'zod';

import type { OperatorContext } from '../auth/AccountTypes';

/**
 * Validates record payloads, editable form state, and the store context value
 * shared by the records workspace.
 */

/** Validates a single line item in a record. */
export const RecordLineItemSchema = z.object({
    rowId: z.string().min(1),
    itemName: z.string(),
    hsnSac: z.string(),
    quantity: z.string(),
    rate: z.string(),
    taxPercent: z.string(),
    amount: z.string(),
    values: z.record(z.string()).optional(),
});

/** Validates the persisted and editable record shape. */
export const AppRecordSchema = z.object({
    recordId: z.string().min(1),
    formatId: z.string().min(1),
    formatName: z.string().min(1),
    documentNumber: z.string().nullable(),
    status: z.enum(['Draft', 'Finalized', 'Cancelled']),
    invoiceDate: z.string(),
    customerName: z.string(),
    gstin: z.string(),
    state: z.string(),
    billingAddress: z.string(),
    lineItems: z.array(RecordLineItemSchema),
    grandTotal: z.string(),
    fieldValues: z.record(z.string()).optional(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    createdBy: z.string().min(1),
    createdByName: z.string().min(1),
    cancellationReason: z.string().optional(),
});

/** Validated record data stored across the app. */
export type AppRecord = z.infer<typeof AppRecordSchema>;
/** Validated line-item data stored inside each record. */
export type RecordLineItem = z.infer<typeof RecordLineItemSchema>;
/** Editable record shape used by the records page form. */
export type EditableRecord = Pick<
    AppRecord,
    | 'recordId'
    | 'formatId'
    | 'formatName'
    | 'invoiceDate'
    | 'customerName'
    | 'gstin'
    | 'state'
    | 'billingAddress'
    | 'lineItems'
    | 'grandTotal'
    | 'fieldValues'
>;

/** Context value exposed by the record store provider. */
export type RecordStoreContextValue = {
    readonly records: readonly AppRecord[];
    readonly isLoading: boolean;
    readonly error: string;
    readonly saveDraft: (
        record: EditableRecord,
        operatorContext: OperatorContext,
    ) => Promise<AppRecord>;
    readonly finalizeRecord: (
        record: EditableRecord,
        operatorContext: OperatorContext,
    ) => Promise<AppRecord>;
    readonly cancelRecord: (
        recordId: string,
        reason: string,
        operatorContext: OperatorContext,
    ) => Promise<AppRecord>;
    readonly resetDemoData: () => void;
};
