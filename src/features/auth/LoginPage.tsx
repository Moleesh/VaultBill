/** @format */

/**
 * Login surface for operator selection, password entry, and desktop license or
 * help actions.
 */

import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { FC } from 'react';

import { AppBrandIcon } from '../../components/AppBrandIcon/AppBrandIcon';
import { DesktopWindowControls } from '../../components/DesktopWindowControls';
import { shouldRenderDesktopChrome } from '../../capability/CapabilityRegistry';
import { useCapabilities } from '../../capability/CapabilityContext';
import { defaultRuntimeBranding } from '../../constants/RuntimeDefaults';
import { canUseLocalHostedApi, requestHostedWindowAction } from '../../runtime/HostedApi';
import { applyTheme, loadResolvedTheme } from '../../runtime/WorkspaceTheme';
import { LoginActivationModal } from './LoginActivationModal';
import { LoginHelpModal } from './LoginHelpModal';
import { buildLoginAccountOptions, findLoginAccount, getLoginAccountId } from './LoginPageSupport';
import { LoginPageForm } from './LoginPageForm';
import { useSession } from './SessionContext';
import { useActivationForm, useLoginForm } from './useLoginForms';
import { useSysAdminUnlock } from './useSysAdminUnlock';

/** Renders the compact login experience for the current runtime mode. */
export const LoginPage: FC = () => {
    const capabilities = useCapabilities();
    const showDesktopChrome = shouldRenderDesktopChrome(capabilities);
    const { accounts, hostedConnectionState, login, operatorContext } = useSession();
    const navigate = useNavigate();
    const loginSubmissionInFlightRef = useRef(false);
    const [error, setError] = useState('');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isActivationOpen, setIsActivationOpen] = useState(false);
    const [activationMessage, setActivationMessage] = useState('');
    const { isUnlocked: isSysAdminUnlocked } = useSysAdminUnlock();
    const accountOptions = buildLoginAccountOptions(accounts, isSysAdminUnlocked);
    const fallbackSelectedAccountId = getLoginAccountId(accounts, isSysAdminUnlocked);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const loginForm = useLoginForm({
        defaultSelectedAccountId: fallbackSelectedAccountId,
        onSubmit: async ({ password, selectedAccountId }) => {
            const accountId = selectedAccountId || effectiveSelectedAccountId;
            if (!accountId || hostedConnectionState !== 'connected') return;
            if (loginSubmissionInFlightRef.current) return;
            loginSubmissionInFlightRef.current = true;
            try {
                await login(accountId, password);
                void navigate('/app/dashboard');
            } catch (reason) {
                setError(reason instanceof Error ? reason.message : 'Login failed.');
            } finally {
                loginSubmissionInFlightRef.current = false;
            }
        },
    });
    const activationForm = useActivationForm();
    const effectiveSelectedAccountId = selectedAccountId || fallbackSelectedAccountId;
    const selectedAccount = findLoginAccount(accounts, effectiveSelectedAccountId);
    const isLoginDisabled = !effectiveSelectedAccountId || hostedConnectionState !== 'connected';

    useEffect(() => {
        void loadResolvedTheme(capabilities.isHostedWeb)
            .then(applyTheme)
            .catch(() => undefined);
    }, [capabilities.isHostedWeb]);

    const submitLogin = async () => {
        if (isLoginDisabled || loginSubmissionInFlightRef.current) return;
        await loginForm.handleSubmit();
    };

    useEffect(() => {
        if (!selectedAccountId && fallbackSelectedAccountId) {
            setSelectedAccountId(fallbackSelectedAccountId);
            loginForm.setFieldValue('selectedAccountId', fallbackSelectedAccountId);
            return;
        }

        if (!isSysAdminUnlocked) {
            const selectedRole = accounts.find(
                (account) => account.userId === effectiveSelectedAccountId,
            )?.role;
            if (selectedRole === 'SysAdmin') {
                const nextSelectedAccountId = getLoginAccountId(accounts);
                setSelectedAccountId(nextSelectedAccountId);
                loginForm.setFieldValue('selectedAccountId', nextSelectedAccountId);
            }
        }
    }, [
        accounts,
        fallbackSelectedAccountId,
        isSysAdminUnlocked,
        loginForm,
        selectedAccountId,
        effectiveSelectedAccountId,
    ]);

    if (operatorContext) {
        return <Navigate replace to="/app/dashboard" />;
    }

    return (
        <main className="login-page">
            {showDesktopChrome ? (
                <div className="login-page-chrome">
                    <DesktopWindowControls
                        isDesktop={showDesktopChrome}
                        onCloseWindow={() => {
                            if (window.vaultBillDesktop?.closeWindow) {
                                void window.vaultBillDesktop.closeWindow();
                                return;
                            }
                            if (canUseLocalHostedApi()) void requestHostedWindowAction('close');
                        }}
                        onMinimizeWindow={() => {
                            if (window.vaultBillDesktop?.minimizeWindow) {
                                void window.vaultBillDesktop.minimizeWindow();
                                return;
                            }
                            if (canUseLocalHostedApi()) void requestHostedWindowAction('minimize');
                        }}
                    />
                </div>
            ) : null}
            <section className="login-card" aria-labelledby="login-title">
                <div className="login-card-brand">
                    <AppBrandIcon size="large" />
                    <p className="eyebrow">Secure workspace</p>
                    <h1 id="login-title">{defaultRuntimeBranding.applicationName}</h1>
                    <p>{defaultRuntimeBranding.tagline}</p>
                    {capabilities.isDemoMode ? (
                        <span className="status-pill">Browser-only product demo</span>
                    ) : null}
                </div>
                <div className="login-card-form">
                    <LoginPageForm
                        accountOptions={accountOptions}
                        capabilities={capabilities}
                        error={error}
                        form={loginForm}
                        hostedConnectionState={hostedConnectionState}
                        isLoginDisabled={isLoginDisabled}
                        onActivationOpen={() => {
                            setIsActivationOpen(true);
                        }}
                        onHelpOpen={() => {
                            setIsHelpOpen(true);
                        }}
                        onSelectedAccountIdChange={(nextSelectedAccountId) => {
                            setSelectedAccountId(nextSelectedAccountId);
                        }}
                        onSubmit={() => {
                            void submitLogin();
                        }}
                        selectedAccount={selectedAccount}
                        selectedAccountId={effectiveSelectedAccountId}
                        showDesktopActions={showDesktopChrome}
                    />
                </div>
                <footer>
                    <span>Local-first desktop workspace</span>
                    <span>Designed for calm, focused work</span>
                </footer>
            </section>
            <LoginHelpModal
                isOpen={isHelpOpen}
                onClose={() => {
                    setIsHelpOpen(false);
                }}
            />
            <LoginActivationModal
                activationMessage={activationMessage}
                form={activationForm}
                isOpen={isActivationOpen}
                onActivate={() => {
                    void window.vaultBillDesktop
                        ?.activateLicense(activationForm.state.values.licenseKey)
                        .then(() => {
                            activationForm.reset();
                            setActivationMessage('VaultBill is activated. You can now log in.');
                        })
                        .catch((reason: unknown) => {
                            setActivationMessage(
                                reason instanceof Error ? reason.message : 'Activation failed.',
                            );
                        });
                }}
                onClose={() => {
                    setIsActivationOpen(false);
                }}
            />
        </main>
    );
};
