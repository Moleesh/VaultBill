/* eslint-disable max-lines */
import {
  ArchiveRestore,
  HardDriveDownload,
  KeyRound,
  Palette,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserRoundCog,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FC, SyntheticEvent } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { AppModal } from '../../components/AppModal/AppModal';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { themeOptions } from '../../constants/PhaseOneSeed';
import { createHostedBackup, requestHostedApi, restoreHostedBackup } from '../../runtime/HostedApi';
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

const themeSwatches = {
  'teal-flow': ['#0f7f75', '#dff4ef'],
  'slate-pro': ['#40566f', '#e7edf3'],
  'midnight-ink': ['#172436', '#4cc9a5'],
  'sandstone-ledger': ['#9a6b32', '#f1e4c9'],
  'indigo-mint': ['#4056a1', '#ccefe0'],
} as const;

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
  const [preferredPrinterName, setPreferredPrinterName] = useState(
    () => window.localStorage.getItem('vaultbill.preferred-printer') ?? '',
  );
  const [availablePrinters, setAvailablePrinters] = useState<
    readonly { readonly id: string; readonly name: string; readonly isDefault: boolean }[]
  >([]);
  const [lanEnabled, setLanEnabled] = useState(
    () => window.localStorage.getItem('vaultbill.lan.enabled') === 'true',
  );
  const [message, setMessage] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<Role>('User');
  const [passwordUserId, setPasswordUserId] = useState(operatorContext?.account.userId ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [encryptBackup, setEncryptBackup] = useState(true);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreRecoveryKey, setRestoreRecoveryKey] = useState('');
  const [restoreFile, setRestoreFile] = useState<File>();
  const [remoteAuthorizationPassword, setRemoteAuthorizationPassword] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetSysAdminPassword, setResetSysAdminPassword] = useState('');
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [credentialStatus, setCredentialStatus] = useState<{
    readonly sysAdminUsesDefaultPassword: boolean;
    readonly backupUsesDefaultPassword: boolean;
  }>();
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gspProvider, setGspProvider] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsProvider, setSmsProvider] = useState('');
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [trialStatus, setTrialStatus] = useState<{
    readonly isFullVersion: boolean;
    readonly isExpired: boolean;
    readonly accumulatedSeconds: number;
    readonly remainingSeconds: number;
  }>();

  useEffect(() => {
    if (window.vaultBillDesktop) {
      void window.vaultBillDesktop.getCredentialStatus().then(setCredentialStatus);
    } else if (capabilities.isLanBrowser) {
      void requestHostedApi<{
        readonly sysAdminUsesDefaultPassword: boolean;
        readonly backupUsesDefaultPassword: boolean;
      }>('/credentials/status').then(setCredentialStatus);
    }
    const businessRequest = window.vaultBillDesktop
      ? window.vaultBillDesktop.getBusinessSettings()
      : capabilities.isLanBrowser
        ? requestHostedApi('/settings/business')
        : undefined;
    void businessRequest?.then((rawSettings) => {
      const settings = rawSettings as {
        companyName?: unknown;
        address?: unknown;
        gstin?: unknown;
        theme?: unknown;
        outputTarget?: unknown;
      };
      if (typeof settings.companyName === 'string') setCompanyName(settings.companyName);
      if (typeof settings.address === 'string') setAddress(settings.address);
      if (typeof settings.gstin === 'string') setGstin(settings.gstin);
      if (typeof settings.theme === 'string') setTheme(settings.theme);
      if (typeof settings.outputTarget === 'string') setOutputTarget(settings.outputTarget);
    });
    const integrationRequest = window.vaultBillDesktop
      ? window.vaultBillDesktop.getIntegrationSettings()
      : capabilities.isLanBrowser
        ? requestHostedApi('/settings/integrations')
        : undefined;
    void integrationRequest?.then((rawSettings) => {
      const settings = rawSettings as {
        gstEnabled?: unknown;
        gspProvider?: unknown;
        smsEnabled?: unknown;
        smsProvider?: unknown;
        signatureEnabled?: unknown;
      };
      if (typeof settings.gstEnabled === 'boolean') setGstEnabled(settings.gstEnabled);
      if (typeof settings.gspProvider === 'string') setGspProvider(settings.gspProvider);
      if (typeof settings.smsEnabled === 'boolean') setSmsEnabled(settings.smsEnabled);
      if (typeof settings.smsProvider === 'string') setSmsProvider(settings.smsProvider);
      if (typeof settings.signatureEnabled === 'boolean')
        setSignatureEnabled(settings.signatureEnabled);
    });
    if (window.vaultBillDesktop?.listPrinters) {
      void window.vaultBillDesktop.listPrinters().then((printers) => {
        setAvailablePrinters(printers);
        const savedPrinter = window.localStorage.getItem('vaultbill.preferred-printer') ?? '';
        if (savedPrinter && !printers.some((printer) => printer.name === savedPrinter)) {
          window.localStorage.removeItem('vaultbill.preferred-printer');
          setPreferredPrinterName('');
          return;
        }
        if (!savedPrinter) {
          const defaultPrinter = printers.find((printer) => printer.isDefault)?.name ?? '';
          if (defaultPrinter) {
            setPreferredPrinterName(defaultPrinter);
            window.localStorage.setItem('vaultbill.preferred-printer', defaultPrinter);
          }
        }
      });
    } else {
      setAvailablePrinters([]);
    }
    if (window.vaultBillDesktop) {
      void window.vaultBillDesktop.getTrialStatus().then(setTrialStatus);
      void window.vaultBillDesktop.getHostedWebSettings().then((settings) => {
        setLanEnabled(settings.lanEnabled);
        window.localStorage.setItem('vaultbill.lan.enabled', String(settings.lanEnabled));
      });
    } else if (capabilities.isLanBrowser) {
      void requestHostedApi<NonNullable<typeof trialStatus>>('/trial/status').then(setTrialStatus);
    }
  }, [capabilities.isLanBrowser]);

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
    if (preferredPrinterName.trim()) {
      window.localStorage.setItem('vaultbill.preferred-printer', preferredPrinterName.trim());
    } else {
      window.localStorage.removeItem('vaultbill.preferred-printer');
    }
    document.documentElement.dataset.theme = theme;
    const settings = {
      companyName: companyName.trim(),
      address: address.trim(),
      gstin: gstin.trim(),
      theme,
      outputTarget,
    };
    const persistence = window.vaultBillDesktop
      ? window.vaultBillDesktop.saveBusinessSettings(settings)
      : capabilities.isLanBrowser
        ? requestHostedApi('/settings/business', 'POST', settings)
        : Promise.resolve(settings);
    void persistence
      .then(() => {
        setMessage('Business settings saved.');
      })
      .catch((reason: unknown) => {
        setMessage(
          reason instanceof Error ? reason.message : 'Business settings could not be saved.',
        );
      });
  };

  const saveIntegrations = () => {
    const settings = {
      gstEnabled,
      gspProvider,
      smsEnabled,
      smsProvider,
      signatureEnabled,
    };
    const persistence = window.vaultBillDesktop
      ? window.vaultBillDesktop.saveIntegrationSettings(settings)
      : capabilities.isLanBrowser
        ? requestHostedApi('/settings/integrations', 'POST', settings)
        : Promise.resolve(settings);
    void persistence
      .then(() => {
        setMessage('Integration settings saved.');
      })
      .catch((reason: unknown) => {
        setMessage(
          reason instanceof Error ? reason.message : 'Integration settings could not be saved.',
        );
      });
  };

  const activateLicense = () => {
    const activation = window.vaultBillDesktop
      ? window.vaultBillDesktop.activateLicense(licenseKey)
      : requestHostedApi<NonNullable<typeof trialStatus>>('/trial/activate', 'POST', {
          licenseKey,
        });
    void activation
      .then((status) => {
        setTrialStatus(status);
        setLicenseKey('');
        setMessage('VaultBill is activated for this installation.');
      })
      .catch((reason: unknown) => {
        setMessage(reason instanceof Error ? reason.message : 'Activation failed.');
      });
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
          void window.vaultBillDesktop?.getCredentialStatus().then(setCredentialStatus);
        }
      })
      .catch((reason: unknown) => {
        setMessage(reason instanceof Error ? reason.message : 'Password could not be updated.');
      });
  };

  const changeBackupPassword = () => {
    const bridge = window.vaultBillDesktop;
    setBusyAction('Updating backup password');
    const update = bridge
      ? bridge.setBackupPassword(backupPassword)
      : requestHostedApi<{
          readonly sysAdminUsesDefaultPassword: boolean;
          readonly backupUsesDefaultPassword: boolean;
        }>('/credentials/backup-password', 'POST', {
          currentPassword: remoteAuthorizationPassword,
          backupPassword,
        });
    void update
      .then((status) => {
        setCredentialStatus(status);
        setBackupPassword('');
        setMessage('Backup password updated securely.');
      })
      .catch((reason: unknown) => {
        setMessage(
          reason instanceof Error ? reason.message : 'Backup password could not be updated.',
        );
      })
      .finally(() => {
        setBusyAction('');
      });
  };

  const createBackup = () => {
    const bridge = window.vaultBillDesktop;
    if (
      !encryptBackup &&
      !window.confirm(
        'This backup will contain readable business data and credentials. Create it without encryption?',
      )
    ) {
      return;
    }
    setBusyAction('Creating verified backup');
    const creation = bridge
      ? bridge.createBackup({ encrypted: encryptBackup })
      : createHostedBackup(encryptBackup, remoteAuthorizationPassword).then((result) => {
          downloadBlob(result.blob, result.fileName);
          return {
            cancelled: false,
            filePath: result.fileName,
            ...(result.recoveryKey ? { recoveryKey: result.recoveryKey } : {}),
          };
        });
    void creation
      .then((result) => {
        if (result.cancelled) {
          setMessage('Backup creation cancelled.');
          return;
        }
        setRecoveryKey(result.recoveryKey ?? '');
        setMessage(`Backup saved to ${result.filePath ?? 'the selected location'}.`);
      })
      .catch((reason: unknown) => {
        setMessage(reason instanceof Error ? reason.message : 'Backup could not be created.');
      })
      .finally(() => {
        setBusyAction('');
      });
  };

  const restoreBackup = () => {
    const bridge = window.vaultBillDesktop;
    const selectedRestoreFile = restoreFile;
    if (!bridge && !selectedRestoreFile) {
      setMessage('Choose a VaultBill backup ZIP to restore.');
      return;
    }
    setRestoreOpen(false);
    setBusyAction('Validating and restoring backup');
    let restoration: Promise<{ readonly cancelled: boolean; readonly restarting?: boolean }>;
    if (bridge) {
      restoration = bridge.restoreBackup({
        ...(restorePassword ? { password: restorePassword } : {}),
        ...(restoreRecoveryKey ? { recoveryKey: restoreRecoveryKey } : {}),
      });
    } else if (selectedRestoreFile) {
      restoration = restoreHostedBackup(selectedRestoreFile, {
        sysAdminPassword: remoteAuthorizationPassword,
        ...(restorePassword ? { backupPassword: restorePassword } : {}),
        ...(restoreRecoveryKey ? { recoveryKey: restoreRecoveryKey } : {}),
      }).then(() => ({ cancelled: false, restarting: true }));
    } else {
      return;
    }
    void restoration
      .then((result) => {
        if (result.cancelled) {
          setMessage('Restore cancelled.');
          return;
        }
        setMessage('Backup validated. VaultBill is restarting with the restored database.');
        setRestoreOpen(false);
      })
      .catch((reason: unknown) => {
        setMessage(reason instanceof Error ? reason.message : 'Backup could not be restored.');
        setRestoreOpen(true);
      })
      .finally(() => {
        setBusyAction('');
      });
  };

  const resetApplication = () => {
    const bridge = window.vaultBillDesktop;
    setResetOpen(false);
    setBusyAction('Resetting VaultBill');
    const reset = bridge
      ? bridge.resetApplicationData({
          password: resetSysAdminPassword,
          confirmation: resetConfirmation,
        })
      : requestHostedApi<{ readonly restarting: boolean }>('/application/reset', 'POST', {
          currentPassword: resetSysAdminPassword,
          confirmation: resetConfirmation,
        });
    void reset
      .then(() => {
        setMessage('Application data removed. VaultBill is restarting.');
        setResetOpen(false);
      })
      .catch((reason: unknown) => {
        setMessage(reason instanceof Error ? reason.message : 'VaultBill could not be reset.');
        setResetOpen(true);
      })
      .finally(() => {
        setBusyAction('');
      });
  };

  const defaultCredentialsActive =
    credentialStatus?.sysAdminUsesDefaultPassword === true ||
    credentialStatus?.backupUsesDefaultPassword === true ||
    (!credentialStatus &&
      window.localStorage.getItem('vaultbill.default-credentials-active') !== 'false');

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
        {isSysAdmin ? <a href="#backup">Backup</a> : null}
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
            <label className="span-2">
              <span>Business address</span>
              <textarea
                value={address}
                onChange={(event) => {
                  setAddress(event.currentTarget.value);
                }}
              />
            </label>
            <fieldset className="settings-theme-picker">
              <legend>
                <Palette aria-hidden="true" size={17} /> Theme
              </legend>
              <div>
                {themeOptions.map((option) => (
                  <button
                    aria-pressed={theme === option.id}
                    key={option.id}
                    onClick={() => {
                      setTheme(option.id);
                      document.documentElement.dataset.theme = option.id;
                    }}
                    title={option.label}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        background: `linear-gradient(135deg, ${themeSwatches[option.id][0]} 50%, ${themeSwatches[option.id][1]} 50%)`,
                      }}
                    />
                    <small>{option.label}</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <SearchableDropdown
              label="Preferred printer"
              loading={capabilities.isDesktop && availablePrinters.length === 0}
              onChange={setPreferredPrinterName}
              options={
                availablePrinters.length > 0
                  ? availablePrinters.map((printer) => ({
                      value: printer.name,
                      label: printer.name,
                      ...(printer.isDefault ? { description: 'Default printer' } : {}),
                    }))
                  : [
                      {
                        value: '',
                        label: capabilities.isDesktop
                          ? 'No desktop printers found'
                          : 'Available in VaultBill Desktop',
                        disabled: true,
                      },
                    ]
              }
              value={preferredPrinterName}
            />
            <SearchableDropdown
              label="Print mode"
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
            <p className="field-note span-2">
              Choose a printer when VaultBill Desktop is available. Print mode still controls
              whether VaultBill previews, downloads a PDF, or sends directly to a printer.
            </p>
          </div>
          <div className="settings-inline-actions">
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
        {defaultCredentialsActive && isSysAdmin ? (
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
        {isSysAdmin && !capabilities.isDemoMode ? (
          <div className="settings-subsection">
            <div className="section-heading">
              <div>
                <h3>License and trial</h3>
                <p>
                  {trialStatus?.isFullVersion
                    ? 'Full version activated.'
                    : trialStatus?.isExpired
                      ? 'The accumulated-use trial has expired. Read-only access remains available.'
                      : `${String(Math.ceil((trialStatus?.remainingSeconds ?? 0) / 3600))} trial hours remaining.`}
                </p>
              </div>
              <KeyRound aria-hidden="true" />
            </div>
            {!trialStatus?.isFullVersion ? (
              <div className="operator-create">
                <label>
                  <span>License key</span>
                  <input
                    value={licenseKey}
                    onChange={(event) => {
                      setLicenseKey(event.currentTarget.value);
                    }}
                  />
                </label>
                <button disabled={!licenseKey.trim()} onClick={activateLicense} type="button">
                  Activate full version
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
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

      {isSysAdmin && (capabilities.isDesktop || capabilities.isLanBrowser) ? (
        <section className="settings-section" id="backup">
          <header>
            <p className="eyebrow">Backup</p>
            <h2>Backup workspace</h2>
          </header>
          <div className="settings-subsection">
            <div className="section-heading">
              <div>
                <h3>Backup and restore</h3>
                <p>Create a verified backup or restore one from a checked VaultBill archive.</p>
              </div>
              <ArchiveRestore aria-hidden="true" />
            </div>
            {capabilities.canBackup ? (
              <div className="operator-create">
                <label className="checkbox-field">
                  <input
                    checked={encryptBackup}
                    onChange={(event) => {
                      setEncryptBackup(event.currentTarget.checked);
                    }}
                    type="checkbox"
                  />
                  <span>Encrypt backup</span>
                </label>
                <button disabled={Boolean(busyAction)} onClick={createBackup} type="button">
                  <HardDriveDownload aria-hidden="true" size={18} /> Create backup
                </button>
              </div>
            ) : null}
            {capabilities.isLanBrowser && (capabilities.canBackup || capabilities.canRestore) ? (
              <label>
                <span>System Administrator password for host operations</span>
                <input
                  autoComplete="current-password"
                  type="password"
                  value={remoteAuthorizationPassword}
                  onChange={(event) => {
                    setRemoteAuthorizationPassword(event.currentTarget.value);
                  }}
                />
              </label>
            ) : null}
            {capabilities.canRestore ? (
              <button
                disabled={Boolean(busyAction)}
                onClick={() => {
                  setRestoreOpen(true);
                }}
                type="button"
              >
                <ArchiveRestore aria-hidden="true" size={18} /> Restore backup
              </button>
            ) : null}
            {!encryptBackup && capabilities.canBackup ? (
              <p className="feedback-warning">
                Unencrypted backups expose business data and stored settings to anyone who opens
                the file.
              </p>
            ) : null}
          </div>
          <div className="settings-subsection">
            <div className="section-heading">
              <div>
                <h3>Backup password</h3>
                <p>Encrypt new backups with a password protected by the desktop secure store.</p>
              </div>
              <ShieldCheck aria-hidden="true" />
            </div>
            <div className="operator-create">
              <label>
                <span>New backup password</span>
                <input
                  autoComplete="new-password"
                  type="password"
                  value={backupPassword}
                  onChange={(event) => {
                    setBackupPassword(event.currentTarget.value);
                  }}
                />
              </label>
              <button disabled={Boolean(busyAction)} onClick={changeBackupPassword} type="button">
                Update backup password
              </button>
            </div>
          </div>
          <div className="settings-subsection danger-zone">
            <div className="section-heading">
              <div>
                <h3>Reset application data</h3>
                <p>Remove all local business data, accounts, trial state, and activation.</p>
              </div>
              <RotateCcw aria-hidden="true" />
            </div>
            <button
              disabled={Boolean(busyAction)}
              onClick={() => {
                setResetOpen(true);
              }}
              type="button"
            >
              Reset application data
            </button>
          </div>
        </section>
      ) : null}

      {isSysAdmin ? (
        <section className="settings-section" id="integrations">
          <header>
            <p className="eyebrow">Integrations</p>
            <h2>Connected services</h2>
          </header>
          <div className="integration-grid">
            <article>
              <h3>GST and GSP</h3>
              <label className="checkbox-field">
                <input
                  checked={gstEnabled}
                  onChange={(event) => {
                    setGstEnabled(event.currentTarget.checked);
                  }}
                  type="checkbox"
                />
                <span>Enable GST/GSP helpers</span>
              </label>
              <label>
                <span>Provider</span>
                <input
                  disabled={!gstEnabled}
                  value={gspProvider}
                  onChange={(event) => {
                    setGspProvider(event.currentTarget.value);
                  }}
                />
              </label>
            </article>
            <article>
              <h3>SMS provider</h3>
              <label className="checkbox-field">
                <input
                  checked={smsEnabled}
                  onChange={(event) => {
                    setSmsEnabled(event.currentTarget.checked);
                  }}
                  type="checkbox"
                />
                <span>Enable SMS notifications</span>
              </label>
              <label>
                <span>Provider</span>
                <input
                  disabled={!smsEnabled}
                  value={smsProvider}
                  onChange={(event) => {
                    setSmsProvider(event.currentTarget.value);
                  }}
                />
              </label>
            </article>
            <article>
              <h3>Signature capture</h3>
              <label className="checkbox-field">
                <input
                  checked={signatureEnabled}
                  onChange={(event) => {
                    setSignatureEnabled(event.currentTarget.checked);
                  }}
                  type="checkbox"
                />
                <span>Allow on-screen signature capture</span>
              </label>
            </article>
          </div>
          <button className="button-primary" onClick={saveIntegrations} type="button">
            Save integrations
          </button>
        </section>
      ) : null}
      {message ? (
        <p className="feedback-info" role="status">
          {message}
        </p>
      ) : null}
      <AppModal
        isOpen={restoreOpen}
        onClose={() => {
          if (!busyAction) setRestoreOpen(false);
        }}
        title="Restore VaultBill backup"
      >
        <p>
          The backup is checked and staged before the current database is replaced. VaultBill
          restarts after a successful restore.
        </p>
        {capabilities.isLanBrowser ? (
          <label>
            <span>VaultBill backup ZIP</span>
            <input
              accept=".zip,application/zip"
              onChange={(event) => {
                setRestoreFile(event.currentTarget.files?.[0]);
              }}
              type="file"
            />
          </label>
        ) : null}
        <label>
          <span>Backup password</span>
          <input
            autoComplete="current-password"
            type="password"
            value={restorePassword}
            onChange={(event) => {
              setRestorePassword(event.currentTarget.value);
            }}
          />
        </label>
        <label>
          <span>Recovery key (optional)</span>
          <textarea
            value={restoreRecoveryKey}
            onChange={(event) => {
              setRestoreRecoveryKey(event.currentTarget.value);
            }}
          />
        </label>
        <div className="popup-actions">
          <button
            disabled={Boolean(busyAction)}
            onClick={() => {
              setRestoreOpen(false);
            }}
            type="button"
          >
            Cancel
          </button>
          <button
            className="button-primary"
            disabled={Boolean(busyAction)}
            onClick={restoreBackup}
            type="button"
          >
            Choose and restore
          </button>
        </div>
      </AppModal>
      <AppModal
        isOpen={resetOpen}
        onClose={() => {
          if (!busyAction) setResetOpen(false);
        }}
        title="Reset application data"
      >
        <p className="feedback-warning">
          This permanently removes records, formats, operators, settings, trial time, and activation
          from this installation.
        </p>
        <label>
          <span>System Administrator password</span>
          <input
            autoComplete="current-password"
            type="password"
            value={resetSysAdminPassword}
            onChange={(event) => {
              setResetSysAdminPassword(event.currentTarget.value);
            }}
          />
        </label>
        <label>
          <span>Type RESET VAULTBILL</span>
          <input
            value={resetConfirmation}
            onChange={(event) => {
              setResetConfirmation(event.currentTarget.value);
            }}
          />
        </label>
        <div className="popup-actions">
          <button
            disabled={Boolean(busyAction)}
            onClick={() => {
              setResetOpen(false);
            }}
            type="button"
          >
            Keep my data
          </button>
          <button
            className="button-primary"
            disabled={
              Boolean(busyAction) ||
              !resetSysAdminPassword ||
              resetConfirmation !== 'RESET VAULTBILL'
            }
            onClick={resetApplication}
            type="button"
          >
            Reset and restart
          </button>
        </div>
      </AppModal>
      <AppModal
        isOpen={Boolean(recoveryKey)}
        onClose={() => {
          setRecoveryKey('');
        }}
        title="Save your recovery key"
      >
        <p>
          Store this key separately from the backup. It can restore the backup if its password is
          unavailable.
        </p>
        <textarea aria-label="Backup recovery key" readOnly value={recoveryKey} />
        <button
          className="button-primary"
          onClick={() => {
            void navigator.clipboard.writeText(recoveryKey);
            setMessage('Recovery key copied.');
          }}
          type="button"
        >
          Copy recovery key
        </button>
      </AppModal>
      <AppModal
        isOpen={Boolean(busyAction)}
        onClose={() => undefined}
        title={busyAction || 'Working'}
      >
        <div className="print-progress" aria-live="polite">
          <strong>{busyAction}</strong>
          <progress aria-label={busyAction} />
          <p>Please keep VaultBill open while this operation completes.</p>
        </div>
      </AppModal>
    </div>
  );
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};
