/** @format */

import { z } from 'zod';

import { requestHostedApi } from '../../runtime/HostedApi';
import type { OperatorContext } from '../auth/AccountTypes';
import {
    AppRecordSchema,
    buildStoredRecord,
    readBrowserRecords,
    sortLatestFirst,
    type AppRecord,
} from './RecordStoreSupport';

type RecordStoreActionDependencies = {
    readonly accounts: () => readonly AppRecord[];
    readonly isDemoMode: () => boolean;
    readonly isHostedWeb: () => boolean;
    readonly sessionOperator: () => OperatorContext | undefined;
};

type RecordStoreActionSignals = {
    readonly setRecords: (records: readonly AppRecord[]) => void;
    readonly setLoading: (isLoading: boolean) => void;
    readonly setError: (error: string) => void;
};

export const loadDesktopRecords = async (
    signals: RecordStoreActionSignals,
    desktopBridge: NonNullable<typeof window.vaultBillDesktop>,
) => {
    try {
        const storedRecords = await desktopBridge.listRecords();
        signals.setRecords(sortLatestFirst(z.array(AppRecordSchema).parse(storedRecords)));
        signals.setError('');
    } catch (reason: unknown) {
        signals.setError(reason instanceof Error ? reason.message : 'Records could not be loaded.');
    } finally {
        signals.setLoading(false);
    }
};

export const loadHostedRecords = async (
    dependencies: RecordStoreActionDependencies,
    signals: RecordStoreActionSignals,
) => {
    if (!dependencies.sessionOperator()) {
        signals.setRecords([]);
        signals.setLoading(false);
        return;
    }

    try {
        const storedRecords = await requestHostedApi('/records');
        signals.setRecords(sortLatestFirst(z.array(AppRecordSchema).parse(storedRecords)));
        signals.setError('');
    } catch (reason: unknown) {
        signals.setError(reason instanceof Error ? reason.message : 'Records could not be loaded.');
    } finally {
        signals.setLoading(false);
    }
};

export const loadBrowserRecords = (
    dependencies: Pick<RecordStoreActionDependencies, 'isDemoMode'>,
    signals: RecordStoreActionSignals,
) => {
    try {
        signals.setRecords(readBrowserRecords(dependencies.isDemoMode()));
        signals.setError('');
    } catch (reason) {
        signals.setError(reason instanceof Error ? reason.message : 'Records could not be loaded.');
    } finally {
        signals.setLoading(false);
    }
};

export const saveLocalRecord = (
    input: Parameters<typeof buildStoredRecord>[0],
    operatorContext: OperatorContext,
    existing: AppRecord | undefined,
    status: 'Draft' | 'Finalized',
) => buildStoredRecord(input, operatorContext, existing, status);
