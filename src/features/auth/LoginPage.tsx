/* eslint-disable max-lines */
import { KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { FC } from 'react';

import { AppBrandIcon } from '../../components/AppBrandIcon/AppBrandIcon';
import { AppModal } from '../../components/AppModal/AppModal';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { useCapabilities } from '../../capability/CapabilityContext';
import { defaultRuntimeBranding } from '../../constants/PhaseOneSeed';
import { VENDOR } from '../../constants/Vendor';
import { useSession } from './SessionContext';

export const LoginPage: FC = () => {
  const capabilities = useCapabilities();
  const { accounts, hostedConnectionState, login, operatorContext } = useSession();
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.userId ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [activationMessage, setActivationMessage] = useState('');
  const accountOptions = accounts.map((account) => ({
    value: account.userId,
    label: account.displayName,
    description: account.role,
    keywords: [account.username, account.role],
  }));
  const selectedAccount = accounts.find((account) => account.userId === selectedAccountId);
  const isLoginDisabled = !selectedAccountId || hostedConnectionState !== 'connected';

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
              if (isLoginDisabled) return;
              void login(selectedAccountId, password)
                .then(() => {
                  void navigate('/app/dashboard');
                })
                .catch((reason: unknown) => {
                  setError(reason instanceof Error ? reason.message : 'Login failed.');
                });
            }}
          >
            {capabilities.isDemoMode ? (
              <div className="demo-login-summary">
                <strong>Demo User</strong>
                <p>Create GST invoices, finalize records, reprint, and explore reports.</p>
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
      <AppModal
        isOpen={isHelpOpen}
        onClose={() => {
          setIsHelpOpen(false);
        }}
        title="Login help"
      >
        <p>Choose your operator account, then log in.</p>
      </AppModal>
      <AppModal
        isOpen={isActivationOpen}
        onClose={() => {
          setIsActivationOpen(false);
        }}
        title="Activate VaultBill"
      >
        <label>
          <span>License key</span>
          <input
            value={licenseKey}
            onChange={(event) => {
              setLicenseKey(event.currentTarget.value);
            }}
          />
        </label>
        {activationMessage ? (
          <p className="feedback-info" role="status">
            {activationMessage}
          </p>
        ) : null}
        <button
          className="button-primary"
          disabled={!licenseKey.trim()}
          onClick={() => {
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
          type="button"
        >
          Activate full version
        </button>
      </AppModal>
    </main>
  );
};
