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
import { useCapabilities } from '../../capability/CapabilityContext';
import { defaultRuntimeBranding } from '../../constants/RuntimeDefaults';
import { LoginActivationModal } from './LoginActivationModal';
import { LoginHelpModal } from './LoginHelpModal';
import { buildLoginAccountOptions, findLoginAccount, getLoginAccountId } from './LoginPageSupport';
import { LoginPageForm } from './LoginPageForm';
import { useSession } from './SessionContext';
import { useSysAdminUnlock } from './useSysAdminUnlock';

/** Renders the compact login experience for the current runtime mode. */
export const LoginPage: FC = () => {
    const capabilities = useCapabilities();
    const { accounts, hostedConnectionState, login, operatorContext } = useSession();
    const navigate = useNavigate();
    const loginSubmissionInFlightRef = useRef(false);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isActivationOpen, setIsActivationOpen] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [activationMessage, setActivationMessage] = useState('');
    const { isUnlocked: isSysAdminUnlocked } = useSysAdminUnlock();
    const accountOptions = buildLoginAccountOptions(accounts, isSysAdminUnlocked);
    const selectedAccount = findLoginAccount(accounts, selectedAccountId);
    const isLoginDisabled = !selectedAccountId || hostedConnectionState !== 'connected';

    const submitLogin = async () => {
        if (isLoginDisabled || loginSubmissionInFlightRef.current) return;
        loginSubmissionInFlightRef.current = true;
        try {
            await login(selectedAccountId, password);
            void navigate('/app/dashboard');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Login failed.');
        } finally {
            loginSubmissionInFlightRef.current = false;
        }
    };

    useEffect(() => {
        if (!selectedAccountId) {
            setSelectedAccountId(getLoginAccountId(accounts, isSysAdminUnlocked));
            return;
        }

        if (!isSysAdminUnlocked) {
            const selected = accounts.find((account) => account.userId === selectedAccountId);
            if (selected?.role === 'SysAdmin') {
                setSelectedAccountId(getLoginAccountId(accounts));
            }
        }
    }, [accounts, isSysAdminUnlocked, selectedAccountId]);

    if (operatorContext) {
        return <Navigate replace to="/app/dashboard" />;
    }

    return (
        <main className="login-page">
            {capabilities.isDesktop ? (
                <div className="login-page-chrome">
                    <DesktopWindowControls
                        isDesktop={capabilities.isDesktop}
                        onCloseWindow={() => {
                            void window.vaultBillDesktop?.closeWindow();
                        }}
                        onMinimizeWindow={() => {
                            void window.vaultBillDesktop?.minimizeWindow();
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
                        hostedConnectionState={hostedConnectionState}
                        isLoginDisabled={isLoginDisabled}
                        onActivationOpen={() => {
                            setIsActivationOpen(true);
                        }}
                        onHelpOpen={() => {
                            setIsHelpOpen(true);
                        }}
                        onPasswordChange={(value) => {
                            setPassword(value);
                            setError('');
                        }}
                        onSelectedAccountChange={(value) => {
                            setSelectedAccountId(value);
                            setPassword('');
                            setError('');
                        }}
                        onSubmit={() => {
                            void submitLogin();
                        }}
                        password={password}
                        selectedAccount={selectedAccount}
                        selectedAccountId={selectedAccountId}
                    />
                </div>
                <footer>
                    <span>Desktop-ready local workspace</span>
                    <span>Designed for calm, focused operations</span>
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
                isOpen={isActivationOpen}
                licenseKey={licenseKey}
                onActivate={() => {
                    void window.vaultBillDesktop
                        ?.activateLicense(licenseKey)
                        .then(() => {
                            setLicenseKey('');
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
                onLicenseKeyChange={setLicenseKey}
            />
        </main>
    );
};
