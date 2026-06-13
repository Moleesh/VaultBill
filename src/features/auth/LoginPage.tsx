/** @format */

/**
 * Login surface for operator selection, password entry, and desktop license or
 * help actions.
 */

import { KeyRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { FC } from 'react';

import { AppBrandIcon } from '../../components/AppBrandIcon/AppBrandIcon';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { useCapabilities } from '../../capability/CapabilityContext';
import { defaultRuntimeBranding } from '../../constants/PhaseOneSeed';
import { VENDOR } from '../../constants/Vendor';
import { LoginActivationModal } from './LoginActivationModal';
import { LoginHelpModal } from './LoginHelpModal';
import { buildLoginAccountOptions, findLoginAccount } from './LoginPageSupport';
import { useSession } from './SessionContext';

/** Renders the compact login experience for the current runtime mode. */
export const LoginPage: FC = () => {
    const capabilities = useCapabilities();
    const { accounts, hostedConnectionState, login, operatorContext } = useSession();
    const navigate = useNavigate();
    const loginSubmissionInFlightRef = useRef(false);
    const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.userId ?? '');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isActivationOpen, setIsActivationOpen] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [activationMessage, setActivationMessage] = useState('');
    const accountOptions = buildLoginAccountOptions(accounts);
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
        if (!selectedAccountId && accounts[0]) setSelectedAccountId(accounts[0].userId);
    }, [accounts, selectedAccountId]);

    if (operatorContext) {
        return <Navigate replace to="/app/dashboard" />;
    }

    return (
        <main className="login-page">
            <section className="login-card" aria-labelledby="login-title">
                <div className="login-card__brand">
                    <AppBrandIcon size="large" />
                    <p className="eyebrow">Secure billing workspace</p>
                    <h1 id="login-title">{defaultRuntimeBranding.applicationName}</h1>
                    <p>{defaultRuntimeBranding.tagline}</p>
                    {capabilities.isDemoMode ? (
                        <span className="status-pill">Browser-only product demo</span>
                    ) : null}
                </div>
                <div className="login-card__form">
                    {capabilities.isLanBrowser && hostedConnectionState !== 'connected' ? (
                        <div className="host-reconnect" role="status">
                            <strong>
                                {hostedConnectionState === 'connecting'
                                    ? 'Connecting to VaultBill Desktop'
                                    : 'VaultBill Desktop is unavailable'}
                            </strong>
                            <p>
                                {hostedConnectionState === 'connecting'
                                    ? 'Checking the secure local session.'
                                    : 'Open VaultBill Desktop on the host computer, then reconnect.'}
                            </p>
                            {hostedConnectionState === 'unavailable' ? (
                                <button
                                    onClick={() => {
                                        window.location.reload();
                                    }}
                                    type="button"
                                >
                                    Reconnect
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                    <form
                        className="login-card__auth"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void submitLogin();
                        }}
                    >
                        {capabilities.isDemoMode ? (
                            <div className="demo-login-summary">
                                <strong>Demo User</strong>
                                <p>
                                    Create invoices, print records, and explore the demo workspace.
                                </p>
                            </div>
                        ) : (
                            <SearchableDropdown
                                label="Operator account"
                                onChange={setSelectedAccountId}
                                options={accountOptions}
                                value={selectedAccountId}
                            />
                        )}
                        {!capabilities.isDemoMode &&
                        (selectedAccount?.passwordHash || selectedAccount?.passwordConfigured) ? (
                            <label className="login-password">
                                <span>Password</span>
                                <input
                                    autoComplete="current-password"
                                    onChange={(event) => {
                                        setPassword(event.currentTarget.value);
                                        setError('');
                                    }}
                                    type="password"
                                    value={password}
                                />
                            </label>
                        ) : null}
                        <button className="button-primary" disabled={isLoginDisabled} type="submit">
                            {capabilities.isDemoMode ? 'Start demo' : 'Log in'}
                        </button>
                    </form>
                    {error ? (
                        <p className="feedback-error" role="alert">
                            {error}
                        </p>
                    ) : null}
                    <button
                        className="login-help-link"
                        onClick={() => {
                            setIsHelpOpen(true);
                        }}
                        type="button"
                    >
                        Login help
                    </button>
                    {capabilities.isDesktop ? (
                        <button
                            className="login-help-link"
                            onClick={() => {
                                setIsActivationOpen(true);
                            }}
                            type="button"
                        >
                            <KeyRound aria-hidden="true" size={16} /> Enter license key
                        </button>
                    ) : null}
                </div>
                <footer>
                    <span>Version {VENDOR.version}</span>
                    <span>Built for focused business work</span>
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
