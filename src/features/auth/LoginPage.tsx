import { useState } from 'react';
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
  const { accounts, login, operatorContext } = useSession();
  const navigate = useNavigate();
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.userId ?? '');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const accountOptions = accounts.map((account) => ({
    value: account.userId,
    label: account.displayName,
    description: account.role,
    keywords: [account.username, account.role],
  }));

  if (operatorContext) {
    return <Navigate replace to={capabilities.isDemoMode ? '/app/records' : '/app/dashboard'} />;
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
          <p className="field-note">
            A PIN or password appears here only when your administrator enables it.
          </p>
          <button
            className="button-primary"
            disabled={!selectedAccountId}
            onClick={() => {
              login(selectedAccountId);
              void navigate(capabilities.isDemoMode ? '/app/records' : '/app/dashboard');
            }}
            type="button"
          >
            {capabilities.isDemoMode ? 'Start demo' : 'Log in'}
          </button>
          <button
            onClick={() => {
              setIsHelpOpen(true);
            }}
            type="button"
          >
            Login help
          </button>
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
        <p>
          Choose the operator account that belongs to you. Enter a PIN or password only when one is
          configured, then select Log in.
        </p>
      </AppModal>
    </main>
  );
};
