import { useEffect, useState } from 'react';
import { z } from 'zod';

import { useCapabilities } from '../../capability/CapabilityContext';

const loadWebAdapter = () => import('../../db/adapters/supabaseAdapter');

const WebRecordSchema = z.object({
  recordId: z.string().min(1),
  formatId: z.string().min(1),
  formatName: z.string().min(1),
  status: z.enum(['Draft', 'Finalized', 'Cancelled']),
  customerName: z.string(),
  updatedAt: z.string().min(1),
});

export type WebRecord = z.infer<typeof WebRecordSchema>;

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

export const useWebRecordStore = (): WebRecordStore => {
  const capabilities = useCapabilities();
  const isWebStorageAvailable =
    capabilities.isWebOnly &&
    Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  const [records, setRecords] = useState<readonly WebRecord[]>([]);
  const [isLoading, setIsLoading] = useState(isWebStorageAvailable);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isWebStorageAvailable) {
      return undefined;
    }

    let isCurrent = true;
    void loadWebAdapter()
      .then(({ listWebDocuments }) => listWebDocuments('record'))
      .then((rows) => {
        if (!isCurrent) return;

        const storedRecords = rows.flatMap((row) => {
          const result = WebRecordSchema.safeParse(row.payload);
          return result.success ? [result.data] : [];
        });
        setRecords(sortLatestFirst(storedRecords));
      })
      .catch((reason: unknown) => {
        if (isCurrent) {
          setError(reason instanceof Error ? reason.message : 'Web records could not be loaded.');
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isWebStorageAvailable]);

  const saveRecord = async (record: WebRecord): Promise<boolean> => {
    if (!isWebStorageAvailable) {
      return false;
    }

    setError('');
    setIsSaving(true);

    try {
      const { saveWebDocument } = await loadWebAdapter();
      await saveWebDocument('record', record.recordId, record);
      setRecords((currentRecords) =>
        sortLatestFirst([
          record,
          ...currentRecords.filter((current) => current.recordId !== record.recordId),
        ]),
      );
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The web record could not be saved.');
      return false;
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
