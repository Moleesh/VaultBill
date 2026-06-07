/* eslint-disable max-lines */
import { KeyRound, Plus, ShieldCheck, Trash2, UserRoundCog } from 'lucide-react';
import { useState } from 'react';
import type { FC, SyntheticEvent } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { themeOptions } from '../../constants/PhaseOneSeed';
import type { Role } from '../../types/AppTypes';
import { useSession } from '../auth/SessionContext';

const readProfile = () => {
  try {
    return JSON.parse(window.localStorage.getItem('vaultbill.business-profile') ?? '{}') as {
      companyName?: string;
      address?: string;
    };
  } catch {
    return {};
  }
};

export const SettingsPage: FC = () => {
  const capabilities = useCapabilities();
  const { accounts, archiveAccount, operatorContext, resetPassword, saveAccount } = useSession();
  const isSysAdmin = operatorContext?.role === 'SysAdmin';
  const profile = readProfile();
  const [companyName, setCompanyName] = useState(profile.companyName ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  const [gstin, setGstin] = useState(
    () => window.localStorage.getItem('vaultbill.company-gstin') ?? '',
  );
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem('vaultbill.theme') ?? 'teal-flow',
  );
  const [outputTarget, setOutputTarget] = useState(
    () => window.localStorage.getItem('vaultbill.output-target') ?? 'PreviewOnly',
  );
  const [lanEnabled, setLanEnabled] = useState(
    () => window.localStorage.getItem('vaultbill.lan.enabled') === 'true',
  );
  const [message, setMessage] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<Role>('User');
  const [passwordUserId, setPasswordUserId] = useState(operatorContext?.account.userId ?? '');
  const [newPassword, setNewPassword] = useState('');

  if (!operatorContext) return null;

  const manageableAccounts = accounts.filter((account) =>
    isSysAdmin ? account.role !== 'SysAdmin' : account.role === 'User',
  );

  const saveBusiness = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyName.trim() || !address.trim()) {
      setMessage('Business name and address are required.');
      return;
    }
    window.localStorage.setItem(
      'vaultbill.business-profile',
      JSON.stringify({ companyName: companyName.trim(), address: address.trim() }),
    );
    window.localStorage.setItem('vaultbill.company-gstin', gstin.trim());
    window.localStorage.setItem('vaultbill.theme', theme);
    window.localStorage.setItem('vaultbill.output-target', outputTarget);
    document.documentElement.dataset.theme = theme;
    setMessage('Business settings saved.');
  };

  const createOperator = async () => {
    const username = newUsername.trim().toLocaleLowerCase();
    const displayName = newDisplayName.trim();
    if (!username || !displayName) {
      setMessage('Username and display name are required.');
      return;
    }
    if (accounts.some((account) => account.username.toLocaleLowerCase() === username)) {
      setMessage('That username is already in use.');
      return;
    }
    try {
      await saveAccount({
        userId: crypto.randomUUID(),
        username,
        displayName,
        role: isSysAdmin ? newRole : 'User',
        isActive: true,
      });
      setNewUsername('');
      setNewDisplayName('');
      setNewRole('User');
      setMessage('Operator created. Set a password before enabling LAN login.');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Operator could not be created.');
    }
  };

  const changePassword = () => {
    void resetPassword(passwordUserId, newPassword)
      .then(() => {
        setNewPassword('');
        setMessage('Password updated.');
        if (passwordUserId === 'sysadmin_1') {
          window.localStorage.setItem('vaultbill.default-credentials-active', 'false');
        }
      })
      .catch((reason: unknown) => {
        setMessage(reason instanceof Error ? reason.message : 'Password could not be updated.');
      });
  };

  return (
    <div className="page-stack settings-page">
      <div className="operational-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>{isSysAdmin ? 'Administration settings' : 'Operator settings'}</h1>
          <p>
            {isSysAdmin
              ? 'Business, security, and integrations in one focused workspace.'
              : 'Manage User accounts and your own password.'}
          </p>
        </div>
      </div>
      <nav className="settings-jump-links" aria-label="Settings sections">
        {isSysAdmin ? <a href="#business">Business</a> : null}
        <a href="#security">Security</a>
        {isSysAdmin ? <a href="#integrations">Integrations</a> : null}
      </nav>

      {isSysAdmin ? (
        <form className="settings-section" id="business" onSubmit={saveBusiness}>
          <header>
            <p className="eyebrow">Business</p>
            <h2>Business operations</h2>
          </header>
          <div className="form-grid">
            <label>
              <span>Business name</span>
              <input
                value={companyName}
                onChange={(event) => {
                  setCompanyName(event.currentTarget.value);
                }}
              />
            </label>
            <label>
              <span>GSTIN</span>
              <input
                value={gstin}
                onChange={(event) => {
                  setGstin(event.currentTarget.value);
                }}
              />
            </label>
            <label className="span-2">
              <span>Business address</span>
              <textarea
                value={address}
                onChange={(event) => {
                  setAddress(event.currentTarget.value);
                }}
              />
            </label>
            <SearchableDropdown
              label="Theme"
              onChange={setTheme}
              options={themeOptions.map((option) => ({ value: option.id, label: option.label }))}
              value={theme}
            />
            <SearchableDropdown
              label="Printer / PDF default"
              onChange={setOutputTarget}
              options={[
                { value: 'PreviewOnly', label: 'Preview, then print' },
                { value: 'DownloadPdf', label: 'Download PDF' },
                ...(capabilities.canSelectExactPrinter
                  ? [{ value: 'SystemPrinter', label: 'System printer' }]
                  : []),
              ]}
              value={outputTarget}
            />
          </div>
          <div className="settings-inline-actions">
            <button type="button">Create backup</button>
            <button type="button">Restore backup</button>
            <button className="button-primary" type="submit">
              Save business
            </button>
          </div>
        </form>
      ) : null}

      <section className="settings-section" id="security">
        <header>
          <p className="eyebrow">Security</p>
          <h2>Accounts and access</h2>
        </header>
        {window.localStorage.getItem('vaultbill.default-credentials-active') !== 'false' &&
        isSysAdmin ? (
          <div className="feedback-warning">
            Default credentials are still active. Replace the System Administrator and backup
            passwords.
          </div>
        ) : null}
        <div className="settings-subsection">
          <div className="section-heading">
            <div>
              <h3>Operators</h3>
              <p>Create and maintain the accounts available at login.</p>
            </div>
            <UserRoundCog aria-hidden="true" />
          </div>
          <div className="operator-create">
            <label>
              <span>Username</span>
              <input
                value={newUsername}
                onChange={(event) => {
                  setNewUsername(event.currentTarget.value);
                }}
              />
            </label>
            <label>
              <span>Display name</span>
              <input
                value={newDisplayName}
                onChange={(event) => {
                  setNewDisplayName(event.currentTarget.value);
                }}
              />
            </label>
            {isSysAdmin ? (
              <SearchableDropdown
                label="Role"
                onChange={(value) => {
                  setNewRole(value as Role);
                }}
                options={[
                  { value: 'Admin', label: 'Admin' },
                  { value: 'User', label: 'User' },
                ]}
                value={newRole}
              />
            ) : null}
            <button
              className="button-primary"
              onClick={() => {
                void createOperator();
              }}
              type="button"
            >
              <Plus aria-hidden="true" size={18} /> Add operator
            </button>
          </div>
          <div className="operator-list">
            {manageableAccounts.map((account) => (
              <article key={account.userId}>
                <div>
                  <strong>{account.displayName}</strong>
                  <small>
                    {account.username} · {account.role}
                  </small>
                </div>
                <label className="checkbox-field">
                  <input
                    checked={account.isActive}
                    onChange={(event) => {
                      void saveAccount({
                        ...account,
                        isActive: event.currentTarget.checked,
                      });
                    }}
                    type="checkbox"
                  />
                  <span>Active</span>
                </label>
                <button
                  aria-label={`Remove ${account.displayName}`}
                  onClick={() => {
                    void archiveAccount(account.userId);
                  }}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={18} />
                </button>
              </article>
            ))}
          </div>
        </div>
        <div className="settings-subsection">
          <div className="section-heading">
            <div>
              <h3>Password</h3>
              <p>Set a final password for an account you may manage.</p>
            </div>
            <KeyRound aria-hidden="true" />
          </div>
          <div className="operator-create">
            <SearchableDropdown
              label="Account"
              onChange={setPasswordUserId}
              options={[
                {
                  value: operatorContext.account.userId,
                  label: `${operatorContext.account.displayName} (you)`,
                },
                ...manageableAccounts.map((account) => ({
                  value: account.userId,
                  label: account.displayName,
                })),
              ]}
              value={passwordUserId}
            />
            <label>
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.currentTarget.value);
                }}
              />
            </label>
            <button onClick={changePassword} type="button">
              Update password
            </button>
          </div>
        </div>
        {isSysAdmin ? (
          <div className="settings-subsection">
            <div className="section-heading">
              <div>
                <h3>Hosted web access</h3>
                <p>Serve the full role-authorized application from this desktop.</p>
              </div>
              <ShieldCheck aria-hidden="true" />
            </div>
            <label className="checkbox-field">
              <input
                checked={lanEnabled}
                disabled={!capabilities.canLanServer}
                onChange={(event) => {
                  const enabled = event.currentTarget.checked;
                  setLanEnabled(enabled);
                  window.localStorage.setItem('vaultbill.lan.enabled', String(enabled));
                  void window.vaultBillDesktop?.configureLocalApi({
                    lanEnabled: enabled,
                    passwordRequired: true,
                    port: 4317,
                  });
                }}
                type="checkbox"
              />
              <span>Allow authenticated devices on this network</span>
            </label>
          </div>
        ) : null}
      </section>

      {isSysAdmin ? (
        <section className="settings-section" id="integrations">
          <header>
            <p className="eyebrow">Integrations</p>
            <h2>Connected services</h2>
          </header>
          <div className="integration-grid">
            {['GST and GSP', 'SMS provider', 'Signature capture'].map((name) => (
              <article key={name}>
                <h3>{name}</h3>
                <p>Disabled until provider settings are configured.</p>
                <button type="button">Configure</button>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {message ? (
        <p className="feedback-info" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
};
