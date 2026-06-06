import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FC } from 'react';

import { AppBrandIcon } from '../../components/AppBrandIcon/AppBrandIcon';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { themeOptions } from '../../constants/PhaseOneSeed';
import type { ThemeId } from '../../types/AppTypes';

const steps = [
  'Welcome',
  'Business Profile',
  'Create SysAdmin',
  'Create Admin',
  'Choose Theme',
  'Backup Password',
] as const;

export const setupCompleteStorageKey = 'vaultbill.setup.complete';

export const isFirstRunSetupRequired = (isDemoMode: boolean): boolean =>
  !isDemoMode && window.localStorage.getItem(setupCompleteStorageKey) !== 'true';

type SetupPageProps = {
  readonly onComplete?: () => void;
};

export const SetupPage: FC<SetupPageProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [sysAdminName, setSysAdminName] = useState('System Administrator');
  const [adminName, setAdminName] = useState('Operations Admin');
  const [themeId, setThemeId] = useState<ThemeId>('teal-flow');
  const [backupPassword, setBackupPassword] = useState('');
  const activeStep = steps[stepIndex] ?? 'Welcome';

  const completeSetup = () => {
    window.localStorage.setItem(
      'vaultbill.business-profile',
      JSON.stringify({ companyName: companyName.trim() }),
    );
    window.localStorage.setItem(
      'vaultbill.accounts',
      JSON.stringify([
        {
          userId: 'sysadmin_1',
          username: 'sysadmin',
          displayName: sysAdminName.trim() || 'System Administrator',
          role: 'SysAdmin',
          isActive: true,
        },
        {
          userId: 'admin_1',
          username: 'admin',
          displayName: adminName.trim() || 'Operations Admin',
          role: 'Admin',
          isActive: true,
        },
      ]),
    );
    window.localStorage.setItem('vaultbill.theme', themeId);
    window.localStorage.setItem(
      'vaultbill.backup-password-configured',
      String(Boolean(backupPassword)),
    );
    window.localStorage.setItem(setupCompleteStorageKey, 'true');
    onComplete?.();
    void navigate('/login', { replace: true });
  };

  return (
    <main className="setup-page">
      <section className="setup-card">
        <header className="setup-card__header">
          <AppBrandIcon size="medium" />
          <div>
            <p className="eyebrow">First-run setup</p>
            <h1>Prepare VaultBill for your business</h1>
          </div>
        </header>
        <HorizontalProgress className="setup-steps" label="Setup steps">
          {steps.map((step, index) => (
            <button
              aria-current={index === stepIndex ? 'step' : undefined}
              disabled={index > stepIndex}
              key={step}
              onClick={() => {
                setStepIndex(index);
              }}
              type="button"
            >
              <small>{index + 1}</small>
              {step}
            </button>
          ))}
        </HorizontalProgress>
        <section className="setup-card__content" aria-labelledby="setup-step-title">
          <div>
            <p className="eyebrow">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <h2 id="setup-step-title">{activeStep}</h2>
          </div>
          {activeStep === 'Welcome' ? (
            <p>
              This short setup creates the business profile and operator accounts used by the full
              application. The product name remains VaultBill.
            </p>
          ) : null}
          {activeStep === 'Business Profile' ? (
            <label>
              <span>Business name</span>
              <input
                autoFocus
                onChange={(event) => {
                  setCompanyName(event.currentTarget.value);
                }}
                placeholder="Your registered business name"
                value={companyName}
              />
            </label>
          ) : null}
          {activeStep === 'Create SysAdmin' ? (
            <label>
              <span>SysAdmin display name</span>
              <input
                autoFocus
                onChange={(event) => {
                  setSysAdminName(event.currentTarget.value);
                }}
                value={sysAdminName}
              />
            </label>
          ) : null}
          {activeStep === 'Create Admin' ? (
            <label>
              <span>Admin display name</span>
              <input
                autoFocus
                onChange={(event) => {
                  setAdminName(event.currentTarget.value);
                }}
                value={adminName}
              />
            </label>
          ) : null}
          {activeStep === 'Choose Theme' ? (
            <SearchableDropdown
              label="Application theme"
              onChange={(value) => {
                setThemeId(value as ThemeId);
              }}
              options={themeOptions.map((theme) => ({ label: theme.label, value: theme.id }))}
              value={themeId}
            />
          ) : null}
          {activeStep === 'Backup Password' ? (
            <label>
              <span>Optional backup password</span>
              <input
                autoFocus
                onChange={(event) => {
                  setBackupPassword(event.currentTarget.value);
                }}
                placeholder="Recommended for encrypted backups"
                type="password"
                value={backupPassword}
              />
              <small>VaultBill records only whether a password was configured in this UI.</small>
            </label>
          ) : null}
        </section>
        <footer className="setup-card__actions">
          <button
            disabled={stepIndex === 0}
            onClick={() => {
              setStepIndex((current) => Math.max(0, current - 1));
            }}
            type="button"
          >
            Back
          </button>
          {stepIndex < steps.length - 1 ? (
            <button
              className="button-primary"
              onClick={() => {
                setStepIndex((current) => Math.min(steps.length - 1, current + 1));
              }}
              type="button"
            >
              Next
            </button>
          ) : (
            <button className="button-primary" onClick={completeSetup} type="button">
              Start using VaultBill
            </button>
          )}
        </footer>
      </section>
    </main>
  );
};
