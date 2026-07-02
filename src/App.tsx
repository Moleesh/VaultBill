/** @format */

/** Root application entry that wires the router, shell, and mode-specific page stack. */

import type { FC } from 'react';
import { Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AppRouteFallback, AppRouteTree } from './AppRoutesSupport';
import { CapabilityProvider, useCapabilities } from './capability/CapabilityContext';
import { AnimatedCursor } from './components/AnimatedCursor';
import { SessionProvider } from './features/auth/SessionContext';
import { RecordStoreProvider } from './features/records/RecordStoreContext';
import { getRuntimeQueryScope, queryKeys } from './query/QueryKeys';
import { fetchSetupStatus } from './query/RuntimeQueries';
import { VaultBillQueryProvider } from './query/VaultBillQueryProvider';
import { canUseDbBackedRuntime, isStaticHostedBrowserBuild } from './runtime/RuntimeMode';

const AppRoutes: FC = () => {
    const capabilities = useCapabilities();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const [setupWizardRevision, setSetupWizardRevision] = useState(0);
    const [setupWizardForcedOpen, setSetupWizardForcedOpen] = useState(false);
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const setupStatusQuery = useQuery({
        queryKey: queryKeys.setupStatus(runtimeScope),
        enabled: !usesStaticHostedBrowserBuild && canUseDbBackedRuntime(capabilities),
        queryFn: () => fetchSetupStatus(capabilities),
    });
    const setupRequired = setupStatusQuery.data?.isSetupRequired ?? false;

    if (
        !usesStaticHostedBrowserBuild &&
        canUseDbBackedRuntime(capabilities) &&
        setupStatusQuery.isPending
    ) {
        return null;
    }

    return (
        <SessionProvider>
            <RecordStoreProvider>
                <Suspense fallback={<AppRouteFallback />}>
                    <AppRouteTree
                        isStaticHostedBrowserBuild={usesStaticHostedBrowserBuild}
                        onOpenSetupWizard={() => {
                            setSetupWizardForcedOpen(true);
                            setSetupWizardRevision((current) => current + 1);
                            void navigate('/setup', { replace: true });
                        }}
                        onSetupComplete={() => {
                            setSetupWizardForcedOpen(false);
                            void queryClient.invalidateQueries({
                                queryKey: queryKeys.setupStatus(runtimeScope),
                            });
                            void queryClient.invalidateQueries({
                                queryKey: queryKeys.session(runtimeScope),
                            });
                        }}
                        setupRequired={setupRequired}
                        setupWizardRevision={setupWizardRevision}
                        shouldAllowSetupWizard={setupRequired || setupWizardForcedOpen}
                    />
                </Suspense>
            </RecordStoreProvider>
        </SessionProvider>
    );
};
export const App: FC = () => (
    <VaultBillQueryProvider>
        <CapabilityProvider>
            <AppRoutes />
            <AnimatedCursor />
        </CapabilityProvider>
    </VaultBillQueryProvider>
);
