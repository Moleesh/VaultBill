/** @format */

import { z } from 'zod';

const LineItemSchema = z.object({
    rowId: z.string().min(1),
    itemName: z.string(),
    hsnSac: z.string(),
    quantity: z.string(),
    rate: z.string(),
    taxPercent: z.string(),
    amount: z.string(),
    values: z.record(z.string()).optional(),
});

const EditableRecordSchema = z.object({
    recordId: z.string().min(1),
    formatId: z.string().min(1),
    formatName: z.string().min(1),
    invoiceDate: z.string(),
    customerName: z.string(),
    gstin: z.string(),
    state: z.string(),
    billingAddress: z.string(),
    lineItems: z.array(LineItemSchema),
    grandTotal: z.string(),
    fieldValues: z.record(z.string()).optional(),
});

const OperatorSchema = z.object({
    account: z.object({
        userId: z.string().min(1),
        username: z.string(),
        displayName: z.string().min(1),
        role: z.enum(['SysAdmin', 'Admin', 'User']),
        isActive: z.boolean(),
    }),
    role: z.enum(['SysAdmin', 'Admin', 'User']),
    CreatedBy: z.string().min(1),
    CreatedByName: z.string().min(1),
    LastActionBy: z.string().min(1),
    LastActionByName: z.string().min(1),
});

export const RecordWriteRequestSchema = z.object({
    record: EditableRecordSchema,
    operatorContext: OperatorSchema,
});

export const RecordCancelRequestSchema = z.object({
    recordId: z.string().min(1),
    reason: z.string().trim().min(1),
    operatorContext: OperatorSchema,
});

const ReportFieldFilterSchema = z.object({
    id: z.string().min(1),
    field: z.string().min(1),
    value: z.string(),
});

export const StoredRecordSchema = EditableRecordSchema.extend({
    documentNumber: z.string().nullable(),
    status: z.enum(['Draft', 'Finalized', 'Cancelled']),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    createdBy: z.string().min(1),
    createdByName: z.string().min(1),
    cancellationReason: z.string().optional(),
});

const ReportQuerySchema = z.object({
    reportId: z.string().min(1),
    formatId: z.string().min(1).optional(),
    customer: z.string().default(''),
    invoiceNumber: z.string().default(''),
    reportFilters: z.array(ReportFieldFilterSchema).default([]),
    sorts: z.array(z.string()).default([]),
    fromDate: z.string().default(''),
    toDate: z.string().default(''),
    status: z.enum(['All', 'Draft', 'Finalized', 'Cancelled']).default('All'),
    preset: z.enum(['All', 'Today', 'ThisMonth', 'FinancialYear', 'Last100']).default('All'),
    includeDraftsInReports: z.boolean().default(false),
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(50),
});

export type StoredRecord = z.infer<typeof StoredRecordSchema>;
export type RecordWriteRequest = z.infer<typeof RecordWriteRequestSchema>;
export type RecordCancelRequest = z.infer<typeof RecordCancelRequestSchema>;
export type ReportFieldFilter = z.infer<typeof ReportFieldFilterSchema>;
export type TrialStatus = {
    readonly isFullVersion: boolean;
    readonly isExpired: boolean;
    readonly accumulatedSeconds: number;
    readonly remainingSeconds: number;
};
export type ReportQuery = z.input<typeof ReportQuerySchema>;
export type ReportQueryResult = {
    readonly rows: readonly StoredRecord[];
    readonly total: number;
    readonly nextCursor?: string;
};

export const parseReportQuery = (rawQuery: unknown) => ReportQuerySchema.parse(rawQuery);
export const parseStoredRecord = (rawRecord: unknown) => StoredRecordSchema.parse(rawRecord);
