/* eslint-disable max-lines */
import { createContext, useContext, useEffect, useEffectEvent, useState } from 'react';
import { z } from 'zod';
import type { FC, PropsWithChildren } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import type { OperatorContext } from '../auth/AccountTypes';
import { useSession } from '../auth/SessionContext';

const RecordLineItemSchema = z.object({
  rowId: z.string().min(1),
  itemName: z.string(),
  hsnSac: z.string(),
  quantity: z.string(),
  rate: z.string(),
  taxPercent: z.string(),
  amount: z.string(),
});

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
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  createdBy: z.string().min(1),
  createdByName: z.string().min(1),
  cancellationReason: z.string().optional(),
});

export type AppRecord = z.infer<typeof AppRecordSchema>;
export type RecordLineItem = z.infer<typeof RecordLineItemSchema>;
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
>;

type RecordStoreContextValue = {
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

const browserStorageKey = 'vaultbill.records.v23';
const sequenceStorageKey = 'vaultbill.sequence.v23';
const recordStoreEventName = 'vaultbill-record-store-change';
const RecordStoreContext = createContext<RecordStoreContextValue | undefined>(undefined);
const requestedLocalApiBaseUrl = import.meta.env.VITE_LOCAL_API_URL?.trim();
const localApiBaseUrl =
  requestedLocalApiBaseUrl === undefined || requestedLocalApiBaseUrl.length === 0
    ? window.location.origin
    : requestedLocalApiBaseUrl;

const demoSeedRecords: readonly AppRecord[] = [
  {
    recordId: 'demo-finalized-1',
    formatId: 'TaxInvoice',
    formatName: 'GST Invoice',
    documentNumber: 'GST-000001',
    status: 'Finalized',
    invoiceDate: '2026-06-01',
    customerName: 'Aster Works',
    gstin: '29ABCDE1234F1Z5',
    state: 'Karnataka',
    billingAddress: '12 Market Road, Bengaluru',
    lineItems: [
      {
        rowId: 'demo-row-1',
        itemName: 'Consulting services',
        hsnSac: '9983',
        quantity: '1',
        rate: '12500.00',
        taxPercent: '18',
        amount: '14750.00',
      },
    ],
    grandTotal: '14750.00',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
    createdBy: 'demo_user',
    createdByName: 'Demo User',
  },
];

const sortLatestFirst = (records: readonly AppRecord[]): readonly AppRecord[] =>
  [...records].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

const readBrowserRecords = (seedDemo: boolean): readonly AppRecord[] => {
  const rawRecords = window.localStorage.getItem(browserStorageKey);

  if (!rawRecords) {
    const initialRecords = seedDemo ? demoSeedRecords : [];
    window.localStorage.setItem(browserStorageKey, JSON.stringify(initialRecords));
    return initialRecords;
  }

  const parsed = z.array(AppRecordSchema).safeParse(JSON.parse(rawRecords) as unknown);
  return parsed.success ? sortLatestFirst(parsed.data) : [];
};

const writeBrowserRecords = (records: readonly AppRecord[]) => {
  window.localStorage.setItem(browserStorageKey, JSON.stringify(records));
  window.dispatchEvent(new Event(recordStoreEventName));
};

const nextDocumentNumber = (): string => {
  const current = Number.parseInt(window.localStorage.getItem(sequenceStorageKey) ?? '1', 10);
  const next = Number.isFinite(current) && current > 0 ? current : 1;
  window.localStorage.setItem(sequenceStorageKey, String(next + 1));
  return `GST-${String(next).padStart(6, '0')}`;
};

const buildStoredRecord = (
  input: EditableRecord,
  operatorContext: OperatorContext,
  existing: AppRecord | undefined,
  status: AppRecord['status'],
): AppRecord => {
  const now = new Date().toISOString();

  return AppRecordSchema.parse({
    ...input,
    documentNumber:
      status === 'Finalized' ? (existing?.documentNumber ?? nextDocumentNumber()) : null,
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: existing?.createdBy ?? operatorContext.CreatedBy,
    createdByName: existing?.createdByName ?? operatorContext.CreatedByName,
  });
};

export const RecordStoreProvider: FC<PropsWithChildren> = ({ children }) => {
  const capabilities = useCapabilities();
  const { operatorContext: sessionOperator } = useSession();
  const [records, setRecords] = useState<readonly AppRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecords = useEffectEvent(() => {
    const desktopBridge = window.vaultBillDesktop;
    if (desktopBridge && !capabilities.isDemoMode) {
      void desktopBridge
        .listRecords()
        .then((storedRecords) => {
          setRecords(sortLatestFirst(z.array(AppRecordSchema).parse(storedRecords)));
          setError('');
        })
        .catch((reason: unknown) => {
          setError(reason instanceof Error ? reason.message : 'Records could not be loaded.');
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }
    if (capabilities.isLanBrowser) {
      if (!sessionOperator) {
        setRecords([]);
        setIsLoading(false);
        return;
      }
      void requestLocalApi('/records', 'GET', sessionOperator)
        .then((storedRecords) => {
          setRecords(sortLatestFirst(z.array(AppRecordSchema).parse(storedRecords)));
          setError('');
        })
        .catch((reason: unknown) => {
          setError(reason instanceof Error ? reason.message : 'Records could not be loaded.');
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    try {
      setRecords(readBrowserRecords(capabilities.isDemoMode));
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Records could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    loadRecords();
    window.addEventListener(recordStoreEventName, loadRecords);
    return () => {
      window.removeEventListener(recordStoreEventName, loadRecords);
    };
    // useEffectEvent is intentionally omitted so storage events do not resubscribe each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capabilities.isDemoMode, capabilities.isLanBrowser, sessionOperator]);

  const saveDraft = async (
    input: EditableRecord,
    operatorContext: OperatorContext,
  ): Promise<AppRecord> => {
    const existing = records.find((record) => record.recordId === input.recordId);

    if (existing && existing.status !== 'Draft') {
      throw new Error('Finalized and cancelled records are read-only.');
    }

    const desktopBridge = window.vaultBillDesktop;
    const record = AppRecordSchema.parse(
      desktopBridge
        ? await desktopBridge.saveDraft({ record: input, operatorContext })
        : capabilities.isLanBrowser
          ? await requestLocalApi('/records/draft', 'POST', operatorContext, {
              record: input,
              operatorContext,
            })
          : buildStoredRecord(input, operatorContext, existing, 'Draft'),
    );
    const nextRecords = sortLatestFirst([
      record,
      ...records.filter((current) => current.recordId !== record.recordId),
    ]);
    if (!desktopBridge && !capabilities.isLanBrowser) writeBrowserRecords(nextRecords);
    setRecords(nextRecords);
    return record;
  };

  const finalizeRecord = async (
    input: EditableRecord,
    operatorContext: OperatorContext,
  ): Promise<AppRecord> => {
    const existing = records.find((record) => record.recordId === input.recordId);

    if (existing?.status !== 'Draft') {
      throw new Error('Save the current document as a Draft before finalizing it.');
    }

    const desktopBridge = window.vaultBillDesktop;
    const record = AppRecordSchema.parse(
      desktopBridge
        ? await desktopBridge.finalizeRecord({ record: input, operatorContext })
        : capabilities.isLanBrowser
          ? await requestLocalApi('/records/finalize', 'POST', operatorContext, {
              record: input,
              operatorContext,
            })
          : buildStoredRecord(input, operatorContext, existing, 'Finalized'),
    );
    const nextRecords = sortLatestFirst([
      record,
      ...records.filter((current) => current.recordId !== record.recordId),
    ]);
    if (!desktopBridge && !capabilities.isLanBrowser) writeBrowserRecords(nextRecords);
    setRecords(nextRecords);
    return record;
  };

  const cancelRecord = async (
    recordId: string,
    reason: string,
    operatorContext: OperatorContext,
  ): Promise<AppRecord> => {
    const existing = records.find((record) => record.recordId === recordId);

    if (existing?.status !== 'Finalized') {
      throw new Error('Only finalized records can be cancelled.');
    }

    if (operatorContext.role === 'User') {
      throw new Error('Only Admin or SysAdmin can cancel finalized records.');
    }

    const desktopBridge = window.vaultBillDesktop;
    const record = AppRecordSchema.parse(
      desktopBridge
        ? await desktopBridge.cancelRecord({ recordId, reason, operatorContext })
        : capabilities.isLanBrowser
          ? await requestLocalApi('/records/cancel', 'POST', operatorContext, {
              recordId,
              reason,
              operatorContext,
            })
          : {
              ...existing,
              status: 'Cancelled',
              updatedAt: new Date().toISOString(),
              cancellationReason: reason.trim(),
            },
    );
    const nextRecords = sortLatestFirst([
      record,
      ...records.filter((current) => current.recordId !== record.recordId),
    ]);
    if (!desktopBridge && !capabilities.isLanBrowser) writeBrowserRecords(nextRecords);
    setRecords(nextRecords);
    return record;
  };

  const resetDemoData = () => {
    writeBrowserRecords(demoSeedRecords);
    window.localStorage.setItem(sequenceStorageKey, '2');
    setRecords(demoSeedRecords);
  };

  return (
    <RecordStoreContext.Provider
      value={{
        records,
        isLoading,
        error,
        saveDraft,
        finalizeRecord,
        cancelRecord,
        resetDemoData,
      }}
    >
      {children}
    </RecordStoreContext.Provider>
  );
};

const requestLocalApi = async (
  path: string,
  method: 'GET' | 'POST',
  operatorContext: OperatorContext,
  body?: unknown,
): Promise<unknown> => {
  const response = await fetch(`${localApiBaseUrl}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-vaultbill-role': operatorContext.role,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error(
      typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof payload.error === 'string'
        ? payload.error
        : `Local API request failed with status ${String(response.status)}.`,
    );
  }
  return payload;
};

export const useRecordStore = (): RecordStoreContextValue => {
  const context = useContext(RecordStoreContext);

  if (!context) {
    throw new Error('RecordStoreProvider is required.');
  }

  return context;
};
