/** @format */

import { z } from 'zod';

import { DocumentRecordSchema, type DocumentRecord } from './DocumentRecordSchema';

const recordJsonRowSchema = z.object({ record_json: z.string() });

export const parseDocumentRecordJson = (rawJson: string): DocumentRecord => {
    const parsed: unknown = JSON.parse(rawJson);
    return DocumentRecordSchema.parse(parsed);
};

export const stringifyDocumentRecord = (record: DocumentRecord): string =>
    JSON.stringify(DocumentRecordSchema.parse(record));

export const parseRecordJsonRow = (row: unknown): DocumentRecord =>
    parseDocumentRecordJson(recordJsonRowSchema.parse(row).record_json);
