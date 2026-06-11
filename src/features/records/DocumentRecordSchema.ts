/** @format */

import { z } from 'zod';

export const DocumentRecordStatusSchema = z.enum(['Draft', 'Finalized', 'Cancelled']);

export const LineItemRowSchema = z.object({
    RowId: z.string().min(1),
    DisplayOrder: z.number().int().positive(),
    Values: z.record(z.string(), z.unknown()),
});

export const AttachmentMetadataSchema = z.object({
    AttachmentId: z.string().min(1),
    FieldId: z.string().min(1),
    FileName: z.string().min(1),
    MimeType: z.string().min(1),
    SizeBytes: z.number().int().nonnegative(),
});

export const DocumentRecordSchema = z.object({
    RecordId: z.string().min(1),
    FormatId: z.string().min(1),
    FormatName: z.string().min(1),
    DocumentNumber: z.string().nullable(),
    Status: DocumentRecordStatusSchema,
    Values: z.record(z.string(), z.unknown()),
    LineItemSections: z.record(z.string(), z.array(LineItemRowSchema)),
    Attachments: z.array(AttachmentMetadataSchema),
    CreatedAt: z.string().min(1),
    CreatedBy: z.string().min(1),
    CreatedByName: z.string().min(1),
    LastActionAt: z.string().nullable(),
    LastActionBy: z.string().nullable(),
    LastActionByName: z.string().nullable(),
});

export type DocumentRecordStatus = z.infer<typeof DocumentRecordStatusSchema>;
export type DocumentRecord = z.infer<typeof DocumentRecordSchema>;
