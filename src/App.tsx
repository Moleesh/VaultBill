/** @format */

/** Root application entry that wires the router, shell, and mode-specific page stack. */

import { Suspense, useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppRouteFallback, AppRouteTree } from './AppRoutesSupport';
import { AnimatedCursor } from './components/AnimatedCursor';
import { CapabilityProvider } from './capability/CapabilityContext';
import { useCapabilities } from './capability/CapabilityContext';
import { SessionProvider } from './features/auth/SessionContext';
import { RecordStoreProvider } from './features/records/RecordStoreContext';
import { canUseLocalHostedApi, requestHostedApi } from './runtime/HostedApi';
import { canUseDbBackedRuntime, isStaticHostedBrowserBuild } from './runtime/RuntimeMode';

const AppRoutes: FC = () => {
    const capabilities = useCapabilities();
    const navigate = useNavigate();
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const [setupRevision, setSetupRevision] = useState(0);
    const [setupWizardRevision, setSetupWizardRevision] = useState(0);
    const [setupWizardForcedOpen, setSetupWizardForcedOpen] = useState(false);
    const [desktopSetupRequired, setDesktopSetupRequired] = useState<boolean | null>(
        !usesStaticHostedBrowserBuild && canUseDbBackedRuntime(capabilities) ? null : false,
    );
    const setupRequired = desktopSetupRequired ?? false;

    useEffect(() => {
        if (usesStaticHostedBrowserBuild) {
            setDesktopSetupRequired(false);
            return;
        }

        let isCurrent = true;
        const canUseHostedSetupStatus = capabilities.isHostedWeb || canUseLocalHostedApi();
        const desktopStatusFallback = () =>
            window.vaultBillDesktop
                ? Promise.all([
                      window.vaultBillDesktop.listAccounts(),
                      window.vaultBillDesktop.getBusinessSettings(),
                  ]).then(([accounts, business]) => ({
                      hasActiveAdmin: accounts.some(
                          (account) => account.role === 'Admin' && account.isActive,
                      ),
                      business,
                  }))
                : Promise.resolve({
                      hasActiveAdmin: false,
                      business: { companyName: '', address: '' },
                  });
        const desktopRequest = canUseHostedSetupStatus
            ? requestHostedApi<{
                  readonly isSetupComplete: boolean;
                  readonly hasActiveAdmin: boolean;
                  readonly business: {
                      readonly companyName: string;
                      readonly address: string;
                  };
              }>('/setup/status')
                  .then((status) => ({
                      hasActiveAdmin: status.hasActiveAdmin,
                      business: status.business,
                  }))
                  .catch(() => desktopStatusFallback())
            : desktopStatusFallback();

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
    }, [capabilities.isHostedWeb, setupRevision, usesStaticHostedBrowserBuild]);

    if (desktopSetupRequired === null) return null;

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
                            setSetupRevision((current) => current + 1);
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
    <CapabilityProvider>
        <AppRoutes />
        <AnimatedCursor />
    </CapabilityProvider>
);
