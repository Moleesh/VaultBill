/** @format */

/** Root application entry that wires the router, shell, and mode-specific page stack. */

import { Suspense, useEffect, useState } from 'react';
import type { FC } from 'react';

import { AppRouteFallback, AppRouteTree } from './AppRoutesSupport';
import { CapabilityProvider } from './capability/CapabilityContext';
import { useCapabilities } from './capability/CapabilityContext';
import { SessionProvider } from './features/auth/SessionContext';
import { RecordStoreProvider } from './features/records/RecordStoreContext';
import { requestHostedApi } from './runtime/HostedApi';

const AppRoutes: FC = () => {
    const capabilities = useCapabilities();
    const [setupRevision, setSetupRevision] = useState(0);
    const [desktopSetupRequired, setDesktopSetupRequired] = useState<boolean | null>(
        !capabilities.isDemoMode && (window.vaultBillDesktop || capabilities.isLanBrowser)
            ? null
            : false,
    );
    const setupRequired = desktopSetupRequired ?? false;

    useEffect(() => {
        if (capabilities.isDemoMode) {
            setDesktopSetupRequired(false);
            return;
        }

        let isCurrent = true;
        const desktopRequest = window.vaultBillDesktop
            ? Promise.all([
                  window.vaultBillDesktop.listAccounts(),
                  window.vaultBillDesktop.getBusinessSettings(),
              ]).then(([accounts, business]) => ({
                  hasActiveAdmin: accounts.some(
                      (account) => account.role === 'Admin' && account.isActive,
                  ),
                  business,
              }))
            : capabilities.isLanBrowser
              ? requestHostedApi<{
                    readonly isSetupComplete: boolean;
                    readonly hasActiveAdmin: boolean;
                    readonly business: {
                        readonly companyName: string;
                        readonly address: string;
                    };
                }>('/setup/status').then((status) => ({
                    hasActiveAdmin: status.hasActiveAdmin,
                    business: status.business,
                }))
              : Promise.resolve({
                    hasActiveAdmin: false,
                    business: { companyName: '', address: '' },
                });

        void desktopRequest
            .then(({ hasActiveAdmin, business }) => {
                if (!isCurrent) return;
                const isConfiguredBusiness =
                    typeof business === 'object' &&
                    business !== null &&
                    typeof (business as { readonly companyName?: unknown }).companyName ===
                        'string' &&
                    (business as { readonly companyName: string }).companyName.trim().length > 0 &&
                    typeof (business as { readonly address?: unknown }).address === 'string' &&
                    (business as { readonly address: string }).address.trim().length > 0;
                const isSetupRequired = !hasActiveAdmin || !isConfiguredBusiness;
                setDesktopSetupRequired(isSetupRequired);
            })
            .catch(() => {
                if (isCurrent) setDesktopSetupRequired(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [capabilities.isDemoMode, capabilities.isLanBrowser, setupRevision]);

    if (desktopSetupRequired === null) return null;

    return (
        <SessionProvider>
            <RecordStoreProvider>
                <Suspense fallback={<AppRouteFallback />}>
                    <AppRouteTree
                        isDemoMode={capabilities.isDemoMode}
                        setupRequired={setupRequired}
                        onSetupComplete={() => {
                            setSetupRevision((current) => current + 1);
                        }}
                    />
                </Suspense>
            </RecordStoreProvider>
        </SessionProvider>
    );
};
export const App: FC = () => (
    <CapabilityProvider>
        <AppRoutes />
    </CapabilityProvider>
);
