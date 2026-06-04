import type { DocumentFormatRecord } from '../../engines/schemaEngine/DocumentFormatTypes';
import type { OperatorContext } from '../auth/AccountTypes';
import type { DocumentRecord } from './DocumentRecordSchema';

export type RecordIdFactory = () => string;

export type DraftRecordInput = {
  readonly recordId?: string;
  readonly format: DocumentFormatRecord;
  readonly values: Readonly<Record<string, unknown>>;
  readonly lineItemSections: DocumentRecord['LineItemSections'];
  readonly operatorContext: OperatorContext;
  readonly nowIso: string;
  readonly recordIdFactory: RecordIdFactory;
};

export type FinalizeRecordInput = {
  readonly recordId: string;
  readonly operatorContext: OperatorContext;
  readonly nowIso: string;
};

export type CancelRecordInput = {
  readonly recordId: string;
  readonly reason: string;
  readonly operatorContext: OperatorContext;
  readonly nowIso: string;
};

export type RecordRow = {
  readonly record_id: string;
  readonly format_id: string;
  readonly format_name: string;
  readonly document_number: string | null;
  readonly status: string;
  readonly record_json: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly created_by: string;
  readonly created_by_name: string;
};
