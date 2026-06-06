/* eslint-disable max-lines */
import { useState } from 'react';
import type { FC, SyntheticEvent } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { themeOptions } from '../../constants/PhaseOneSeed';
import { useSession } from '../auth/SessionContext';

type SettingsSection =
  | 'Business Profile'
  | 'Branding'
  | 'Operators'
  | 'Printer & PDF'
  | 'Backup'
  | 'Security'
  | 'Network'
  | 'Themes'
  | 'Help';

const sectionsByRole: Record<'Admin' | 'SysAdmin', readonly SettingsSection[]> = {
  Admin: [
    'Business Profile',
    'Operators',
    'Printer & PDF',
    'Backup',
    'Security',
    'Network',
    'Themes',
    'Help',
  ],
  SysAdmin: ['Business Profile', 'Branding', 'Security', 'Themes', 'Help'],
};

const readText = (key: string, fallback = ''): string =>
  window.localStorage.getItem(key) ?? fallback;

export const SettingsPage: FC = () => {
  const capabilities = useCapabilities();
  const { accounts, operatorContext } = useSession();
  const role = operatorContext?.role === 'SysAdmin' ? 'SysAdmin' : 'Admin';
  const visibleSections = sectionsByRole[role];
  const [activeSection, setActiveSection] = useState<SettingsSection>(visibleSections[0] ?? 'Help');
  const [companyName, setCompanyName] = useState(() =>
    readText('vaultbill.company-name', 'My Business'),
  );
  const [tagline, setTagline] = useState(() => readText('vaultbill.brand-tagline'));
  const [accent, setAccent] = useState(() => readText('vaultbill.brand-accent', '#087f6f'));
  const [outputTarget, setOutputTarget] = useState(() =>
    readText('vaultbill.output-target', 'PreviewOnly'),
  );
  const [theme, setTheme] = useState(() => readText('vaultbill.theme', 'teal-flow'));
  const [backupEncrypted, setBackupEncrypted] = useState(
    () => readText('vaultbill.backup.encrypted', 'true') === 'true',
  );
  const [lanEnabled, setLanEnabled] = useState(
    () => readText('vaultbill.lan.enabled', 'false') === 'true',
  );
  const [lanPasswordRequired, setLanPasswordRequired] = useState(
    () => readText('vaultbill.lan.password-required', 'true') === 'true',
  );
  const [sysAdminPassword, setSysAdminPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [message, setMessage] = useState('');

  const saveSection = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeSection === 'Business Profile') {
      if (!companyName.trim()) {
        setMessage('Business name is required.');
        return;
      }
      window.localStorage.setItem('vaultbill.company-name', companyName.trim());
    }
    if (activeSection === 'Branding') {
      window.localStorage.setItem('vaultbill.brand-tagline', tagline.trim());
      window.localStorage.setItem('vaultbill.brand-accent', accent);
    }
    if (activeSection === 'Printer & PDF') {
      window.localStorage.setItem('vaultbill.output-target', outputTarget);
    }
    if (activeSection === 'Backup') {
      window.localStorage.setItem('vaultbill.backup.encrypted', String(backupEncrypted));
    }
    if (activeSection === 'Network') {
      window.localStorage.setItem('vaultbill.lan.enabled', String(lanEnabled));
      window.localStorage.setItem('vaultbill.lan.password-required', String(lanPasswordRequired));
      void window.vaultBillDesktop?.configureLocalApi({
        lanEnabled,
        passwordRequired: lanPasswordRequired,
        port: 4317,
      });
    }
    if (activeSection === 'Themes') {
      window.localStorage.setItem('vaultbill.theme', theme);
      document.documentElement.dataset.theme = theme;
    }
    setMessage(`${activeSection} settings saved.`);
  };

  return (
    <div className="page-stack settings-page">
      <div className="operational-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Application settings</h1>
          <p>Only controls available to the current role and platform are shown.</p>
        </div>
      </div>
      <HorizontalProgress className="page-tabs settings-tabs" label="Settings sections">
        {visibleSections.map((section) => (
          <button
            aria-pressed={activeSection === section}
            key={section}
            onClick={() => {
              setActiveSection(section);
              setMessage('');
            }}
            type="button"
          >
            {section}
          </button>
        ))}
      </HorizontalProgress>
      <form className="settings-panel" onSubmit={saveSection}>
        <header>
          <p className="eyebrow">{activeSection}</p>
          <h2>{activeSection}</h2>
          <p className="field-note">Configure this area for the local VaultBill installation.</p>
        </header>

        {activeSection === 'Business Profile' ? (
          <div className="form-grid">
            <label>
              <span>Business name</span>
              <input
                onChange={(event) => {
                  setCompanyName(event.currentTarget.value);
                }}
                value={companyName}
              />
            </label>
            <label>
              <span>Product</span>
              <input readOnly value="VaultBill" />
              <small>The product name is fixed and cannot be rebranded.</small>
            </label>
          </div>
        ) : null}

        {activeSection === 'Branding' ? (
          <div className="form-grid">
            <label>
              <span>Business tagline</span>
              <input
                onChange={(event) => {
                  setTagline(event.currentTarget.value);
                }}
                value={tagline}
              />
            </label>
            <label>
              <span>Accent color</span>
              <input
                onChange={(event) => {
                  setAccent(event.currentTarget.value);
                }}
                type="color"
                value={accent}
              />
            </label>
          </div>
        ) : null}

        {activeSection === 'Operators' ? (
          <div className="product-table-wrap">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.userId}>
                    <td>{account.displayName}</td>
                    <td>{account.username}</td>
                    <td>{account.role}</td>
                    <td>{account.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeSection === 'Printer & PDF' ? (
          <div className="form-grid">
            <SearchableDropdown
              label="Output profile"
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
            {!capabilities.canSelectExactPrinter ? (
              <div className="feedback-info">
                Exact printer selection is available only in the desktop application.
              </div>
            ) : null}
          </div>
        ) : null}

        {activeSection === 'Backup' ? (
          <div className="form-grid">
            <label className="checkbox-field">
              <input
                checked={backupEncrypted}
                onChange={(event) => {
                  setBackupEncrypted(event.currentTarget.checked);
                }}
                type="checkbox"
              />
              <span>Encrypt backups by default</span>
            </label>
            {!capabilities.canBackup ? (
              <div className="feedback-info">Backup creation is available in the desktop app.</div>
            ) : null}
            {!backupEncrypted ? (
              <div className="feedback-warning">
                Unencrypted backups may contain business data and stored integration secrets.
              </div>
            ) : null}
          </div>
        ) : null}

        {activeSection === 'Security' ? (
          <div className="form-grid">
            <label>
              <span>SysAdmin password</span>
              <input
                autoComplete="current-password"
                onChange={(event) => {
                  setSysAdminPassword(event.currentTarget.value);
                }}
                type="password"
                value={sysAdminPassword}
              />
            </label>
            <label>
              <span>Permanent delete confirmation</span>
              <input
                onChange={(event) => {
                  setDeleteConfirmation(event.currentTarget.value);
                }}
                placeholder="Type DELETE"
                value={deleteConfirmation}
              />
            </label>
            <button
              className="button-danger"
              disabled={role !== 'SysAdmin' || !sysAdminPassword || deleteConfirmation !== 'DELETE'}
              onClick={() => {
                setMessage('Permanent delete authorization verified. No item was selected.');
              }}
              type="button"
            >
              Authorize permanent delete
            </button>
          </div>
        ) : null}

        {activeSection === 'Network' ? (
          <div className="form-grid">
            <label className="checkbox-field">
              <input
                checked={lanEnabled}
                disabled={!capabilities.canLanServer}
                onChange={(event) => {
                  setLanEnabled(event.currentTarget.checked);
                }}
                type="checkbox"
              />
              <span>Enable LAN browser access</span>
            </label>
            <label className="checkbox-field">
              <input
                checked={lanPasswordRequired}
                onChange={(event) => {
                  setLanPasswordRequired(event.currentTarget.checked);
                }}
                type="checkbox"
              />
              <span>Require operator password</span>
            </label>
            {!capabilities.canLanServer ? (
              <div className="feedback-info">LAN hosting is managed by the desktop app.</div>
            ) : null}
            {lanEnabled && !lanPasswordRequired ? (
              <div className="feedback-warning">
                Passwordless LAN is enabled. Anyone on the configured network may reach the login
                screen.
              </div>
            ) : null}
          </div>
        ) : null}

        {activeSection === 'Themes' ? (
          <SearchableDropdown
            label="Theme"
            onChange={setTheme}
            options={themeOptions.map((option) => ({ value: option.id, label: option.label }))}
            value={theme}
          />
        ) : null}

        {activeSection === 'Help' ? (
          <div className="help-sections">
            <section>
              <h3>Records</h3>
              <p>Create drafts, finalize documents, and find reprints.</p>
            </section>
            <section>
              <h3>Safety</h3>
              <p>LAN is off by default. Encrypt backups before sharing them.</p>
            </section>
            <a href="https://github.com/" rel="noreferrer" target="_blank">
              Open project help
            </a>
          </div>
        ) : null}

        {message ? (
          <p className="feedback-info" role="status">
            {message}
          </p>
        ) : null}
        <footer className="settings-actions">
          <a href="/help#settings">Help</a>
          {activeSection !== 'Help' && activeSection !== 'Operators' ? (
            <button className="button-primary" type="submit">
              Save {activeSection}
            </button>
          ) : null}
        </footer>
      </form>
    </div>
  );
};
