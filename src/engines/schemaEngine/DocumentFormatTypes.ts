import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';

export type StoredDocumentFormat = {
  readonly formatId: string;
  readonly formatName: string;
  readonly formatJson: string;
  readonly isDefault: boolean;
};

export type DocumentFormatRecord = {
  readonly formatId: string;
  readonly formatName: string;
  readonly config: DocumentFormatConfig;
  readonly isDefault: boolean;
};

export type DocumentFormatSelection = {
  readonly formatId?: string;
  readonly formatName?: string;
};

export type DocumentFormatFallbackKind = 'None' | 'FormatName' | 'Default';

export type DocumentFormatResolution = {
  readonly format: DocumentFormatRecord;
  readonly fallbackKind: DocumentFormatFallbackKind;
  readonly warning?: string;
};

export type DeleteFormatDecision = {
  readonly canDelete: boolean;
  readonly reason: string;
};
