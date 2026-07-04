/** @format */
/* eslint-disable max-lines */

/**
 * Login surface for operator selection, password entry, and desktop license or
 * help actions.
 */

import { useEffect, useRef, useState, type FC } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useCapabilities } from '../../capability/CapabilityContext';
import { shouldRenderDesktopChrome } from '../../capability/CapabilityRegistry';
import { AppBrandIcon } from '../../components/AppBrandIcon/AppBrandIcon';
import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { getSafeAppPathForRole } from '../../components/AppShellSupport';
import { DesktopWindowControls } from '../../components/DesktopWindowControls';
import { defaultRuntimeBranding } from '../../constants/RuntimeDefaults';
import { isStaticHostedBrowserBuild } from '../../runtime/RuntimeMode';
import { applyTheme, loadResolvedTheme } from '../../runtime/WorkspaceTheme';
import { LoginActivationModal } from './LoginActivationModal';
import { LoginHelpModal } from './LoginHelpModal';
import { LoginPageForm } from './LoginPageForm';
import {
    activateLoginLicense,
    getLoginFooterCopy,
    requestLoginCloseWindow,
    requestLoginMinimizeWindow,
    useSetupShortcutConfirmation,
} from './LoginPageRuntimeSupport';
import { buildLoginAccountOptions, findLoginAccount, getLoginAccountId } from './LoginPageSupport';
import { useSession } from './SessionContext';

import { useActivationForm, useLoginForm } from './useLoginForms';
import { useSysAdminUnlock } from './useSysAdminUnlock';

const getRequestedAppPath = (state: unknown): string | undefined => {
    if (typeof state !== 'object' || state === null || !('from' in state)) {
        return undefined;
    }

    const { from } = state as Readonly<Record<'from', unknown>>;
    return typeof from === 'string' ? from : undefined;
};

/** Renders the compact login experience for the current runtime mode. */
export const LoginPage: FC<{ readonly onOpenSetupWizard?: () => void }> = ({
    onOpenSetupWizard,
}) => {
    const capabilities = useCapabilities();
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const showDesktopChrome = shouldRenderDesktopChrome(capabilities);
    const allowSetupShortcut = capabilities.isDesktop || window.vaultBillRuntime === 'desktop';
    const { accounts, hostedConnectionState, login, operatorContext } = useSession();
    const location = useLocation();
    const navigate = useNavigate();
    const loginSubmissionInFlightRef = useRef(false);
    const latestPasswordRef = useRef('');
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
    const performLogin = async ({
        password,
        selectedAccountId,
    }: {
        readonly password: string;
        readonly selectedAccountId: string;
    }) => {
        const accountId = selectedAccountId || effectiveSelectedAccountId;
        if (!accountId || hostedConnectionState !== 'connected') return;
        if (loginSubmissionInFlightRef.current) return;
        loginSubmissionInFlightRef.current = true;
        try {
            await login(accountId, password);
            const accountRole =
                accounts.find((account) => account.userId === accountId)?.role ?? 'Admin';
            const requestedPath = getRequestedAppPath(location.state);
            void navigate(getSafeAppPathForRole(accountRole, requestedPath));
        } catch (reason) {
            const message = reason instanceof Error ? reason.message : 'Login failed.';
            setError(
                message
                    .replace(/^Error invoking remote method '[^']+':\s*/u, '')
                    .replace(/^Error:\s*/u, ''),
            );
        } finally {
            loginSubmissionInFlightRef.current = false;
        }
    };
    const loginForm = useLoginForm({
        defaultSelectedAccountId: fallbackSelectedAccountId,
        onSubmit: performLogin,
    });
    const activationForm = useActivationForm();
    const effectiveSelectedAccountId = selectedAccountId || fallbackSelectedAccountId;
    const selectedAccount = findLoginAccount(accounts, effectiveSelectedAccountId);
    const isLoginDisabled = !effectiveSelectedAccountId || hostedConnectionState !== 'connected';
    const isPasswordRequired = Boolean(
        selectedAccount?.passwordHash ?? selectedAccount?.passwordConfigured,
    );
    const footerCopy = getLoginFooterCopy({
        isStaticHostedBrowserBuild: usesStaticHostedBrowserBuild,
        isDesktop: showDesktopChrome,
        isHostedWeb: capabilities.isHostedWeb,
    });

    useSetupShortcutConfirmation(allowSetupShortcut, onOpenSetupWizard, () => {
        setIsSetupShortcutConfirmOpen(true);
    });

    useEffect(() => {
        void loadResolvedTheme(capabilities.isHostedWeb)
            .then(applyTheme)
            .catch(() => undefined);
    }, [capabilities.isHostedWeb]);

    useEffect(() => {
        setIsSysAdminUnlockMessageVisible(showDesktopChrome && isSysAdminUnlocked);
    }, [isSysAdminUnlocked, showDesktopChrome]);

    const submitLogin = async () => {
        if (isLoginDisabled || loginSubmissionInFlightRef.current) return;
        const currentPassword = latestPasswordRef.current;
        const currentSelectedAccountId = effectiveSelectedAccountId;

        if (isPasswordRequired && currentPassword.trim().length === 0) {
            setError('Password is required.');
            return;
        }
        await performLogin({
            password: currentPassword,
            selectedAccountId: currentSelectedAccountId,
        });
    };

    useEffect(() => {
        if (
            selectedAccountId &&
            !accounts.some((account) => account.userId === selectedAccountId)
        ) {
            setSelectedAccountId(fallbackSelectedAccountId);
            loginForm.setFieldValue('selectedAccountId', fallbackSelectedAccountId);
            loginForm.setFieldValue('password', '');
            latestPasswordRef.current = '';
            return;
        }

        if (!selectedAccountId && fallbackSelectedAccountId) {
            setSelectedAccountId(fallbackSelectedAccountId);
            loginForm.setFieldValue('selectedAccountId', fallbackSelectedAccountId);
            return;
        }

        if (isSysAdminUnlocked) {
            const sysAdminAccountId = getLoginAccountId(accounts, true);
            const sysAdminRole = accounts.find(
                (account) => account.userId === sysAdminAccountId,
            )?.role;
            if (
                sysAdminAccountId &&
                sysAdminRole === 'SysAdmin' &&
                effectiveSelectedAccountId !== sysAdminAccountId
            ) {
                setSelectedAccountId(sysAdminAccountId);
                loginForm.setFieldValue('selectedAccountId', sysAdminAccountId);
                loginForm.setFieldValue('password', '');
                latestPasswordRef.current = '';
                return;
            }
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
        const requestedPath = getRequestedAppPath(location.state);
        return <Navigate replace to={getSafeAppPathForRole(operatorContext.role, requestedPath)} />;
    }

    return (
        <main className="login-page">
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
                    {showDesktopChrome && isSysAdminUnlockMessageVisible ? (
                        <div className="login-inline-status" role="status">
                            <strong className="login-inline-status-title">
                                System Administrator
                            </strong>
                            <p>
                                System Administrator unlocked. You can now choose the protected
                                account.
                            </p>
                        </div>
                    ) : null}
                    <LoginPageForm
                        accountOptions={accountOptions}
                        capabilities={capabilities}
                        error={error}
                        form={loginForm}
                        hostedConnectionState={hostedConnectionState}
                        isLoginDisabled={isLoginDisabled}
                        isPasswordRequired={isPasswordRequired}
                        isStaticHostedBrowserBuild={usesStaticHostedBrowserBuild}
                        onActivationOpen={() => {
                            setIsActivationOpen(true);
                        }}
                        onHelpOpen={() => {
                            setIsHelpOpen(true);
                        }}
                        onPasswordChange={(nextPassword) => {
                            latestPasswordRef.current = nextPassword;
                            if (error) setError('');
                        }}
                        onSelectedAccountIdChange={(nextSelectedAccountId) => {
                            setSelectedAccountId(nextSelectedAccountId);
                            latestPasswordRef.current = '';
                            if (error) setError('');
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
