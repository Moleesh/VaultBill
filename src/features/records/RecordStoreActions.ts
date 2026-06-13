/** @format */

import { requestHostedApi } from '../../runtime/HostedApi';
import type { OperatorContext } from '../auth/AccountTypes';
import {
    AppRecordSchema,
    buildStoredRecord,
    demoSeedRecords,
    recordStoreEventName,
    sortLatestFirst,
    type AppRecord,
} from './RecordStoreSupport';
import type { RecordStoreContextValue } from './RecordStoreTypes';
import {
    loadBrowserRecords,
    loadDesktopRecords,
    loadHostedRecords,
} from './RecordStoreActionsSupport';

type RecordStoreActionDependencies = {
    readonly accounts: () => readonly AppRecord[];
    readonly isDemoMode: () => boolean;
    readonly isLanBrowser: () => boolean;
    readonly sessionOperator: () => OperatorContext | undefined;
    readonly setRecords: (records: readonly AppRecord[]) => void;
    readonly setLoading: (isLoading: boolean) => void;
    readonly setError: (error: string) => void;
};

/** Creates the record-store mutations that keep browser, LAN, and desktop in sync. */
export const createRecordStoreActions = (dependencies: RecordStoreActionDependencies) => {
    const loadRecords = () => {
        const desktopBridge = window.vaultBillDesktop;

        if (desktopBridge && !dependencies.isDemoMode()) {
            void loadDesktopRecords(
                {
                    setRecords: dependencies.setRecords,
                    setLoading: dependencies.setLoading,
                    setError: dependencies.setError,
                },
                desktopBridge,
            );
            return;
        }

        if (dependencies.isLanBrowser()) {
            void loadHostedRecords(
                {
                    accounts: dependencies.accounts,
                    isDemoMode: dependencies.isDemoMode,
                    isLanBrowser: dependencies.isLanBrowser,
                    sessionOperator: dependencies.sessionOperator,
                },
                {
                    setRecords: dependencies.setRecords,
                    setLoading: dependencies.setLoading,
                    setError: dependencies.setError,
                },
            );
            return;
        }

        loadBrowserRecords(
            {
                isDemoMode: dependencies.isDemoMode,
            },
            {
                setRecords: dependencies.setRecords,
                setLoading: dependencies.setLoading,
                setError: dependencies.setError,
            },
        );
    };

    const saveDraft: RecordStoreContextValue['saveDraft'] = async (input, operatorContext) => {
        const records = dependencies.accounts();
        const existing = records.find((record) => record.recordId === input.recordId);

        if (existing && existing.status !== 'Draft') {
            throw new Error('Finalized and cancelled records are read-only.');
        }

        const desktopBridge = window.vaultBillDesktop;
        const record = AppRecordSchema.parse(
            desktopBridge
                ? await desktopBridge.saveDraft({ record: input, operatorContext })
                : dependencies.isLanBrowser()
                  ? await requestHostedApi('/records/draft', 'POST', { record: input })
                  : buildStoredRecord(input, operatorContext, existing, 'Draft'),
        );
        const nextRecords = sortLatestFirst([
            record,
            ...records.filter((current) => current.recordId !== record.recordId),
        ]);

        if (!desktopBridge && !dependencies.isLanBrowser()) {
            window.localStorage.setItem('vaultbill.records', JSON.stringify(nextRecords));
            window.dispatchEvent(new Event(recordStoreEventName));
        }

        dependencies.setRecords(nextRecords);
        return record;
    };

    const finalizeRecord: RecordStoreContextValue['finalizeRecord'] = async (
        input,
        operatorContext,
    ) => {
        const records = dependencies.accounts();
        const existing = records.find((record) => record.recordId === input.recordId);

        if (existing?.status !== 'Draft') {
            throw new Error('Save the current document as a Draft before finalizing it.');
        }

        const desktopBridge = window.vaultBillDesktop;
        const record = AppRecordSchema.parse(
            desktopBridge
                ? await desktopBridge.finalizeRecord({ record: input, operatorContext })
                : dependencies.isLanBrowser()
                  ? await requestHostedApi('/records/finalize', 'POST', { record: input })
                  : buildStoredRecord(input, operatorContext, existing, 'Finalized'),
        );
        const nextRecords = sortLatestFirst([
            record,
            ...records.filter((current) => current.recordId !== record.recordId),
        ]);

        if (!desktopBridge && !dependencies.isLanBrowser()) {
            window.localStorage.setItem('vaultbill.records', JSON.stringify(nextRecords));
            window.dispatchEvent(new Event(recordStoreEventName));
        }

        dependencies.setRecords(nextRecords);
        return record;
    };

    const cancelRecord: RecordStoreContextValue['cancelRecord'] = async (
        recordId,
        reason,
        operatorContext,
    ) => {
        const records = dependencies.accounts();
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
                : dependencies.isLanBrowser()
                  ? await requestHostedApi('/records/cancel', 'POST', { recordId, reason })
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

        if (!desktopBridge && !dependencies.isLanBrowser()) {
            window.localStorage.setItem('vaultbill.records', JSON.stringify(nextRecords));
            window.dispatchEvent(new Event(recordStoreEventName));
        }

        dependencies.setRecords(nextRecords);
        return record;
    };

    const resetDemoData = () => {
        window.localStorage.setItem('vaultbill.records', JSON.stringify(demoSeedRecords));
        window.localStorage.setItem('vaultbill.sequence', '2');
        dependencies.setRecords(demoSeedRecords);
    };

    return { loadRecords, saveDraft, finalizeRecord, cancelRecord, resetDemoData };
};
