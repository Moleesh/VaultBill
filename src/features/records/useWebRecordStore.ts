import { useEffect, useState } from 'react';
import { z } from 'zod';

import { useCapabilities } from '../../capability/CapabilityContext';

const WebRecordSchema = z.object({
  recordId: z.string().min(1),
  formatId: z.string().min(1),
  formatName: z.string().min(1),
  status: z.enum(['Draft', 'Finalized', 'Cancelled']),
  customerName: z.string(),
  updatedAt: z.string().min(1),
});

export type WebRecord = z.infer<typeof WebRecordSchema>;

const webRecordStorageKey = 'vaultbill.demo.records';

type WebRecordStore = {
  readonly error: string;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly isWebStorageAvailable: boolean;
  readonly records: readonly WebRecord[];
  readonly saveRecord: (record: WebRecord) => Promise<boolean>;
};

const sortLatestFirst = (records: readonly WebRecord[]): readonly WebRecord[] =>
  [...records].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

const readStoredRecords = (): readonly WebRecord[] => {
  const rawRecords = window.localStorage.getItem(webRecordStorageKey);

  if (!rawRecords) {
    return [];
  }

  try {
    const parsedRecords = JSON.parse(rawRecords) as unknown;
    const result = z.array(WebRecordSchema).safeParse(parsedRecords);

    return result.success ? sortLatestFirst(result.data) : [];
  } catch {
    return [];
  }
};

const persistStoredRecords = (records: readonly WebRecord[]) => {
  window.localStorage.setItem(webRecordStorageKey, JSON.stringify(records));
};

export const useWebRecordStore = (): WebRecordStore => {
  const capabilities = useCapabilities();
  const isWebStorageAvailable = capabilities.isDemoMode;
  const [records, setRecords] = useState<readonly WebRecord[]>([]);
  const [isLoading, setIsLoading] = useState(isWebStorageAvailable);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isWebStorageAvailable) {
      return undefined;
    }

    try {
      setRecords(readStoredRecords());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Demo records could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [isWebStorageAvailable]);

  const saveRecord = (record: WebRecord): Promise<boolean> => {
    if (!isWebStorageAvailable) {
      return Promise.resolve(false);
    }

    setError('');
    setIsSaving(true);

    try {
      setRecords((currentRecords) => {
        const nextRecords = sortLatestFirst([
          record,
          ...currentRecords.filter((current) => current.recordId !== record.recordId),
        ]);
        persistStoredRecords(nextRecords);
        return nextRecords;
      });
      return Promise.resolve(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The demo record could not be saved.');
      return Promise.resolve(false);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    error,
    isLoading,
    isSaving,
    isWebStorageAvailable,
    records,
    saveRecord,
  };
};
