/** @format */
/* eslint-disable max-lines */

/**
 * Login surface for operator selection, password entry, and desktop license or
 * help actions.
 */

import { useEffect, useRef, useState, type FC } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { AppBrandIcon } from '../../components/AppBrandIcon/AppBrandIcon';
import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { DesktopWindowControls } from '../../components/DesktopWindowControls';
import { shouldRenderDesktopChrome } from '../../capability/CapabilityRegistry';
import { useCapabilities } from '../../capability/CapabilityContext';
import { defaultRuntimeBranding } from '../../constants/RuntimeDefaults';
import { isStaticHostedBrowserBuild } from '../../runtime/RuntimeMode';
import { applyTheme, loadResolvedTheme } from '../../runtime/WorkspaceTheme';
import { LoginActivationModal } from './LoginActivationModal';
import { LoginHelpModal } from './LoginHelpModal';
import { buildLoginAccountOptions, findLoginAccount, getLoginAccountId } from './LoginPageSupport';
import {
    activateLoginLicense,
    getLoginFooterCopy,
    requestLoginCloseWindow,
    requestLoginMinimizeWindow,
    useSetupShortcutConfirmation,
} from './LoginPageRuntimeSupport';
import { LoginPageForm } from './LoginPageForm';
import { useSession } from './SessionContext';
import { useActivationForm, useLoginForm } from './useLoginForms';
import { useSysAdminUnlock } from './useSysAdminUnlock';

/** Renders the compact login experience for the current runtime mode. */
export const LoginPage: FC<{ readonly onOpenSetupWizard?: () => void }> = ({
    onOpenSetupWizard,
}) => {
    const capabilities = useCapabilities();
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const showDesktopChrome = shouldRenderDesktopChrome(capabilities);
    const { accounts, hostedConnectionState, login, operatorContext } = useSession();
    const navigate = useNavigate();
    const loginSubmissionInFlightRef = useRef(false);
    const [error, setError] = useState('');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isActivationOpen, setIsActivationOpen] = useState(false);
    const [isSetupShortcutConfirmOpen, setIsSetupShortcutConfirmOpen] = useState(false);
    const [isSysAdminUnlockMessageVisible, setIsSysAdminUnlockMessageVisible] = useState(false);
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
    const footerCopy = getLoginFooterCopy({
        isStaticHostedBrowserBuild: usesStaticHostedBrowserBuild,
        isDesktop: showDesktopChrome,
        isHostedWeb: capabilities.isHostedWeb,
    });
    useSetupShortcutConfirmation(onOpenSetupWizard, () => {
        setIsSetupShortcutConfirmOpen(true);
    });

    useEffect(() => {
        void loadResolvedTheme(capabilities.isHostedWeb)
            .then(applyTheme)
            .catch(() => undefined);
    }, [capabilities.isHostedWeb]);

    useEffect(() => {
        if (!showDesktopChrome || !isSysAdminUnlocked) return;

        setIsSysAdminUnlockMessageVisible(true);
        const timeout = window.setTimeout(() => {
            setIsSysAdminUnlockMessageVisible(false);
        }, 2800);
        return () => {
            window.clearTimeout(timeout);
        };
    }, [isSysAdminUnlocked, showDesktopChrome]);

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
            {showDesktopChrome && isSysAdminUnlockMessageVisible ? (
                <div className="setup-page-toast" role="status">
                    <div className="setup-page-toast-content">
                        <strong className="setup-page-toast-title">System Administrator</strong>
                        <p>
                            System Administrator unlocked. You can now choose the protected account.
                        </p>
                    </div>
                </div>
            ) : null}
            {showDesktopChrome ? (
                <div className="login-page-chrome">
                    <DesktopWindowControls
                        isDesktop={showDesktopChrome}
                        onCloseWindow={() => {
                            requestLoginCloseWindow(showDesktopChrome);
                        }}
                        onMinimizeWindow={() => {
                            requestLoginMinimizeWindow(showDesktopChrome);
                        }}
                        onRefreshWindow={() => {
                            window.location.reload();
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
                    {usesStaticHostedBrowserBuild ? (
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
                        isStaticHostedBrowserBuild={usesStaticHostedBrowserBuild}
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
                <footer className={showDesktopChrome ? 'login-card-footer--desktop' : undefined}>
                    <span className="login-card-footer-copy login-card-footer-copy--primary">
                        {footerCopy.primary}
                    </span>
                    <span className="login-card-footer-copy login-card-footer-copy--secondary">
                        {footerCopy.secondary}
                    </span>
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
                    activateLoginLicense(activationForm, setActivationMessage);
                }}
                onClose={() => {
                    setIsActivationOpen(false);
                }}
            />
            <AppConfirmDialog
                confirmLabel="Open setup"
                description="Open the initial setup wizard again from the sign-in screen?"
                isOpen={isSetupShortcutConfirmOpen}
                onCancel={() => {
                    setIsSetupShortcutConfirmOpen(false);
                }}
                onConfirm={() => {
                    setIsSetupShortcutConfirmOpen(false);
                    onOpenSetupWizard?.();
                }}
                title="Return to setup wizard"
            />
        </main>
    );
};
