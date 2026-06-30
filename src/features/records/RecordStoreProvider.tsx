/** @format */

import { useEffect, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { isStaticHostedBrowserBuild } from '../../runtime/RuntimeMode';
import { useSession } from '../auth/useSession';
import { RecordStoreContext } from './RecordStoreContextBase';
import { createRecordStoreActions } from './RecordStoreActions';
import type { AppRecord } from './RecordStoreSupport';

/**
 * Supplies record data and record mutations across every runtime mode.
 */
export const RecordStoreProvider: FC<PropsWithChildren> = ({ children }) => {
    const capabilities = useCapabilities();
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const { operatorContext: sessionOperator } = useSession();
    const [records, setRecords] = useState<readonly AppRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadRecords = useMemo(
        () =>
            createRecordStoreActions({
                accounts: () => [],
                isHostedWeb: () => capabilities.isHostedWeb,
                usesStaticHostedBrowserBuild: () => usesStaticHostedBrowserBuild,
                sessionOperator: () => sessionOperator,
                setRecords,
                setLoading: setIsLoading,
                setError,
            }).loadRecords,
        [capabilities.isHostedWeb, sessionOperator, usesStaticHostedBrowserBuild],
    );
    const actions = useMemo(
        () =>
            createRecordStoreActions({
                accounts: () => records,
                isHostedWeb: () => capabilities.isHostedWeb,
                usesStaticHostedBrowserBuild: () => usesStaticHostedBrowserBuild,
                sessionOperator: () => sessionOperator,
                setRecords,
                setLoading: setIsLoading,
                setError,
            }),
        [capabilities.isHostedWeb, records, sessionOperator, usesStaticHostedBrowserBuild],
    );

    useEffect(() => {
        loadRecords();
        window.addEventListener('vaultbill-record-store-change', loadRecords);

        return () => {
            window.removeEventListener('vaultbill-record-store-change', loadRecords);
        };
    }, [loadRecords]);

    return (
        <RecordStoreContext.Provider
            value={{
                records,
                isLoading,
                error,
                saveDraft: actions.saveDraft,
                finalizeRecord: actions.finalizeRecord,
                cancelRecord: actions.cancelRecord,
                resetDemoData: actions.resetDemoData,
            }}
        >
            {children}
        </RecordStoreContext.Provider>
    );
};
